/**
 * Office Conversion Service
 * Converts Word/Excel/PowerPoint to PDF using LibreOffice
 * Requires LibreOffice to be installed on the system
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

interface LibreOfficeStatus {
  installed: boolean;
  path?: string;
  version?: string;
  downloadUrl: string;
}

export class OfficeConversionService {
  private libreOfficePath: string | null = null;

  /**
   * Get LibreOffice paths based on OS
   */
  private getDefaultPaths(): string[] {
    switch (process.platform) {
      case 'win32':
        return [
          'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
          'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
          process.env.LOCALAPPDATA + '\\Programs\\LibreOffice\\program\\soffice.exe',
        ];
      case 'darwin':
        return [
          '/Applications/LibreOffice.app/Contents/MacOS/soffice',
          '/usr/local/bin/soffice',
        ];
      case 'linux':
        return [
          '/usr/bin/libreoffice',
          '/usr/bin/soffice',
          '/usr/local/bin/libreoffice',
          '/snap/bin/libreoffice',
        ];
      default:
        return [];
    }
  }

  /**
   * Get download URL based on OS
   */
  private getDownloadUrl(): string {
    switch (process.platform) {
      case 'win32':
        return 'https://www.libreoffice.org/download/download-libreoffice/?type=win-x86_64';
      case 'darwin':
        return 'https://www.libreoffice.org/download/download-libreoffice/?type=mac-x86_64';
      case 'linux':
        return 'https://www.libreoffice.org/download/download-libreoffice/?type=deb-x86_64';
      default:
        return 'https://www.libreoffice.org/download/download/';
    }
  }

  /**
   * Check if LibreOffice is installed
   */
  async checkInstallation(): Promise<LibreOfficeStatus> {
    const paths = this.getDefaultPaths();
    
    for (const p of paths) {
      if (fs.existsSync(p)) {
        this.libreOfficePath = p;
        
        // Try to get version
        try {
          const version = await this.getVersion(p);
          return {
            installed: true,
            path: p,
            version,
            downloadUrl: this.getDownloadUrl(),
          };
        } catch {
          return {
            installed: true,
            path: p,
            downloadUrl: this.getDownloadUrl(),
          };
        }
      }
    }

    return {
      installed: false,
      downloadUrl: this.getDownloadUrl(),
    };
  }

  /**
   * Get LibreOffice version
   */
  private getVersion(soffice: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`"${soffice}" --version`, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          const match = stdout.match(/LibreOffice\s+(\d+\.\d+)/);
          resolve(match ? match[1] : 'Unknown');
        }
      });
    });
  }

  /**
   * Convert Office document to PDF
   */
  async convertToPDF(inputPath: string): Promise<ConversionResult> {
    // Check if LibreOffice is available
    if (!this.libreOfficePath) {
      const status = await this.checkInstallation();
      if (!status.installed) {
        return {
          success: false,
          error: `LibreOffice is not installed.\n\nPlease download and install LibreOffice from:\n${status.downloadUrl}`,
        };
      }
    }

    // Create temp output directory
    const tempDir = path.join(app.getPath('temp'), 'pdf-kit-office-conversion');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Build command
    const command = `"${this.libreOfficePath}" --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`;

    return new Promise((resolve) => {
      exec(command, { timeout: 60000 }, (error) => {
        if (error) {
          console.error('LibreOffice conversion error:', error);
          resolve({
            success: false,
            error: `Conversion failed: ${error.message}\n\nMake sure LibreOffice is properly installed and the file is not corrupted.`,
          });
          return;
        }

        // Find output file
        const inputFileName = path.basename(inputPath, path.extname(inputPath));
        const outputPath = path.join(tempDir, `${inputFileName}.pdf`);

        if (fs.existsSync(outputPath)) {
          resolve({
            success: true,
            outputPath,
          });
        } else {
          resolve({
            success: false,
            error: 'Conversion completed but output file not found.',
          });
        }
      });
    });
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return [
      // Word
      '.doc', '.docx', '.odt', '.rtf',
      // Excel
      '.xls', '.xlsx', '.ods', '.csv',
      // PowerPoint
      '.ppt', '.pptx', '.odp',
    ];
  }

  /**
   * Check if file is supported
   */
  isSupported(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.getSupportedExtensions().includes(ext);
  }
}

// Export singleton
export const officeConversionService = new OfficeConversionService();
