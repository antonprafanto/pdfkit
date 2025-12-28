/**
 * PDF Forms Service
 * Handles PDF form field detection, filling, and management
 */

import { PDFDocumentProxy, PDFPageProxy } from './pdf-config';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, StandardFonts } from 'pdf-lib';

/**
 * Form field types supported
 */
export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button';

/**
 * Field validation types
 */
export interface FieldValidation {
  type?: 'email' | 'number' | 'regex' | 'custom';
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

/**
 * Form field interface
 */
export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  page: number;
  rect: [number, number, number, number]; // [x, y, width, height]
  value: any;
  defaultValue: any;
  required: boolean;
  readOnly: boolean;
  options?: string[]; // for dropdown
  group?: string; // for radio buttons
  validation?: FieldValidation;
  multiline?: boolean; // for text fields
  maxLength?: number; // for text fields
}

/**
 * Form data export/import format
 */
export interface FormDataJSON {
  version: string;
  fields: Record<string, any>;
  metadata?: {
    title?: string;
    author?: string;
    createdAt?: string;
    modifiedAt?: string;
  };
}

/**
 * PDF Forms Service Class
 */
export class PDFFormsService {
  /**
   * Detect form fields from a PDF document
   */
  async detectFormFields(document: PDFDocumentProxy): Promise<FormField[]> {
    const fields: FormField[] = [];

    try {
      // Get the number of pages
      const numPages = document.numPages;

      console.log(`[Forms] Scanning ${numPages} pages for form fields...`);

      // Iterate through each page to find form fields
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await document.getPage(pageNum);
        const pageFields = await this.extractFieldsFromPage(page, pageNum);

        if (pageFields.length > 0) {
          console.log(`[Forms] Found ${pageFields.length} field(s) on page ${pageNum}`);
        }

        fields.push(...pageFields);
      }

      console.log(`[Forms] Total fields detected: ${fields.length}`);
      return fields;
    } catch (error) {
      console.error('Error detecting form fields:', error);
      throw new Error('Failed to detect form fields');
    }
  }

  /**
   * Extract form fields from a single page
   */
  private async extractFieldsFromPage(page: PDFPageProxy, pageNum: number): Promise<FormField[]> {
    const fields: FormField[] = [];

    try {
      // Get annotations from the page (form fields are a type of annotation)
      const annotations = await page.getAnnotations();

      console.log(`[Forms] Page ${pageNum}: Found ${annotations.length} annotation(s)`);

      // Log annotation types for debugging
      if (annotations.length > 0) {
        const subtypes = annotations.map((a: any) => a.subtype || 'unknown');
        console.log(`[Forms] Page ${pageNum}: Annotation types:`, subtypes);
      }

      // Filter for form field annotations
      for (const annotation of annotations) {
        if (annotation.subtype === 'Widget') {
          console.log(`[Forms] Page ${pageNum}: Processing Widget annotation:`, annotation.fieldName);
          const field = this.parseFormField(annotation, pageNum, page);
          if (field) {
            fields.push(field);
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting fields from page ${pageNum}:`, error);
    }

    return fields;
  }

  /**
   * Parse a form field annotation into a FormField object
   */
  private parseFormField(annotation: any, pageNum: number, page: PDFPageProxy): FormField | null {
    try {
      // Get field properties
      const fieldName = annotation.fieldName || `field_${Date.now()}_${Math.random()}`;
      const fieldType = this.determineFieldType(annotation);
      const rect = annotation.rect || [0, 0, 100, 20];

      // Get viewport to transform coordinates
      const viewport = page.getViewport({ scale: 1.0 });

      // Transform rect coordinates from PDF space to viewport space
      const [x1, y1, x2, y2] = rect;
      const transformedRect: [number, number, number, number] = [
        x1,
        viewport.height - y2, // PDF coordinates are bottom-up
        x2 - x1, // width
        y2 - y1, // height
      ];

      const field: FormField = {
        id: `${fieldName}_${pageNum}`,
        name: fieldName,
        type: fieldType,
        page: pageNum,
        rect: transformedRect,
        value: annotation.fieldValue || annotation.buttonValue || '',
        defaultValue: annotation.defaultFieldValue || '',
        required: annotation.required || false,
        readOnly: annotation.readOnly || false,
        multiline: annotation.multiLine || false,
        maxLength: annotation.maxLen || undefined,
      };

      // Add options for dropdown fields
      if (fieldType === 'dropdown' && annotation.options) {
        field.options = annotation.options.map((opt: any) => opt.displayValue || opt.exportValue || opt);
      }

      // Add group for radio buttons
      if (fieldType === 'radio' && annotation.radioButton) {
        field.group = annotation.fieldName;
      }

      return field;
    } catch (error) {
      console.error('Error parsing form field:', error);
      return null;
    }
  }

  /**
   * Determine the field type from annotation properties
   */
  private determineFieldType(annotation: any): FormFieldType {
    const fieldType = annotation.fieldType;

    if (fieldType === 'Tx') return 'text';
    if (fieldType === 'Ch') return 'dropdown';
    if (fieldType === 'Btn') {
      // Distinguish between checkbox, radio, and button
      if (annotation.checkBox) return 'checkbox';
      if (annotation.radioButton) return 'radio';
      return 'button';
    }

    return 'text'; // default
  }

  /**
   * Export form data to JSON format
   */
  exportFormData(fields: FormField[], metadata?: any): FormDataJSON {
    const fieldValues: Record<string, any> = {};

    fields.forEach((field) => {
      fieldValues[field.name] = field.value;
    });

    return {
      version: '1.0',
      fields: fieldValues,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Import form data from JSON
   */
  importFormData(json: FormDataJSON, existingFields: FormField[]): FormField[] {
    const updatedFields = existingFields.map((field) => {
      if (json.fields.hasOwnProperty(field.name)) {
        return {
          ...field,
          value: json.fields[field.name],
        };
      }
      return field;
    });

    return updatedFields;
  }

  /**
   * Fill form fields in a PDF using pdf-lib
   */
  async fillFormFields(pdfBytes: Uint8Array, formData: FormDataJSON): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Iterate through form data and fill fields
      for (const [fieldName, value] of Object.entries(formData.fields)) {
        try {
          // Try to get the field
          const field = form.getField(fieldName);

          if (!field) continue;

          // Fill based on field type
          if (field instanceof PDFTextField) {
            field.setText(String(value || ''));
          } else if (field instanceof PDFCheckBox) {
            if (value) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFDropdown) {
            field.select(String(value || ''));
          } else if (field instanceof PDFRadioGroup) {
            field.select(String(value || ''));
          }
        } catch (fieldError) {
          console.warn(`Could not fill field ${fieldName}:`, fieldError);
        }
      }

      // Save the filled PDF
      const filledPdfBytes = await pdfDoc.save();
      return filledPdfBytes;
    } catch (error) {
      console.error('Error filling form fields:', error);
      throw new Error('Failed to fill form fields');
    }
  }

  /**
   * Flatten form fields (make them non-editable)
   */
  async flattenForm(pdfBytes: Uint8Array): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Flatten the form
      form.flatten();

      // Save the flattened PDF
      const flattenedPdfBytes = await pdfDoc.save();
      return flattenedPdfBytes;
    } catch (error) {
      console.error('Error flattening form:', error);
      throw new Error('Failed to flatten form');
    }
  }

  /**
   * Create a new form field in a PDF
   */
  async createFormField(pdfBytes: Uint8Array, fieldConfig: Partial<FormField>): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();

      if (!fieldConfig.page || fieldConfig.page < 1 || fieldConfig.page > pages.length) {
        throw new Error('Invalid page number');
      }

      const page = pages[fieldConfig.page - 1];
      const { width, height } = page.getSize();

      // Get field position and size
      const [x, y, w, h] = fieldConfig.rect || [50, 50, 200, 30];

      // Transform coordinates (PDF coordinates are bottom-up)
      const pdfY = height - y - h;

      // Create field based on type
      switch (fieldConfig.type) {
        case 'text': {
          const textField = form.createTextField(fieldConfig.name || `text_${Date.now()}`);
          textField.addToPage(page, { x, y: pdfY, width: w, height: h });
          if (fieldConfig.defaultValue) {
            textField.setText(String(fieldConfig.defaultValue));
          }
          if (fieldConfig.required) {
            textField.enableRequired();
          }
          if (fieldConfig.readOnly) {
            textField.enableReadOnly();
          }
          if (fieldConfig.multiline) {
            textField.enableMultiline();
          }
          if (fieldConfig.maxLength) {
            textField.setMaxLength(fieldConfig.maxLength);
          }
          break;
        }

        case 'checkbox': {
          const checkbox = form.createCheckBox(fieldConfig.name || `checkbox_${Date.now()}`);
          checkbox.addToPage(page, { x, y: pdfY, width: h, height: h }); // Square
          if (fieldConfig.defaultValue) {
            checkbox.check();
          }
          if (fieldConfig.required) {
            checkbox.enableRequired();
          }
          if (fieldConfig.readOnly) {
            checkbox.enableReadOnly();
          }
          break;
        }

        case 'radio': {
          // Radio buttons need a group
          const groupName = fieldConfig.group || fieldConfig.name || `radio_${Date.now()}`;
          let radioGroup;

          try {
            radioGroup = form.getRadioGroup(groupName);
          } catch {
            radioGroup = form.createRadioGroup(groupName);
          }

          radioGroup.addOptionToPage(String(fieldConfig.value || 'option'), page, {
            x,
            y: pdfY,
            width: h,
            height: h,
          });

          if (fieldConfig.required) {
            radioGroup.enableRequired();
          }
          if (fieldConfig.readOnly) {
            radioGroup.enableReadOnly();
          }
          break;
        }

        case 'dropdown': {
          const dropdown = form.createDropdown(fieldConfig.name || `dropdown_${Date.now()}`);
          dropdown.addToPage(page, { x, y: pdfY, width: w, height: h });

          if (fieldConfig.options && fieldConfig.options.length > 0) {
            dropdown.addOptions(fieldConfig.options);
            if (fieldConfig.defaultValue) {
              dropdown.select(String(fieldConfig.defaultValue));
            }
          }

          if (fieldConfig.required) {
            dropdown.enableRequired();
          }
          if (fieldConfig.readOnly) {
            dropdown.enableReadOnly();
          }
          break;
        }

        case 'button': {
          const button = form.createButton(fieldConfig.name || `button_${Date.now()}`);
          button.addToPage(page, { x, y: pdfY, width: w, height: h });
          break;
        }
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      return modifiedPdfBytes;
    } catch (error) {
      console.error('Error creating form field:', error);
      throw new Error('Failed to create form field');
    }
  }

  /**
   * Validate a form field value
   */
  validateField(field: FormField, value: any): { valid: boolean; message?: string } {
    // Required validation
    if (field.required && (!value || value === '')) {
      return { valid: false, message: 'This field is required' };
    }

    // Type-specific validation
    if (field.validation) {
      const { type, pattern, min, max, minLength, maxLength, message } = field.validation;

      switch (type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            return { valid: false, message: message || 'Invalid email format' };
          }
          break;

        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            return { valid: false, message: message || 'Must be a number' };
          }
          if (min !== undefined && num < min) {
            return { valid: false, message: message || `Must be at least ${min}` };
          }
          if (max !== undefined && num > max) {
            return { valid: false, message: message || `Must be at most ${max}` };
          }
          break;

        case 'regex':
          if (pattern) {
            const regex = new RegExp(pattern);
            if (!regex.test(String(value))) {
              return { valid: false, message: message || 'Invalid format' };
            }
          }
          break;
      }

      // Length validation
      if (minLength !== undefined && String(value).length < minLength) {
        return { valid: false, message: message || `Must be at least ${minLength} characters` };
      }
      if (maxLength !== undefined && String(value).length > maxLength) {
        return { valid: false, message: message || `Must be at most ${maxLength} characters` };
      }
    }

    // Max length validation (field-specific)
    if (field.maxLength && String(value).length > field.maxLength) {
      return { valid: false, message: `Maximum length is ${field.maxLength} characters` };
    }

    return { valid: true };
  }

  /**
   * Validate all form fields
   */
  validateAllFields(fields: FormField[]): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let valid = true;

    fields.forEach((field) => {
      const result = this.validateField(field, field.value);
      if (!result.valid) {
        errors[field.name] = result.message || 'Invalid value';
        valid = false;
      }
    });

    return { valid, errors };
  }

  /**
   * Update font appearance of all form fields in PDF
   * This modifies the PDF's AcroForm fields to use the specified font and size
   */
  async updateFormFieldsAppearance(
    pdfBytes: Uint8Array,
    fontName: string,
    fontSize: number
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      console.log(`[Forms] Updating appearance for ${fields.length} field(s) - Font: ${fontName}, Size: ${fontSize}px`);

      // Get the standard font
      let font;
      switch (fontName) {
        case 'Courier':
          font = await pdfDoc.embedFont(StandardFonts.Courier);
          break;
        case 'Helvetica':
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          break;
        case 'Times-Roman':
          font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          break;
        default:
          font = await pdfDoc.embedFont(StandardFonts.Courier);
      }

      // Update each text field
      for (const field of fields) {
        if (field instanceof PDFTextField) {
          try {
            // Update default appearance with new font and size
            field.defaultUpdateAppearances(font);

            // Note: pdf-lib doesn't expose direct fontSize setting for existing fields
            // The font will be applied, but size is harder to change after creation
            console.log(`[Forms]   ✓ Updated field: ${field.getName()}`);
          } catch (err) {
            console.warn(`[Forms]   ⚠ Could not update field ${field.getName()}:`, err);
          }
        }
      }

      const updatedBytes = await pdfDoc.save();
      console.log('[Forms] ✓ Field appearances updated');
      return updatedBytes;
    } catch (error) {
      console.error('[Forms] Error updating field appearance:', error);
      throw new Error('Failed to update form field appearance');
    }
  }

  /**
   * Save all fields structure to PDF (create AcroForm fields)
   * This creates a PDF template with interactive fields that can be opened in any PDF reader
   */
  async saveFieldsStructureToPDF(
    originalPdfBytes: Uint8Array,
    fields: FormField[],
    fontName: string = 'Courier',
    fontSize: number = 12
  ): Promise<Uint8Array> {
    try {
      console.log(`[Forms] Saving ${fields.length} fields to PDF with font: ${fontName}, size: ${fontSize}px...`);

      // Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();

      // Embed the standard font
      let font;
      switch (fontName) {
        case 'Courier':
          font = await pdfDoc.embedFont(StandardFonts.Courier);
          break;
        case 'Helvetica':
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          break;
        case 'Times-Roman':
          font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          break;
        default:
          font = await pdfDoc.embedFont(StandardFonts.Courier);
      }
      console.log(`[Forms] Using font: ${fontName}`);

      // Group fields by page for efficient processing
      const fieldsByPage = new Map<number, FormField[]>();
      fields.forEach((field) => {
        const pageNum = field.page;
        if (!fieldsByPage.has(pageNum)) {
          fieldsByPage.set(pageNum, []);
        }
        fieldsByPage.get(pageNum)!.push(field);
      });

      console.log(`[Forms] Fields distributed across ${fieldsByPage.size} page(s)`);

      // Create fields on each page
      for (const [pageNum, pageFields] of fieldsByPage) {
        if (pageNum < 1 || pageNum > pages.length) {
          console.warn(`[Forms] Skipping invalid page number: ${pageNum}`);
          continue;
        }

        const page = pages[pageNum - 1]; // 0-indexed
        const { height } = page.getSize();

        console.log(`[Forms] Creating ${pageFields.length} field(s) on page ${pageNum}`);

        for (const field of pageFields) {
          try {
            // Extract dimensions from rect: [x, y, width, height]
            const [x, y, width, fieldHeight] = field.rect;

            // Transform coordinates (PDF coordinates are bottom-up)
            const pdfY = height - y - fieldHeight;

            // Create field based on type
            switch (field.type) {
              case 'text': {
                const textField = form.createTextField(field.name);
                textField.addToPage(page, {
                  x,
                  y: pdfY,
                  width,
                  height: fieldHeight,
                });

                // Set properties
                if (field.defaultValue) {
                  textField.setText(String(field.defaultValue));
                }
                if (field.required) {
                  textField.enableRequired();
                }
                if (field.readOnly) {
                  textField.enableReadOnly();
                }
                if (field.multiline) {
                  textField.enableMultiline();
                }
                if (field.maxLength) {
                  textField.setMaxLength(field.maxLength);
                }

                // Set Default Appearance (DA) string with custom font size
                // DA format: /FontName fontSize Tf colorR colorG colorB rg
                const fontAbbrev = fontName === 'Courier' ? 'Cour' : fontName === 'Helvetica' ? 'Helv' : 'TiRo';
                const daString = `/${fontAbbrev} ${fontSize} Tf 0 g`;

                textField.acroField.setDefaultAppearance(daString);

                // Update visual appearance with the embedded font
                textField.updateAppearances(font);

                console.log(`[Forms]   ✓ Created text field: ${field.name} with ${fontName} ${fontSize}px`);
                break;
              }

              case 'checkbox': {
                const checkbox = form.createCheckBox(field.name);
                checkbox.addToPage(page, {
                  x,
                  y: pdfY,
                  width: fieldHeight, // Square checkbox
                  height: fieldHeight,
                });

                if (field.defaultValue) {
                  checkbox.check();
                }
                if (field.required) {
                  checkbox.enableRequired();
                }
                if (field.readOnly) {
                  checkbox.enableReadOnly();
                }

                console.log(`[Forms]   ✓ Created checkbox: ${field.name}`);
                break;
              }

              case 'radio': {
                // Radio buttons work in groups
                const groupName = field.group || field.name;
                let radioGroup;

                try {
                  // Try to get existing group
                  radioGroup = form.getRadioGroup(groupName);
                } catch {
                  // Create new group if doesn't exist
                  radioGroup = form.createRadioGroup(groupName);
                }

                // Add option to the group
                const optionName = field.value || `option_${Date.now()}`;
                radioGroup.addOptionToPage(String(optionName), page, {
                  x,
                  y: pdfY,
                  width: fieldHeight,
                  height: fieldHeight,
                });

                if (field.required) {
                  radioGroup.enableRequired();
                }
                if (field.readOnly) {
                  radioGroup.enableReadOnly();
                }

                console.log(`[Forms]   ✓ Created radio button: ${groupName} - ${optionName}`);
                break;
              }

              case 'dropdown': {
                const dropdown = form.createDropdown(field.name);
                dropdown.addToPage(page, {
                  x,
                  y: pdfY,
                  width,
                  height: fieldHeight,
                });

                // Add options
                if (field.options && field.options.length > 0) {
                  dropdown.addOptions(field.options);

                  // Set default value if provided
                  if (field.defaultValue && field.options.includes(String(field.defaultValue))) {
                    dropdown.select(String(field.defaultValue));
                  }
                }

                if (field.required) {
                  dropdown.enableRequired();
                }
                if (field.readOnly) {
                  dropdown.enableReadOnly();
                }

                console.log(`[Forms]   ✓ Created dropdown: ${field.name} (${field.options?.length || 0} options)`);
                break;
              }

              case 'button': {
                const button = form.createButton(field.name);
                button.addToPage(page, {
                  x,
                  y: pdfY,
                  width,
                  height: fieldHeight,
                });

                console.log(`[Forms]   ✓ Created button: ${field.name}`);
                break;
              }

              default:
                console.warn(`[Forms]   ⚠ Unknown field type: ${field.type}`);
            }
          } catch (fieldError) {
            console.error(`[Forms]   ✗ Failed to create field ${field.name}:`, fieldError);
            // Continue with next field instead of failing completely
          }
        }
      }

      // Save the PDF with all fields embedded
      console.log('[Forms] Saving PDF with AcroForm fields...');
      const pdfBytes = await pdfDoc.save();

      console.log('[Forms] ✓ PDF saved successfully with interactive fields!');
      return pdfBytes;
    } catch (error) {
      console.error('[Forms] Error saving fields structure to PDF:', error);
      throw new Error(`Failed to save PDF with fields: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const pdfFormsService = new PDFFormsService();
