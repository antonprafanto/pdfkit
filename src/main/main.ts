import { app, BrowserWindow, ipcMain, Menu, dialog, shell, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ConnectivityService } from './services/connectivity.service';
import { officeConversionService } from './services/office-conversion.service';
import { autoUpdaterService } from './services/auto-updater.service';
import { SimpleUpdateChecker } from './services/simple-update-checker';
import { createMenu } from './menu';
import { pluginLifecycle, pluginLoader, pluginSettings } from './plugins';
import { convertWithLibreOffice, checkLibreOfficeInstalled, getLibreOfficeDownloadUrl } from './libreoffice-converter';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Enforce single instance - if another instance is launched, pass file to existing instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // This is the second instance - quit immediately
  // The first instance will handle the file
  app.quit();
} else {
  // This is the first instance - handle second instance attempts
  app.on('second-instance', (_event, commandLine, _workingDirectory) => {
    // Someone tried to run a second instance
    // Focus the main window and open the file
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Check if a PDF file was passed in command line
      for (const arg of commandLine) {
        if (arg.endsWith('.pdf') && fs.existsSync(arg)) {
          // Send file to renderer to open
          mainWindow.webContents.send('open-pdf-file', arg);
          break;
        }
      }
    }
  });
}

let mainWindow: BrowserWindow | null = null;
let connectivityService: ConnectivityService;
// Store file path to open (when launched via file association)
let fileToOpen: string | null = null;

// Reliable production detection - app.isPackaged is true when built/packaged
const isDev = !app.isPackaged;
console.log('[Main] isDev:', isDev, 'isPackaged:', app.isPackaged);

// Check for file path in command line arguments (Windows/Linux)
const args = process.argv.slice(1);
for (const arg of args) {
  if (arg.endsWith('.pdf') && fs.existsSync(arg)) {
    fileToOpen = arg;
    break;
  }
}

// Handle file open event from macOS
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (filePath.endsWith('.pdf')) {
    fileToOpen = filePath;
    // If window is already open, send file to renderer
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('open-pdf-file', filePath);
    }
  }
});

function createWindow(): void {
  // Determine icon path based on development/production
  const iconPath = isDev 
    ? path.join(__dirname, '../../assets/icon.ico')
    : path.join(process.resourcesPath, 'assets/icon.ico');
  
  console.log('[Main] Using icon path:', iconPath);
  console.log('[Main] Icon exists:', fs.existsSync(iconPath));
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
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
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // If launched with a PDF file, send it to renderer after a short delay
    // to ensure React is fully mounted
    if (fileToOpen && mainWindow) {
      setTimeout(() => {
        mainWindow?.webContents.send('open-pdf-file', fileToOpen);
        fileToOpen = null; // Clear after sending
      }, 500);
    }
  });

  // Handle Ctrl+P - block native print and trigger custom print handler
  // The renderer will handle print via IPC to open with system PDF viewer
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'p') {
      console.log('[Main] Ctrl+P pressed - blocking native print and triggering custom handler');
      event.preventDefault();
      // Directly send trigger-print to renderer (more reliable than menu accelerator)
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('trigger-print');
      }
    }
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup menu with mainWindow reference for Print handler
  const menu = createMenu(mainWindow);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(async () => {
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

  // Initialize plugin system
  if (mainWindow) {
    pluginLifecycle.initialize(mainWindow);
    const enabledPlugins = pluginSettings.getEnabledPlugins();
    pluginLifecycle.loadEnabledPlugins(enabledPlugins);
    await pluginLifecycle.initializePlugins();
    
    // Initialize auto-updater (production only)
    if (!isDev) {
      autoUpdaterService.initialize(mainWindow);
    } else {
      // Dev mode: register fallback handlers to prevent errors
      ipcMain.handle('updater:check', async () => ({ checking: false, available: false, error: 'Dev mode - updater disabled' }));
      ipcMain.handle('updater:download', async () => false);
      ipcMain.handle('updater:install', async () => {});
      ipcMain.handle('updater:status', async () => ({ checking: false, available: false, downloading: false, downloaded: false, progress: 0, error: null, updateInfo: null }));
      ipcMain.handle('updater:version', async () => app.getVersion());
    }
    // Note: Ctrl+P is handled by menu accelerator in menu.ts
  }

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', async () => {
  // Shutdown plugins
  await pluginLifecycle.shutdown();
  
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
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

// Print PDF - Opens PDF directly in Edge for proper printing
ipcMain.handle('print-pdf', async (_event, options?: { pdfPath?: string; pdfBytes?: Uint8Array; fileName?: string }) => {
  try {
    console.log('[Main] print-pdf called with options:', {
      hasPdfPath: !!options?.pdfPath,
      pdfPath: options?.pdfPath,
      hasPdfBytes: !!options?.pdfBytes,
      pdfBytesLength: options?.pdfBytes?.length || 0,
      fileName: options?.fileName
    });

    let pdfBuffer: Buffer | null = null;

    // Priority 1: Always prefer pdfBytes if available (most reliable for current document state)
    if (options?.pdfBytes && options.pdfBytes.length > 0) {
      pdfBuffer = Buffer.from(options.pdfBytes);
      console.log('[Main] Using PDF bytes for printing, size:', pdfBuffer.length);
    }
    // Priority 2: Use pdfPath if pdfBytes not available and path exists
    else if (options?.pdfPath && fs.existsSync(options.pdfPath)) {
      console.log('[Main] Reading PDF from path for printing:', options.pdfPath);
      pdfBuffer = await fs.promises.readFile(options.pdfPath);
    }

    if (pdfBuffer) {
      // Save PDF to temporary file
      const tempDir = app.getPath('temp');
      const timestamp = Date.now();
      const safeFileName = (options?.fileName || 'print_document.pdf')
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_');
      const tempPdfPath = path.join(tempDir, `pdfkit_print_${timestamp}_${safeFileName}`);

      await fs.promises.writeFile(tempPdfPath, pdfBuffer);
      console.log('[Main] Saved PDF to temp file:', tempPdfPath);

      const { exec } = require('child_process');

      if (process.platform === 'win32') {
        // Find Edge browser path
        let edgePath = '';
        const paths = [
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
        ];
        for (const p of paths) {
          if (fs.existsSync(p)) {
            edgePath = p;
            break;
          }
        }

        if (edgePath) {
          // Open PDF directly in Edge
          exec(`"${edgePath}" "${tempPdfPath}"`, (error: any) => {
            if (error) {
              console.error('[Main] Failed to open PDF:', error);
            } else {
              console.log('[Main] PDF opened in Edge - user can press Ctrl+P to print');
            }
          });
          return { success: true, method: 'edge-direct' };
        } else {
          await shell.openExternal(`file://${tempPdfPath}`);
          return { success: true, method: 'shell-external' };
        }
      } else if (process.platform === 'darwin') {
        exec(`open -a Preview "${tempPdfPath}"`, (error: any) => {
          if (error) console.error('[Main] Failed to open PDF:', error);
        });
        return { success: true, method: 'preview' };
      } else {
        exec(`xdg-open "${tempPdfPath}"`, (error: any) => {
          if (error) console.error('[Main] Failed to open PDF:', error);
        });
        return { success: true, method: 'xdg-open' };
      }
    } else {
      console.error('[Main] No valid PDF path or bytes provided');
      return { success: false, error: 'No PDF data available for printing' };
    }
  } catch (error: any) {
    console.error('[Main] Print error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Read file from path (for file association)
ipcMain.handle('read-file-from-path', async (_, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const name = path.basename(filePath);
    return {
      success: true,
      name,
      data: new Uint8Array(buffer),
    };
  } catch (error: any) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

// Simple update check using GitHub API directly
ipcMain.handle('simple-update-check', async () => {
  try {
    console.log('[Main] simple-update-check called');
    const updateChecker = new SimpleUpdateChecker(app.getVersion());
    const result = await updateChecker.checkForUpdates();
    console.log('[Main] Update check result:', result);
    return result;
  } catch (error: any) {
    console.error('[Main] Update check error:', error);
    return {
      hasUpdate: false,
      latestVersion: app.getVersion(),
      currentVersion: app.getVersion(),
      downloadUrl: '',
      releaseNotes: '',
      error: error.message
    };
  }
});

// Open download URL
ipcMain.handle('open-download-url', async (_, url: string) => {
  console.log('[Main] Opening download URL:', url);
  shell.openExternal(url);
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

// PDF to Word/Excel conversion via LibreOffice
ipcMain.handle('convert-pdf-with-libreoffice', async (_, pdfBytes: Uint8Array, format: 'docx' | 'xlsx') => {
  const buffer = Buffer.from(pdfBytes);
  return await convertWithLibreOffice(buffer, format);
});

ipcMain.handle('check-libreoffice-for-pdf', async () => {
  return checkLibreOfficeInstalled();
});

ipcMain.handle('get-libreoffice-download-url', async () => {
  return getLibreOfficeDownloadUrl();
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

// Add page numbers to PDF
ipcMain.handle('add-page-numbers', async (_, pdfBytes: Uint8Array, options: {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: 'numbers' | 'page-of-total' | 'roman' | 'letters';
  startNumber: number;
  fontSize: number;
  margin: number;
  pageRange: string;
}) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
    
    // Helper functions
    const toRoman = (num: number): string => {
      const romanNumerals: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
      ];
      let result = '';
      for (const [value, numeral] of romanNumerals) {
        while (num >= value) {
          result += numeral;
          num -= value;
        }
      }
      return result;
    };

    const toLetters = (num: number): string => {
      let result = '';
      while (num > 0) {
        const remainder = (num - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        num = Math.floor((num - 1) / 26);
      }
      return result;
    };

    const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
      if (rangeStr === 'all') {
        return Array.from({ length: totalPages }, (_, i) => i);
      }
      const pages = new Set<number>();
      const parts = rangeStr.split(',').map(s => s.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(s => parseInt(s.trim()));
          if (isNaN(start) || isNaN(end)) continue;
          const from = Math.max(1, Math.min(start, totalPages));
          const to = Math.max(1, Math.min(end, totalPages));
          for (let i = from; i <= to; i++) {
            pages.add(i - 1);
          }
        } else {
          const pageNum = parseInt(part);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            pages.add(pageNum - 1);
          }
        }
      }
      return Array.from(pages).sort((a, b) => a - b);
    };

    const formatPageNumber = (pageIndex: number, totalPages: number, format: string, startNumber: number): string => {
      const actualNumber = pageIndex + startNumber;
      switch (format) {
        case 'numbers':
          return actualNumber.toString();
        case 'page-of-total':
          return `Page ${actualNumber} of ${totalPages + startNumber - 1}`;
        case 'roman':
          return toRoman(actualNumber);
        case 'letters':
          return toLetters(actualNumber);
        default:
          return actualNumber.toString();
      }
    };

    const getPosition = (position: string, pageWidth: number, pageHeight: number, textWidth: number, fontSize: number, margin: number): { x: number; y: number } => {
      const positions: Record<string, { x: number; y: number }> = {
        'top-left': { x: margin, y: pageHeight - margin - fontSize },
        'top-center': { x: (pageWidth - textWidth) / 2, y: pageHeight - margin - fontSize },
        'top-right': { x: pageWidth - margin - textWidth, y: pageHeight - margin - fontSize },
        'bottom-left': { x: margin, y: margin },
        'bottom-center': { x: (pageWidth - textWidth) / 2, y: margin },
        'bottom-right': { x: pageWidth - margin - textWidth, y: margin },
      };
      return positions[position];
    };

    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Parse page range
    const pageIndices = parsePageRange(options.pageRange, totalPages);

    // Add page numbers to specified pages
    for (const pageIndex of pageIndices) {
      if (pageIndex >= totalPages) continue;
      
      const page = pages[pageIndex];
      const { width, height } = page.getSize();
      
      // Format the page number
      const text = formatPageNumber(pageIndex, totalPages, options.format, options.startNumber);
      
      // Calculate text width
      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      
      // Get position
      const { x, y } = getPosition(options.position, width, height, textWidth, options.fontSize, options.margin);
      
      // Draw text
      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return { success: true, data: new Uint8Array(modifiedPdfBytes) };
  } catch (error: any) {
    console.error('Add page numbers error:', error);
    return { success: false, error: error.message };
  }
});

// Extract images from PDF
ipcMain.handle('extract-images', async (_, pdfBytes: Uint8Array, options: {
  format: 'png' | 'jpeg';
  quality: number;
  minWidth: number;
  minHeight: number;
  fileName: string;
}) => {
  try {
    const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');
    
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    const images: { data: Uint8Array; width: number; height: number; pageIndex: number; index: number }[] = [];
    let imageIndex = 0;
    
    // Extract all images from PDF using XObject approach
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      
      try {
        // Get page resources
        const resources = page.node.Resources();
        if (!resources) continue;
        
        const xObjects = resources.lookup(PDFName.of('XObject'));
        if (!xObjects) continue;
        
        // Iterate through XObjects
        const entries = xObjects.entries ? xObjects.entries() : [];
        
        for (const [_name, ref] of entries) {
          try {
            const xObject = pdfDoc.context.lookup(ref);
            if (!xObject) continue;
            
            // Check if it's an image
            const subtype = xObject.dict?.get(PDFName.of('Subtype'));
            if (!subtype || subtype.toString() !== '/Image') continue;
            
            // Get dimensions
            const widthObj = xObject.dict?.get(PDFName.of('Width'));
            const heightObj = xObject.dict?.get(PDFName.of('Height'));
            
            const width = widthObj?.value || widthObj?.numberValue?.() || 0;
            const height = heightObj?.value || heightObj?.numberValue?.() || 0;
            
            // Filter by minimum size
            if (width < options.minWidth || height < options.minHeight) continue;
            
            // Try to get image data
            if (xObject instanceof PDFRawStream) {
              const imageData = xObject.contents;
              if (imageData && imageData.length > 0) {
                images.push({
                  data: imageData,
                  width,
                  height,
                  pageIndex,
                  index: imageIndex++,
                });
              }
            }
          } catch (xObjErr) {
            console.error('Error processing XObject:', xObjErr);
          }
        }
      } catch (pageErr) {
        console.error('Error processing page:', pageErr);
      }
    }
    
    // If no images found, return helpful message
    if (images.length === 0) {
      return { 
        success: true, 
        count: 0,
        message: 'No traditional images found. For PDFs from Word/print, use "Export as Images" (Ekspor sebagai Gambar) instead.'
      };
    }
    
    // Create output folder
    const outputDir = path.join(
      app.getPath('downloads'),
      `${options.fileName.replace('.pdf', '')}_images`
    );
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let savedCount = 0;
    const sharp = require('sharp');
    
    // Save each image
    for (const img of images) {
      try {
        const ext = options.format === 'png' ? 'png' : 'jpg';
        const fileName = `image_${img.index + 1}_page${img.pageIndex + 1}.${ext}`;
        const filePath = path.join(outputDir, fileName);
        
        try {
          // Try processing with sharp
          let processor = sharp(Buffer.from(img.data), {
            failOnError: false,
            unlimited: true,
          });
          
          if (options.format === 'jpeg') {
            processor = processor.jpeg({ quality: options.quality });
          } else {
            processor = processor.png();
          }
          
          await processor.toFile(filePath);
          savedCount++;
        } catch (sharpError) {
          // If sharp fails, save raw data with appropriate extension
          console.error('Sharp processing failed:', sharpError);
          try {
            await fs.promises.writeFile(filePath, Buffer.from(img.data));
            savedCount++;
          } catch (writeError) {
            console.error('Failed to save raw image:', writeError);
          }
        }
      } catch (imgError) {
        console.error('Error saving image:', imgError);
      }
    }
    
    // Open output folder
    if (savedCount > 0) {
      await shell.openPath(outputDir);
    }
    
    return { success: true, count: savedCount, outputDir };
  } catch (error: any) {
    console.error('Extract images error:', error);
    return { success: false, error: error.message || 'Failed to extract images' };
  }
});

// Unlock PDF (remove password/encryption) using QPDF
ipcMain.handle('unlock-pdf', async (_, pdfBytes: Uint8Array, password: string) => {
  try {
    const { execSync } = require('child_process');
    const os = require('os');
    
    // Create temp files for input and output
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_${Date.now()}.pdf`);
    const outputPath = path.join(tempDir, `output_${Date.now()}.pdf`);
    
    // Write input PDF to temp file
    fs.writeFileSync(inputPath, Buffer.from(pdfBytes));
    
    try {
      // Use QPDF to decrypt the PDF
      // Full path to QPDF (installed with PDF24)
      const qpdfPath = 'C:\\\\Program Files\\\\PDF24\\\\qpdf\\\\bin\\\\qpdf.exe';
      const command = `"${qpdfPath}" --password="${password}" --decrypt "${inputPath}" "${outputPath}"`;
      execSync(command, { stdio: 'pipe' });
      
      // Read the decrypted PDF
      const decryptedBytes = fs.readFileSync(outputPath);
      
      // Clean up temp files
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.warn('Failed to clean up temp files:', cleanupErr);
      }
      
      return { success: true, data: new Uint8Array(decryptedBytes) };
    } catch (qpdfError: any) {
      // Clean up temp files on error
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.warn('Failed to clean up temp files:', cleanupErr);
      }
      
      // Check for common QPDF errors
      const errorMsg = qpdfError.stderr?.toString() || qpdfError.message || '';
      
      if (errorMsg.includes('invalid password') || errorMsg.includes('password')) {
        return { success: false, error: 'Wrong password' };
      }
      if (errorMsg.includes('not encrypted')) {
        return { success: false, error: 'This PDF is not encrypted' };
      }
      
      console.error('QPDF error:', errorMsg);
      return { success: false, error: 'Failed to decrypt PDF: ' + errorMsg };
    }
  } catch (error: any) {
    console.error('Unlock PDF error:', error);
    return { success: false, error: error.message || 'Failed to unlock PDF' };
  }
});

// Web Optimize PDF using Ghostscript
ipcMain.handle('web-optimize-pdf', async (_, pdfBytes: Uint8Array, options: { quality: string }) => {
  try {
    const { execSync } = require('child_process');
    const os = require('os');
    
    // Create temp files for input and output
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input_opt_${Date.now()}.pdf`);
    const outputPath = path.join(tempDir, `output_opt_${Date.now()}.pdf`);
    
    // Write input PDF to temp file
    fs.writeFileSync(inputPath, Buffer.from(pdfBytes));
    
    try {
      // Full path to Ghostscript (installed with PDF24)
      const gsPath = path.join('C:', 'Program Files', 'PDF24', 'gs', 'bin', 'gswin64c.exe');
      
      // Ghostscript quality settings for PDF optimization
      // -dPDFSETTINGS options: /screen, /ebook, /printer, /prepress
      const qualityMap: Record<string, string> = {
        'screen': '/screen',     // 72 dpi, lowest quality, smallest size
        'ebook': '/ebook',       // 150 dpi, medium quality
        'printer': '/printer',   // 300 dpi, high quality
        'prepress': '/prepress', // 300 dpi, highest quality, largest size
      };
      
      const pdfSettings = qualityMap[options.quality] || '/ebook';
      
      // Ghostscript command for PDF optimization
      const command = `"${gsPath}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${pdfSettings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
      
      execSync(command, { stdio: 'pipe', timeout: 120000 }); // 2 minute timeout
      
      // Read the optimized PDF
      const optimizedBytes = fs.readFileSync(outputPath);
      
      // Clean up temp files
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.warn('Failed to clean up temp files:', cleanupErr);
      }
      
      return { success: true, data: new Uint8Array(optimizedBytes) };
    } catch (gsError: any) {
      // Clean up temp files on error
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.warn('Failed to clean up temp files:', cleanupErr);
      }
      
      console.error('Ghostscript error:', gsError);
      return { success: false, error: 'Failed to optimize PDF: ' + (gsError.message || 'Ghostscript error') };
    }
  } catch (error: any) {
    console.error('Web Optimize PDF error:', error);
    return { success: false, error: error.message || 'Failed to optimize PDF' };
  }
});

// Helper functions for image type detection
function isPNG(bytes: Uint8Array): boolean {
  // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
  return bytes.length > 8 && 
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
}

function isJPEG(bytes: Uint8Array): boolean {
  // JPEG magic number: FF D8 FF
  return bytes.length > 3 && 
    bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
}

function isImageBytes(bytes: Uint8Array): boolean {
  return isPNG(bytes) || isJPEG(bytes);
}

// Overlay PDF (superimpose one PDF or image on another)
ipcMain.handle('overlay-pdf', async (_, basePdfBytes: Uint8Array, overlayBytes: Uint8Array, options: {
  position: 'foreground' | 'background';
  pageNumbers: number[];
  opacity: number;
  isImage?: boolean;
  imagePosition?: 'top' | 'bottom' | 'center' | 'full';
}) => {
  try {
    const { PDFDocument } = require('pdf-lib');
    
    // Load base PDF
    const basePdf = await PDFDocument.load(basePdfBytes);
    const basePages = basePdf.getPages();
    
    // Detect if overlay is an image or PDF
    const isImage = options.isImage || isImageBytes(overlayBytes);
    
    if (isImage) {
      // Handle image overlay
      let embeddedImage;
      
      // Detect image type from bytes
      if (isPNG(overlayBytes)) {
        embeddedImage = await basePdf.embedPng(overlayBytes);
      } else if (isJPEG(overlayBytes)) {
        embeddedImage = await basePdf.embedJpg(overlayBytes);
      } else {
        // Try PNG first, fall back to JPEG
        try {
          embeddedImage = await basePdf.embedPng(overlayBytes);
        } catch {
          embeddedImage = await basePdf.embedJpg(overlayBytes);
        }
      }
      
      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;
      
      for (const pageNum of options.pageNumbers) {
        if (pageNum < 1 || pageNum > basePages.length) continue;
        
        const page = basePages[pageNum - 1];
        const { width, height } = page.getSize();
        
        let xOffset = 0;
        let yOffset = 0;
        let scaledWidth = width;
        let scaledHeight = height;
        
        const imgPos = options.imagePosition || 'top';
        
        if (imgPos === 'full') {
          // Stretch to fill entire page
          scaledWidth = width;
          scaledHeight = height;
          xOffset = 0;
          yOffset = 0;
        } else {
          // Scale image to fit page WIDTH while maintaining aspect ratio
          const scale = width / imgWidth;
          scaledWidth = width;
          scaledHeight = imgHeight * scale;
          
          // Calculate Y position based on imagePosition
          // PDF coordinate system: Y=0 is BOTTOM
          switch (imgPos) {
            case 'top':
              yOffset = height - scaledHeight; // Top of page
              break;
            case 'bottom':
              yOffset = 0; // Bottom of page
              break;
            case 'center':
            default:
              yOffset = (height - scaledHeight) / 2; // Center
              break;
          }
        }
        
        page.drawImage(embeddedImage, {
          x: xOffset,
          y: yOffset,
          width: scaledWidth,
          height: scaledHeight,
          opacity: options.opacity,
        });
      }
    } else {
      // Handle PDF overlay (original logic)
      const overlayPdf = await PDFDocument.load(overlayBytes);
      
      // Get the first page of overlay as template
      const overlayPages = overlayPdf.getPages();
      if (overlayPages.length === 0) {
        return { success: false, error: 'Overlay PDF has no pages' };
      }
      
      // Embed overlay pages into base document
      const embeddedPages = await basePdf.embedPages(overlayPages);
    
    for (const pageNum of options.pageNumbers) {
      if (pageNum < 1 || pageNum > basePages.length) continue;
      
      const page = basePages[pageNum - 1];
      const { width, height } = page.getSize();
      
      // Use first overlay page (or cycle through if multiple)
      const overlayIndex = (pageNum - 1) % embeddedPages.length;
      const embeddedPage = embeddedPages[overlayIndex];
      
      // Get overlay dimensions safely - embedded pages have width/height directly
      const overlayWidth = embeddedPage.width || embeddedPage.size?.width || width;
      const overlayHeight = embeddedPage.height || embeddedPage.size?.height || height;
      
      // Calculate scaling to fit overlay to page
      const scaleX = width / overlayWidth;
      const scaleY = height / overlayHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Center the overlay
      const scaledWidth = overlayWidth * scale;
      const scaledHeight = overlayHeight * scale;
      const xOffset = (width - scaledWidth) / 2;
      const yOffset = (height - scaledHeight) / 2;
      
      // Ensure all values are valid numbers
      const safeX = isNaN(xOffset) ? 0 : xOffset;
      const safeY = isNaN(yOffset) ? 0 : yOffset;
      const safeWidth = isNaN(scaledWidth) ? width : scaledWidth;
      const safeHeight = isNaN(scaledHeight) ? height : scaledHeight;
      const safeOpacity = isNaN(options.opacity) ? 1 : options.opacity;
      
      if (options.position === 'background') {
        // For background, we need to create a new page and move content
        // This is complex, so for now we'll just draw on top with low opacity for background effect
        page.drawPage(embeddedPage, {
          x: safeX,
          y: safeY,
          width: safeWidth,
          height: safeHeight,
          opacity: safeOpacity * 0.5, // Lower opacity for background
        });
      } else {
        // Foreground - draw on top
        page.drawPage(embeddedPage, {
          x: safeX,
          y: safeY,
          width: safeWidth,
          height: safeHeight,
          opacity: safeOpacity,
        });
      }
    }
    } // Close else block for PDF overlay
    
    const resultBytes = await basePdf.save();
    return { success: true, data: new Uint8Array(resultBytes) };
  } catch (error: any) {
    console.error('Overlay PDF error:', error);
    return { success: false, error: error.message || 'Failed to overlay PDF' };
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

// ==================== Plugin System IPC Handlers ====================

// Get all plugins
ipcMain.handle('get-plugins', async () => {
  const plugins = pluginLoader.getLoadedPlugins();
  return plugins.map(p => ({
    id: p.manifest.id,
    name: p.manifest.name,
    version: p.manifest.version,
    description: p.manifest.description,
    author: p.manifest.author,
    state: p.state,
    error: p.error,
    icon: p.manifest.icon,
  }));
});

// Enable plugin
ipcMain.handle('enable-plugin', async (_, pluginId: string) => {
  const success = await pluginLifecycle.activatePlugin(pluginId);
  if (success) {
    pluginSettings.enablePlugin(pluginId);
  }
  return success;
});

// Disable plugin
ipcMain.handle('disable-plugin', async (_, pluginId: string) => {
  const success = await pluginLifecycle.deactivatePlugin(pluginId);
  if (success) {
    pluginSettings.disablePlugin(pluginId);
  }
  return success;
});

// Install plugin from folder
ipcMain.handle('install-plugin', async (_, folderPath: string) => {
  const plugin = await pluginLifecycle.installPlugin(folderPath);
  return plugin ? true : false;
});

// Uninstall plugin
ipcMain.handle('uninstall-plugin', async (_, pluginId: string) => {
  return await pluginLifecycle.uninstallPlugin(pluginId);
});

// Reload plugins
ipcMain.handle('reload-plugins', async () => {
  await pluginLifecycle.reloadPlugins();
  return true;
});

// Open plugins folder
ipcMain.handle('open-plugins-folder', async () => {
  const pluginsDir = pluginLoader.getPluginsDir();
  await shell.openPath(pluginsDir);
});

// Open folder dialog for plugin installation
ipcMain.handle('open-folder-dialog', async () => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Plugin Folder',
    properties: ['openDirectory'],
  });
  
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths;
});

// Webpage to PDF - Convert URL to PDF document
ipcMain.handle('webpage-to-pdf', async (_, options: {
  url: string;
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
  landscape: boolean;
  margins: 'none' | 'minimal' | 'normal';
  printBackground: boolean;
  timeout: number; // in seconds
}) => {
  let hiddenWindow: BrowserWindow | null = null;
  
  try {
    // 1. Validate URL format
    let validUrl: URL;
    try {
      // Add https if no protocol specified
      let urlString = options.url.trim();
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }
      validUrl = new URL(urlString);
    } catch (e) {
      return { success: false, error: 'Invalid URL format' };
    }
    
    // 2. Create hidden BrowserWindow with settings to bypass site restrictions
    hiddenWindow = new BrowserWindow({
      width: 1280,
      height: 900,
      show: false, // Hidden window
      webPreferences: {
        sandbox: false, // Disable sandbox to allow more flexibility
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Disable to bypass CORS/CSP restrictions
        allowRunningInsecureContent: true,
      },
    });
    
    // Set a real Chrome user-agent to avoid bot detection
    const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    hiddenWindow.webContents.setUserAgent(chromeUserAgent);
    
    // 3. Handle SSL/certificate errors gracefully
    hiddenWindow.webContents.on('certificate-error', (event, _url, _error, _certificate, callback) => {
      event.preventDefault();
      callback(true); // Accept the certificate
    });
    
    // 4. Set timeout with Promise
    const timeoutMs = (options.timeout || 30) * 1000;
    
    const loadPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Page load timeout - the webpage took too long to load'));
      }, timeoutMs);
      
      hiddenWindow!.webContents.once('did-finish-load', () => {
        clearTimeout(timeoutId);
        resolve();
      });
      
      hiddenWindow!.webContents.once('did-fail-load', (_event, errorCode, errorDescription) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load page: ${errorDescription} (${errorCode})`));
      });
    });
    
    // 5. Load URL
    await hiddenWindow.loadURL(validUrl.toString());
    await loadPromise;
    
    // 6. Scroll to bottom to trigger lazy-loaded content, then wait for rendering
    await hiddenWindow.webContents.executeJavaScript(`
      (async () => {
        // Scroll to bottom multiple times to trigger all lazy loading
        const scrollHeight = () => document.documentElement.scrollHeight;
        const scrollTo = (y) => window.scrollTo(0, y);
        
        let lastHeight = 0;
        let currentHeight = scrollHeight();
        
        // Keep scrolling until no new content loads (max 10 iterations)
        for (let i = 0; i < 10 && currentHeight > lastHeight; i++) {
          lastHeight = currentHeight;
          scrollTo(currentHeight);
          await new Promise(r => setTimeout(r, 500)); // Wait for lazy content
          currentHeight = scrollHeight();
        }
        
        // Scroll back to top
        scrollTo(0);
        
        // Final wait for any remaining rendering
        await new Promise(r => setTimeout(r, 1000));
      })();
    `);
    
    // Additional wait for complex pages
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 7. Configure PDF options - use standard page sizes for reliable output
    // Content will automatically span multiple pages as needed
    const marginValues = {
      none: { top: 0, bottom: 0, left: 0, right: 0 },
      minimal: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      normal: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
    };
    
    const pdfOptions = {
      pageSize: options.pageSize || 'A4',
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      margins: marginValues[options.margins || 'normal'],
    };
    
    console.log('[Webpage to PDF] Using options:', JSON.stringify(pdfOptions));
    
    // 8. Generate PDF - content will automatically paginate
    const pdfBuffer = await hiddenWindow.webContents.printToPDF(pdfOptions as any);
    
    // 9. Show save dialog
    if (!mainWindow) {
      return { success: false, error: 'Main window not available' };
    }
    
    // Generate default filename from URL
    const hostname = validUrl.hostname.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const defaultName = `${hostname}_${timestamp}.pdf`;
    
    const saveResult = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      defaultPath: path.join(app.getPath('downloads'), defaultName),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    
    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, error: 'Save cancelled by user' };
    }
    
    // 10. Save PDF file
    await fs.promises.writeFile(saveResult.filePath, pdfBuffer);
    
    // Open the saved file location
    shell.showItemInFolder(saveResult.filePath);
    
    return { 
      success: true, 
      filePath: saveResult.filePath,
      pageTitle: await hiddenWindow.webContents.getTitle(),
    };
    
  } catch (error: any) {
    console.error('Webpage to PDF error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to convert webpage to PDF' 
    };
  } finally {
    // 11. Cleanup hidden window
    if (hiddenWindow && !hiddenWindow.isDestroyed()) {
      hiddenWindow.destroy();
    }
  }
});

