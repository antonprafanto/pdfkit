/**
 * LibreOffice Converter Service
 * Uses LibreOffice CLI for high-quality PDF to Word/Excel conversion
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

const execFileAsync = promisify(execFile);

// LibreOffice installation paths on Windows
const LIBREOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

interface LibreOfficeCheckResult {
  installed: boolean;
  path: string | null;
}

interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Check if LibreOffice is installed
 */
export function checkLibreOfficeInstalled(): LibreOfficeCheckResult {
  for (const loPath of LIBREOFFICE_PATHS) {
    try {
      if (fs.existsSync(loPath)) {
        return { installed: true, path: loPath };
      }
    } catch {
      // Continue checking
    }
  }
  return { installed: false, path: null };
}

/**
 * Convert PDF to Word or Excel using LibreOffice CLI
 * @param pdfBuffer PDF file bytes
 * @param format Output format: 'docx' or 'xlsx'
 * @returns Conversion result with output file path
 */
export async function convertWithLibreOffice(
  pdfBuffer: Buffer,
  format: 'docx' | 'xlsx'
): Promise<ConversionResult> {
  const loCheck = checkLibreOfficeInstalled();
  
  if (!loCheck.installed || !loCheck.path) {
    return {
      success: false,
      error: 'LibreOffice not found. Please install LibreOffice first.',
    };
  }

  const tempDir = os.tmpdir();
  const uniqueId = uuidv4();
  const tempPdfPath = path.join(tempDir, `pdfkit_convert_${uniqueId}.pdf`);
  
  try {
    // Write PDF to temp file
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    // Determine output filter
    // For DOCX: writer_OOXML or 'docx'
    // For XLSX: calc_OOXML or 'xlsx'
    const outputFilter = format === 'docx' ? 'docx' : 'xlsx';

    // Run LibreOffice conversion
    // soffice --headless --convert-to <format> --outdir <dir> <input>
    await execFileAsync(loCheck.path, [
      '--headless',
      '--infilter=writer_pdf_import',
      `--convert-to`,
      outputFilter,
      '--outdir',
      tempDir,
      tempPdfPath,
    ], {
      timeout: 120000, // 2 minutes timeout
    });

    // Find output file
    const baseName = `pdfkit_convert_${uniqueId}`;
    const outputFileName = `${baseName}.${format}`;
    const outputPath = path.join(tempDir, outputFileName);

    // Check if output file exists
    if (fs.existsSync(outputPath)) {
      return {
        success: true,
        outputPath,
      };
    } else {
      // LibreOffice might use different naming
      const files = fs.readdirSync(tempDir);
      const matchingFile = files.find(f => 
        f.startsWith(baseName) && (f.endsWith('.docx') || f.endsWith('.xlsx'))
      );
      
      if (matchingFile) {
        return {
          success: true,
          outputPath: path.join(tempDir, matchingFile),
        };
      }

      return {
        success: false,
        error: 'Output file not found after conversion',
      };
    }
  } catch (error: any) {
    console.error('[LibreOffice] Conversion error:', error);
    return {
      success: false,
      error: `Conversion failed: ${error.message || 'Unknown error'}`,
    };
  } finally {
    // Cleanup temp PDF
    try {
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Get LibreOffice download URL
 */
export function getLibreOfficeDownloadUrl(): string {
  return 'https://www.libreoffice.org/download/download-libreoffice/';
}
