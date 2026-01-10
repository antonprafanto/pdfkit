/**
 * PDF to Excel Conversion Service
 * Converts PDF documents to Excel (.xlsx) format
 * Best for PDFs with tabular data
 */

import * as XLSX from 'xlsx';
import { pdfjsLib, PDF_CONFIG } from './pdf-config';
import type { ConversionProgress, ConversionResult } from './pdf-to-word.service';

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface CellData {
  text: string;
  x: number;
  y: number;
  width: number;
}

/**
 * Convert PDF bytes to Excel spreadsheet
 */
export async function convertPdfToExcel(
  pdfBytes: Uint8Array,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      ...PDF_CONFIG,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    if (totalPages === 0) {
      return {
        success: false,
        error: 'PDF kosong atau tidak memiliki halaman',
      };
    }

    onProgress?.({
      percent: 0,
      currentPage: 0,
      totalPages,
      status: 'Memulai konversi...',
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.({
        percent: Math.round((pageNum / totalPages) * 80),
        currentPage: pageNum,
        totalPages,
        status: `Mengekstrak halaman ${pageNum} dari ${totalPages}...`,
      });

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract table data from page
      const tableData = extractTableFromPage(textContent.items as TextItem[]);

      // Create worksheet for this page
      const sheetName = totalPages === 1 ? 'Sheet1' : `Page ${pageNum}`;
      const worksheet = XLSX.utils.aoa_to_sheet(tableData);

      // Auto-size columns
      const colWidths = calculateColumnWidths(tableData);
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    onProgress?.({
      percent: 90,
      currentPage: totalPages,
      totalPages,
      status: 'Membuat file Excel...',
    });

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    onProgress?.({
      percent: 100,
      currentPage: totalPages,
      totalPages,
      status: 'Selesai!',
    });

    return {
      success: true,
      blob,
      pageCount: totalPages,
    };
  } catch (error: any) {
    console.error('[PDF to Excel] Conversion error:', error);
    
    if (error.name === 'PasswordException') {
      return {
        success: false,
        error: 'PDF terenkripsi. Silakan unlock PDF terlebih dahulu.',
      };
    }

    return {
      success: false,
      error: error.message || 'Gagal mengkonversi PDF ke Excel',
    };
  }
}

/**
 * Extract table data from PDF page text items
 * Uses position-based grouping to detect rows and columns
 */
function extractTableFromPage(items: TextItem[]): string[][] {
  if (items.length === 0) {
    return [['Halaman ini tidak memiliki data']];
  }

  // Convert items to cell data with position info
  const cells: CellData[] = items
    .filter(item => item.str.trim())
    .map(item => ({
      text: item.str.trim(),
      x: Math.round(item.transform[4]), // X position
      y: Math.round(item.transform[5]), // Y position
      width: item.width,
    }));

  if (cells.length === 0) {
    return [['Halaman ini tidak memiliki data']];
  }

  // Group cells by row (similar Y position)
  const Y_THRESHOLD = 8; // pixels
  const rows: { y: number; cells: CellData[] }[] = [];

  for (const cell of cells) {
    let existingRow = rows.find(row => Math.abs(row.y - cell.y) < Y_THRESHOLD);
    
    if (existingRow) {
      existingRow.cells.push(cell);
    } else {
      rows.push({ y: cell.y, cells: [cell] });
    }
  }

  // Sort rows by Y position (descending - PDF coords are bottom-up)
  rows.sort((a, b) => b.y - a.y);

  // Detect column positions based on X coordinates
  const allXPositions = cells.map(c => c.x);
  const columnPositions = detectColumns(allXPositions);

  // Build table data
  const tableData: string[][] = [];

  for (const row of rows) {
    // Sort cells in row by X position
    row.cells.sort((a, b) => a.x - b.x);

    // Map cells to columns
    const rowData: string[] = new Array(columnPositions.length).fill('');

    for (const cell of row.cells) {
      const colIndex = findColumnIndex(cell.x, columnPositions);
      if (colIndex !== -1) {
        // Append if there's already content (merged cells)
        if (rowData[colIndex]) {
          rowData[colIndex] += ' ' + cell.text;
        } else {
          rowData[colIndex] = cell.text;
        }
      }
    }

    // Only add row if it has content
    if (rowData.some(cell => cell.trim())) {
      tableData.push(rowData);
    }
  }

  // If no structured table detected, return simple list
  if (tableData.length === 0 || columnPositions.length <= 1) {
    // Fallback: return as single column
    const simpleData: string[][] = [];
    for (const row of rows) {
      row.cells.sort((a, b) => a.x - b.x);
      const lineText = row.cells.map(c => c.text).join(' ');
      if (lineText.trim()) {
        simpleData.push([lineText]);
      }
    }
    return simpleData.length > 0 ? simpleData : [['Tidak ada data']];
  }

  return tableData;
}

/**
 * Detect column positions from X coordinates using clustering
 */
function detectColumns(xPositions: number[]): number[] {
  if (xPositions.length === 0) return [];

  // Sort and remove duplicates (with threshold)
  const X_THRESHOLD = 15; // pixels
  const sorted = [...new Set(xPositions)].sort((a, b) => a - b);

  const columns: number[] = [];
  let lastX = -Infinity;

  for (const x of sorted) {
    if (x - lastX > X_THRESHOLD) {
      columns.push(x);
      lastX = x;
    }
  }

  return columns;
}

/**
 * Find which column a cell belongs to
 */
function findColumnIndex(x: number, columnPositions: number[]): number {
  const X_THRESHOLD = 30; // More lenient for matching

  for (let i = 0; i < columnPositions.length; i++) {
    const colX = columnPositions[i];
    const nextColX = columnPositions[i + 1] || Infinity;
    
    // Check if x falls within this column's range
    if (x >= colX - X_THRESHOLD && x < nextColX - X_THRESHOLD) {
      return i;
    }
  }

  // Fallback: find closest column
  let minDist = Infinity;
  let closestCol = 0;
  for (let i = 0; i < columnPositions.length; i++) {
    const dist = Math.abs(x - columnPositions[i]);
    if (dist < minDist) {
      minDist = dist;
      closestCol = i;
    }
  }

  return closestCol;
}

/**
 * Calculate column widths for Excel
 */
function calculateColumnWidths(data: string[][]): XLSX.ColInfo[] {
  if (data.length === 0) return [];

  const maxCols = Math.max(...data.map(row => row.length));
  const widths: number[] = new Array(maxCols).fill(10);

  for (const row of data) {
    for (let i = 0; i < row.length; i++) {
      const cellWidth = Math.min(50, Math.max(widths[i], row[i].length + 2));
      widths[i] = cellWidth;
    }
  }

  return widths.map(width => ({ wch: width }));
}
