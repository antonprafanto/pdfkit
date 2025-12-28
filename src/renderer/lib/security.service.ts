/**
 * Security Service
 * Handles PDF encryption, password protection, and permissions
 */

import { PDFDocument } from 'pdf-lib';

export interface EncryptionOptions {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
    fillingForms?: boolean;
    contentAccessibility?: boolean;
    documentAssembly?: boolean;
  };
}

export interface PasswordStrength {
  score: number; // 0-4 (very weak, weak, medium, strong, very strong)
  label: string;
  color: string;
  suggestions: string[];
}

export class SecurityService {
  /**
   * Encrypt PDF with password and permissions
   * Uses Electron main process with node-qpdf for native encryption
   */
  async encryptPDF(file: File, options: EncryptionOptions): Promise<Uint8Array> {
    try {
      // Get PDF bytes
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // Call Electron main process for encryption
      const result = await window.electronAPI.encryptPDF(pdfBytes, {
        userPassword: options.userPassword,
        ownerPassword: options.ownerPassword,
        permissions: {
          printing: options.permissions?.printing,
          modifying: options.permissions?.modifying,
          copying: options.permissions?.copying,
          annotating: options.permissions?.annotating,
        },
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Encryption failed');
      }

      return result.data;
    } catch (error: any) {
      console.error('Encryption error:', error);
      throw new Error(error.message || 'Failed to encrypt PDF');
    }
  }

  /**
   * Encrypt multiple PDFs (bulk operation)
   */
  async encryptMultiplePDFs(
    files: File[],
    options: EncryptionOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<Uint8Array[]> {
    const results: Uint8Array[] = [];

    for (let i = 0; i < files.length; i++) {
      const encrypted = await this.encryptPDF(files[i], options);
      results.push(encrypted);

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    return results;
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    if (!password) {
      return {
        score: 0,
        label: 'No password',
        color: '#E5E7EB',
        suggestions: ['Enter a password'],
      };
    }

    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score++;
    else suggestions.push('Use at least 8 characters');

    if (password.length >= 12) score++;
    else if (password.length >= 8) suggestions.push('Use 12+ characters for better security');

    // Complexity checks
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

    if (hasLowerCase && hasUpperCase) score++;
    else suggestions.push('Use both uppercase and lowercase letters');

    if (hasNumbers) score++;
    else suggestions.push('Include numbers');

    if (hasSpecialChars) score++;
    else suggestions.push('Include special characters (!@#$%^&*)');

    // Common patterns check
    const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'admin'];
    const lowerPassword = password.toLowerCase();
    if (commonPatterns.some(pattern => lowerPassword.includes(pattern))) {
      score = Math.max(0, score - 2);
      suggestions.push('Avoid common words and patterns');
    }

    // Map score to label and color
    const strengthMap = [
      { label: 'Very Weak', color: '#DC2626' },
      { label: 'Weak', color: '#F59E0B' },
      { label: 'Medium', color: '#EAB308' },
      { label: 'Strong', color: '#10B981' },
      { label: 'Very Strong', color: '#059669' },
    ];

    const strength = strengthMap[Math.min(score, 4)];

    return {
      score,
      label: strength.label,
      color: strength.color,
      suggestions,
    };
  }

  /**
   * Check if PDF is encrypted (read-only check)
   */
  async isPDFEncrypted(file: File): Promise<boolean> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await PDFDocument.load(arrayBuffer);
      // If we can load it without error, it's either not encrypted or already unlocked
      return false;
    } catch (error: any) {
      // Check if error is related to encryption
      if (error.message && error.message.includes('encrypt')) {
        return true;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();
