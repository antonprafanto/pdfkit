import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ConnectivityService } from './services/connectivity.service';
import { officeConversionService } from './services/office-conversion.service';
import { createMenu } from './menu';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let connectivityService: ConnectivityService;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false, // Don't show until ready
    backgroundColor: '#ffffff',
    title: 'PDF Kit',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup menu
  const menu = createMenu(mainWindow);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // Initialize connectivity service
  connectivityService = new ConnectivityService();
  connectivityService.startMonitoring();

  // Listen for connectivity changes
  connectivityService.on('status-changed', (isOnline: boolean) => {
    if (mainWindow) {
      mainWindow.webContents.send('connectivity-status', isOnline);
    }
  });

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    connectivityService?.stopMonitoring();
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-connectivity-status', () => {
  return connectivityService.isOnline();
});

ipcMain.handle('check-connectivity', async () => {
  const isOnline = await connectivityService.checkConnectivity();
  return isOnline;
});

// App info
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// File save handlers
ipcMain.handle('save-file-dialog', async (_, defaultName: string) => {
  if (!mainWindow) return null;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save PDF',
    defaultPath: defaultName,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  return result.filePath;
});

ipcMain.handle('save-pdf-file', async (_, filePath: string, pdfBytes: Uint8Array) => {
  try {
    const buffer = Buffer.from(pdfBytes);
    await fs.promises.writeFile(filePath, buffer);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving PDF:', error);
    return { success: false, error: error.message };
  }
});

// File open handlers (multiple files for merge)
ipcMain.handle('open-multiple-files-dialog', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select PDF Files',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    properties: ['openFile', 'multiSelections'],
  });

  if (result.canceled) return null;

  // Read all selected files
  const files: Array<{ name: string; data: Uint8Array }> = [];

  for (const filePath of result.filePaths) {
    const buffer = await fs.promises.readFile(filePath);
    const name = path.basename(filePath);
    files.push({
      name,
      data: new Uint8Array(buffer),
    });
  }

  return files;
});

// PDF Encryption handler using coherentpdf.js
ipcMain.handle('encrypt-pdf', async (_, pdfBytes: Uint8Array, options: {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
  };
}) => {
  try {
    const cpdf = require('coherentpdf');
    const tempDir = path.join(app.getPath('temp'), 'pdf-kit-encryption');
    
    // Create temp directory if not exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = path.join(tempDir, `input-${Date.now()}.pdf`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.pdf`);

    // Write input PDF
    await fs.promises.writeFile(inputPath, Buffer.from(pdfBytes));

    // Load PDF with coherentpdf
    const pdf = cpdf.fromFile(inputPath, '');

    // Build permissions array
    const perms: number[] = [];
    if (options.permissions?.printing) perms.push(cpdf.noEdit);
    if (!options.permissions?.copying) perms.push(cpdf.noCopy);
    if (!options.permissions?.modifying) perms.push(cpdf.noEdit);
    if (!options.permissions?.annotating) perms.push(cpdf.noAnnot);

    // Encrypt and save
    cpdf.toFileEncrypted(
      pdf,
      cpdf.aes256bitISO, // AES 256-bit encryption
      perms,
      options.ownerPassword || options.userPassword || 'owner',
      options.userPassword || '',
      false, // linearize
      false, // preserveObjStm
      outputPath
    );

    // Read encrypted PDF
    const encryptedBuffer = await fs.promises.readFile(outputPath);
    const encryptedBytes = new Uint8Array(encryptedBuffer);

    // Cleanup temp files
    try {
      await fs.promises.unlink(inputPath);
      await fs.promises.unlink(outputPath);
      cpdf.deletePdf(pdf);
    } catch (e) {
      // Ignore cleanup errors
    }

    return { success: true, data: encryptedBytes };
  } catch (error: any) {
    console.error('Encryption error:', error);
    return { success: false, error: error.message };
  }
});

// Office Conversion handlers
ipcMain.handle('check-libreoffice', async () => {
  return await officeConversionService.checkInstallation();
});

ipcMain.handle('convert-office-to-pdf', async (_, filePath: string) => {
  return await officeConversionService.convertToPDF(filePath);
});

ipcMain.handle('open-office-file-dialog', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Office Document',
    filters: [
      { name: 'Office Documents', extensions: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'] },
      { name: 'Word Documents', extensions: ['doc', 'docx', 'odt', 'rtf'] },
      { name: 'Excel Spreadsheets', extensions: ['xls', 'xlsx', 'ods', 'csv'] },
      { name: 'PowerPoint', extensions: ['ppt', 'pptx', 'odp'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Mammoth.js conversion (Word only, pure JS, no install required)
ipcMain.handle('convert-docx-mammoth', async (_, filePath: string) => {
  try {
    const mammoth = require('mammoth');
    const tempDir = path.join(app.getPath('temp'), 'pdf-kit-mammoth');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ path: filePath });
    const htmlContent = result.value;

    // Create styled HTML document with professional paper-like appearance
    const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', 'Georgia', serif;
      font-size: 11pt;
      line-height: 1.5;
      margin: 0;
      padding: 2cm;
      color: #000;
      background: white;
      max-width: 21cm;
      min-height: 29.7cm;
    }
    
    /* Title styling */
    h1 {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 12pt 0;
      line-height: 1.3;
    }
    
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin: 14pt 0 6pt 0;
      text-transform: uppercase;
    }
    
    h3 {
      font-size: 11pt;
      font-weight: bold;
      font-style: italic;
      margin: 10pt 0 4pt 0;
    }
    
    h4, h5, h6 {
      font-size: 11pt;
      font-weight: bold;
      margin: 8pt 0 4pt 0;
    }
    
    /* Paragraph styling */
    p {
      margin: 0 0 8pt 0;
      text-align: justify;
      text-indent: 0.5cm;
    }
    
    /* First paragraph after heading - no indent */
    h1 + p, h2 + p, h3 + p, h4 + p {
      text-indent: 0;
    }
    
    /* Abstract styling */
    p strong:first-child {
      text-transform: uppercase;
    }
    
    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12pt 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 6pt 8pt;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    
    caption {
      font-size: 10pt;
      margin-bottom: 6pt;
      text-align: center;
      font-weight: bold;
    }
    
    /* Images and figures */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12pt auto;
    }
    
    figure {
      margin: 12pt 0;
      text-align: center;
    }
    
    figcaption {
      font-size: 10pt;
      margin-top: 6pt;
      text-align: center;
    }
    
    /* Lists */
    ul, ol {
      margin: 8pt 0;
      padding-left: 1cm;
    }
    
    li {
      margin: 3pt 0;
      text-align: justify;
    }
    
    /* Superscripts and subscripts */
    sup {
      font-size: 8pt;
      vertical-align: super;
      line-height: 0;
    }
    
    sub {
      font-size: 8pt;
      vertical-align: sub;
      line-height: 0;
    }
    
    /* Block quotes */
    blockquote {
      margin: 12pt 1cm;
      font-style: italic;
      border-left: 3px solid #666;
      padding-left: 12pt;
    }
    
    /* Code blocks */
    pre, code {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      background: #f5f5f5;
      padding: 2pt 4pt;
    }
    
    pre {
      padding: 8pt;
      margin: 8pt 0;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    /* Links */
    a {
      color: #0066cc;
      text-decoration: none;
    }
    
    /* Emphasis */
    em {
      font-style: italic;
    }
    
    strong {
      font-weight: bold;
    }
    
    /* Author affiliations common pattern */
    p:has(sup) {
      text-align: center;
      text-indent: 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    // Save HTML file
    const htmlPath = path.join(tempDir, `converted-${Date.now()}.html`);
    const pdfPath = path.join(tempDir, `output-${Date.now()}.pdf`);
    await fs.promises.writeFile(htmlPath, styledHtml, 'utf-8');

    // Convert HTML to PDF using hidden BrowserWindow
    const { BrowserWindow: HiddenWindow } = require('electron');
    const hiddenWin = new HiddenWindow({
      show: false,
      webPreferences: {
        offscreen: true,
      },
    });

    await hiddenWin.loadFile(htmlPath);
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate PDF
    const pdfData = await hiddenWin.webContents.printToPDF({
      printBackground: true,
      margins: {
        marginType: 'default',
      },
    });
    
    // Save PDF
    await fs.promises.writeFile(pdfPath, pdfData);
    
    // Cleanup
    hiddenWin.destroy();

    return {
      success: true,
      outputPath: pdfPath,
      warnings: result.messages.map((m: any) => m.message),
    };
  } catch (error: any) {
    console.error('Mammoth conversion error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// ConvertAPI Cloud conversion
ipcMain.handle('convert-cloud-api', async (_, filePath: string, apiKey: string) => {
  try {
    const ConvertAPI = require('convertapi');
    const convertapi = new ConvertAPI(apiKey);
    const tempDir = path.join(app.getPath('temp'), 'pdf-kit-cloudapi');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Convert to PDF using ConvertAPI
    const result = await convertapi.convert('pdf', {
      File: filePath,
    });

    // Save the converted file
    const outputPath = path.join(tempDir, `converted-${Date.now()}.pdf`);
    await result.saveFiles(outputPath);

    return {
      success: true,
      outputPath,
    };
  } catch (error: any) {
    console.error('ConvertAPI error:', error);
    return {
      success: false,
      error: error.message || 'Cloud conversion failed. Check your API key.',
    };
  }
});

// Copy file from temp to user location
ipcMain.handle('copy-file', async (_, sourcePath: string, destPath: string) => {
  try {
    await fs.promises.copyFile(sourcePath, destPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Open URL in default browser
ipcMain.handle('open-external', async (_, url: string) => {
  await shell.openExternal(url);
});

// Sign PDF with P12 certificate
ipcMain.handle('sign-pdf', async (_, pdfBytes: Uint8Array, p12Bytes: Uint8Array, password: string, reason?: string, location?: string) => {
  try {
    const { SignPdf } = require('@signpdf/signpdf');
    const { P12Signer } = require('@signpdf/signer-p12');
    const { pdflibAddPlaceholder } = require('@signpdf/placeholder-pdf-lib');
    const { PDFDocument } = require('pdf-lib');

    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Add signature placeholder
    pdflibAddPlaceholder({
      pdfDoc,
      reason: reason || 'Signed with PDF Kit',
      contactInfo: '',
      name: 'Digital Signature',
      location: location || '',
    });

    // Save PDF with placeholder
    const pdfWithPlaceholder = await pdfDoc.save();

    // Create signer with P12 certificate
    const signer = new P12Signer(Buffer.from(p12Bytes), { passphrase: password });
    
    // Sign PDF
    const signPdf = new SignPdf();
    const signedPdf = await signPdf.sign(Buffer.from(pdfWithPlaceholder), signer);

    // Save to temp file
    const tempDir = path.join(app.getPath('temp'), 'pdf-kit-signed');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const outputPath = path.join(tempDir, `signed-${Date.now()}.pdf`);
    await fs.promises.writeFile(outputPath, signedPdf);

    return {
      success: true,
      outputPath,
      signedPdfBytes: new Uint8Array(signedPdf),
    };
  } catch (error: any) {
    console.error('PDF signing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign PDF. Check your certificate and password.',
    };
  }
});

// Open P12 certificate file dialog
ipcMain.handle('open-p12-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Certificate File',
    filters: [
      { name: 'Certificate Files', extensions: ['p12', 'pfx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  
  const filePath = result.filePaths[0];
  const fileData = await fs.promises.readFile(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    data: new Uint8Array(fileData),
  };
});
