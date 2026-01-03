import { app, BrowserWindow, ipcMain, Menu, dialog, shell, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ConnectivityService } from './services/connectivity.service';
import { officeConversionService } from './services/office-conversion.service';
import { autoUpdaterService } from './services/auto-updater.service';
import { SimpleUpdateChecker } from './services/simple-update-checker';
import { createMenu } from './menu';
import { pluginLifecycle, pluginLoader, pluginSettings } from './plugins';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
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
