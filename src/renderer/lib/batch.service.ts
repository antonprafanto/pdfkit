/**
 * Batch Processing Service
 * Handles batch operations on multiple PDF files
 */

export type BatchOperationType = 'merge' | 'convert' | 'watermark' | 'encrypt' | 'compress';

export interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  progress?: number;
  result?: Uint8Array;
}

export interface BatchProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  overallProgress: number;
  fileProgress: number;
}

export interface BatchResult {
  successCount: number;
  errorCount: number;
  results: Array<{
    fileName: string;
    success: boolean;
    error?: string;
    outputPath?: string;
  }>;
}

/**
 * Batch Processing Service Class
 */
export class BatchService {
  private aborted = false;

  /**
   * Process files with a given operation
   */
  async processFiles<T>(
    files: BatchFile[],
    operation: (file: BatchFile, onProgress: (p: number) => void) => Promise<T>,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<Array<{ file: BatchFile; result?: T; error?: string }>> {
    this.aborted = false;
    const results: Array<{ file: BatchFile; result?: T; error?: string }> = [];

    for (let i = 0; i < files.length; i++) {
      if (this.aborted) break;

      const file = files[i];
      file.status = 'processing';
      file.progress = 0;

      onProgress?.({
        currentFile: i + 1,
        totalFiles: files.length,
        currentFileName: file.name,
        overallProgress: i / files.length,
        fileProgress: 0,
      });

      try {
        const result = await operation(file, (p) => {
          file.progress = p;
          onProgress?.({
            currentFile: i + 1,
            totalFiles: files.length,
            currentFileName: file.name,
            overallProgress: (i + p) / files.length,
            fileProgress: p,
          });
        });

        file.status = 'completed';
        file.progress = 1;
        results.push({ file, result });
      } catch (err: any) {
        file.status = 'error';
        file.error = err.message || 'Processing failed';
        results.push({ file, error: file.error });
      }
    }

    // Final progress
    onProgress?.({
      currentFile: files.length,
      totalFiles: files.length,
      currentFileName: 'Complete',
      overallProgress: 1,
      fileProgress: 1,
    });

    return results;
  }

  /**
   * Abort current batch operation
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * Check if operation was aborted
   */
  isAborted(): boolean {
    return this.aborted;
  }

  /**
   * Generate unique ID for batch files
   */
  generateId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create BatchFile from File
   */
  createBatchFile(file: File): BatchFile {
    return {
      id: this.generateId(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
    };
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get summary of batch results
   */
  getSummary(results: Array<{ file: BatchFile; error?: string }>): BatchResult {
    const successCount = results.filter((r) => !r.error).length;
    const errorCount = results.filter((r) => r.error).length;

    return {
      successCount,
      errorCount,
      results: results.map((r) => ({
        fileName: r.file.name,
        success: !r.error,
        error: r.error,
      })),
    };
  }
}

// Export singleton instance
export const batchService = new BatchService();
