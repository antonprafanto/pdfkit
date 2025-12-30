/**
 * Error Logging Utility
 * Centralized error handling and logging
 */

type ErrorSeverity = 'info' | 'warn' | 'error' | 'critical';

interface ErrorLogEntry {
  timestamp: Date;
  severity: ErrorSeverity;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 100;
  private listeners: ((entry: ErrorLogEntry) => void)[] = [];

  // Log an error with optional context
  log(
    severity: ErrorSeverity,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      severity,
      message,
      context,
      stack: error?.stack,
    };

    // Add to internal log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on severity
    const prefix = `[${severity.toUpperCase()}]`;
    switch (severity) {
      case 'info':
        console.info(prefix, message, context || '');
        break;
      case 'warn':
        console.warn(prefix, message, context || '');
        break;
      case 'error':
      case 'critical':
        console.error(prefix, message, context || '', error?.stack || '');
        break;
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(entry));
  }

  // Convenience methods
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  critical(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('critical', message, context, error);
  }

  // Get all logs
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  // Get logs filtered by severity
  getLogsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.logs.filter((log) => log.severity === severity);
  }

  // Clear all logs
  clear(): void {
    this.logs = [];
  }

  // Subscribe to new log entries
  subscribe(listener: (entry: ErrorLogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Global error handler
export function setupGlobalErrorHandler(): void {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error(
      'Unhandled Promise Rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledrejection' }
    );
  });

  // Global errors
  window.addEventListener('error', (event) => {
    errorLogger.error(
      event.message || 'Unknown Error',
      event.error instanceof Error ? event.error : undefined,
      {
        type: 'error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}

// User-friendly error messages
export const ErrorMessages = {
  // File operations
  FILE_NOT_FOUND: 'The file could not be found. It may have been moved or deleted.',
  FILE_READ_ERROR: 'Unable to read the file. Please check if you have permission to access it.',
  FILE_WRITE_ERROR: 'Unable to save the file. Please check if the location is writable.',
  FILE_TOO_LARGE: 'The file is too large to process. Please try a smaller file.',
  
  // PDF operations
  PDF_INVALID: 'This file does not appear to be a valid PDF.',
  PDF_ENCRYPTED: 'This PDF is password protected. Please enter the password to open it.',
  PDF_CORRUPTED: 'This PDF appears to be corrupted and cannot be opened.',
  
  // Network
  NETWORK_ERROR: 'A network error occurred. Please check your internet connection.',
  NETWORK_TIMEOUT: 'The request timed out. Please try again.',
  
  // AI features
  AI_API_ERROR: 'The AI service is currently unavailable. Please try again later.',
  AI_RATE_LIMIT: 'You have exceeded the rate limit. Please wait a moment before trying again.',
  AI_INVALID_KEY: 'The API key is invalid. Please check your settings.',
  
  // General
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  PERMISSION_DENIED: 'Permission denied. Please check your access rights.',
};

// Get user-friendly message from error
export function getUserFriendlyError(error: Error | string, fallback?: string): string {
  const message = error instanceof Error ? error.message : error;
  
  // Check for known error patterns
  if (message.includes('ENOENT') || message.includes('not found')) {
    return ErrorMessages.FILE_NOT_FOUND;
  }
  if (message.includes('EACCES') || message.includes('permission')) {
    return ErrorMessages.PERMISSION_DENIED;
  }
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorMessages.NETWORK_ERROR;
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return ErrorMessages.AI_RATE_LIMIT;
  }
  if (message.includes('invalid') && message.includes('key')) {
    return ErrorMessages.AI_INVALID_KEY;
  }
  
  return fallback || ErrorMessages.UNKNOWN_ERROR;
}

export default errorLogger;
