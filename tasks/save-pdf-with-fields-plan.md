# 💾 Save PDF with Fields - Implementation Plan

## 🎯 Tujuan

Menambahkan kemampuan untuk **menyimpan PDF dengan AcroForm fields** yang telah dibuat secara manual, sehingga:
- ✅ Field structure tersimpan permanen di PDF
- ✅ PDF bisa dibuka di software lain (Adobe, Foxit, Chrome)
- ✅ Field tetap interaktif dan bisa diisi
- ✅ Mendukung semua field types (text, checkbox, radio, dropdown)

---

## 📋 Todo Items

### 1. ✅ Implement `createTextField()` di pdf-lib
- Buat method untuk create text field dengan posisi & ukuran
- Support multiline text field (textarea)
- Support required field validation
- Set font, size, alignment

### 2. ✅ Implement `createCheckbox()` di pdf-lib
- Create checkbox field di posisi tertentu
- Support default value (checked/unchecked)
- Set appearance (checkmark style)

### 3. ✅ Implement `createRadioButton()` di pdf-lib
- Create radio button field
- Support radio group (mutual exclusion)
- Set appearance (circle/square)

### 4. ✅ Implement `createDropdown()` di pdf-lib
- Create dropdown/select field
- Support options list
- Set default selected value

### 5. ✅ Implement `saveFieldsStructureToPDF()`
- Konversi semua fields dari Zustand store → PDF AcroForm
- Embed fields ke PDF bytes
- Return PDF with all fields embedded

### 6. ✅ Add "Save PDF with Fields" button
- Tambah button baru di FormToolbar
- Berbeda dari "Save Filled PDF" (yang untuk values)
- Label: "Save as Template" atau "Save with Fields"

### 7. ✅ Implement file save handler
- Gunakan IPC untuk save dialog
- Suggest filename: `{original}_template.pdf`
- Save PDF bytes dengan AcroForm fields

### 8. ✅ Testing & Validation
- Test dengan berbagai field types
- Buka PDF result di Adobe Reader
- Verify fields bisa diisi di software lain
- Test koordinat positioning accuracy

---

## 🔧 Technical Implementation

### A. pdf-lib Field Creation Methods

```typescript
// src/renderer/lib/pdf-forms.service.ts

class PDFFormsService {
  /**
   * Create text field in PDF
   */
  async createTextField(
    pdfDoc: PDFDocument,
    page: PDFPage,
    field: FormField
  ): Promise<void> {
    const form = pdfDoc.getForm();
    const textField = form.createTextField(field.name);

    // Set position & size
    textField.addToPage(page, {
      x: field.position.x,
      y: page.getHeight() - field.position.y - field.height, // PDF coords from bottom
      width: field.width,
      height: field.height,
    });

    // Set properties
    if (field.required) {
      textField.enableRequired();
    }
    if (field.defaultValue) {
      textField.setText(field.defaultValue);
    }
    if (field.multiline) {
      textField.enableMultiline();
    }
  }

  /**
   * Create checkbox field in PDF
   */
  async createCheckbox(
    pdfDoc: PDFDocument,
    page: PDFPage,
    field: FormField
  ): Promise<void> {
    const form = pdfDoc.getForm();
    const checkbox = form.createCheckBox(field.name);

    checkbox.addToPage(page, {
      x: field.position.x,
      y: page.getHeight() - field.position.y - field.height,
      width: field.width,
      height: field.height,
    });

    if (field.defaultValue) {
      checkbox.check();
    }
  }

  /**
   * Create radio button field in PDF
   */
  async createRadioButton(
    pdfDoc: PDFDocument,
    page: PDFPage,
    field: FormField
  ): Promise<void> {
    const form = pdfDoc.getForm();

    // Create or get radio group
    let radioGroup = form.getRadioGroup(field.groupName || field.name);
    if (!radioGroup) {
      radioGroup = form.createRadioGroup(field.groupName || field.name);
    }

    radioGroup.addOptionToPage(field.name, page, {
      x: field.position.x,
      y: page.getHeight() - field.position.y - field.height,
      width: field.width,
      height: field.height,
    });
  }

  /**
   * Create dropdown field in PDF
   */
  async createDropdown(
    pdfDoc: PDFDocument,
    page: PDFPage,
    field: FormField
  ): Promise<void> {
    const form = pdfDoc.getForm();
    const dropdown = form.createDropdown(field.name);

    dropdown.addToPage(page, {
      x: field.position.x,
      y: page.getHeight() - field.position.y - field.height,
      width: field.width,
      height: field.height,
    });

    // Set options
    if (field.options) {
      dropdown.setOptions(field.options);
    }

    // Set default
    if (field.defaultValue) {
      dropdown.select(field.defaultValue);
    }
  }

  /**
   * Save all fields structure to PDF
   */
  async saveFieldsStructureToPDF(
    originalPdfBytes: Uint8Array,
    fields: FormField[]
  ): Promise<Uint8Array> {
    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    // Group fields by page
    const fieldsByPage = new Map<number, FormField[]>();
    fields.forEach(field => {
      if (!fieldsByPage.has(field.pageNumber)) {
        fieldsByPage.set(field.pageNumber, []);
      }
      fieldsByPage.get(field.pageNumber)!.push(field);
    });

    // Create fields on each page
    for (const [pageNum, pageFields] of fieldsByPage) {
      const page = pdfDoc.getPage(pageNum - 1); // 0-indexed

      for (const field of pageFields) {
        switch (field.type) {
          case 'text':
            await this.createTextField(pdfDoc, page, field);
            break;
          case 'checkbox':
            await this.createCheckbox(pdfDoc, page, field);
            break;
          case 'radio':
            await this.createRadioButton(pdfDoc, page, field);
            break;
          case 'dropdown':
            await this.createDropdown(pdfDoc, page, field);
            break;
        }
      }
    }

    // Save PDF with fields
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
}
```

### B. UI Integration

```typescript
// FormToolbar.tsx - Add button

interface FormToolbarProps {
  // ... existing props
  onSaveTemplate: () => void;  // NEW
}

// In toolbar JSX:
{fields.length > 0 && (
  <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
    <h3 className="text-sm font-semibold mb-2">
      Save Template
    </h3>
    <button
      onClick={onSaveTemplate}
      className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
    >
      Save PDF with Fields
    </button>
    <p className="text-xs text-gray-500 mt-1">
      Save as template with interactive fields
    </p>
  </div>
)}
```

### C. App.tsx Handler

```typescript
// App.tsx

const handleSaveTemplate = async () => {
  if (!pdfBytes || !fields.length) return;

  try {
    setIsSavingTemplate(true);

    // Generate PDF with fields
    const pdfWithFields = await pdfFormsService.saveFieldsStructureToPDF(
      pdfBytes,
      fields
    );

    // Save file dialog
    const suggestedName = fileName
      ? fileName.replace('.pdf', '_template.pdf')
      : 'template.pdf';

    const savedPath = await window.electronAPI.saveFile(
      pdfWithFields,
      suggestedName
    );

    if (savedPath) {
      alert(`Template saved successfully!\n\nFile: ${savedPath}\n\nYou can now open this PDF in other software (Adobe Reader, Chrome, etc.) and the form fields will be interactive.`);
    }
  } catch (error) {
    console.error('Save template error:', error);
    alert(`Failed to save template: ${error.message}`);
  } finally {
    setIsSavingTemplate(false);
  }
};
```

---

## 🎯 Expected User Flow

1. **User opens static PDF** (Laporan Tutorial UT)
2. **User clicks "Create New Fields"** button
3. **User adds fields manually** (nama, fakultas, dll)
4. **User clicks "Save PDF with Fields"**
5. **System generates PDF with AcroForm fields embedded**
6. **User saves file** as `laporan_template.pdf`
7. **User opens in Adobe Reader** → Fields are interactive! ✅
8. **User can fill form** in any PDF reader
9. **User can reuse template** for future use

---

## ✅ Success Criteria

- [ ] All field types (text, checkbox, radio, dropdown) work in pdf-lib
- [ ] Koordinat posisi fields akurat (sesuai dengan yang di-click)
- [ ] PDF result bisa dibuka di Adobe Reader
- [ ] Fields bisa diisi di Adobe Reader
- [ ] Required fields validation works
- [ ] Multiline text fields work
- [ ] Radio button groups work (mutual exclusion)
- [ ] Dropdown options visible & selectable
- [ ] Save dialog works dengan filename suggestion
- [ ] Error handling works (invalid PDF, save errors)

---

## 🚀 Implementation Order

1. **Step 1**: Implement field creation methods (createTextField, createCheckbox, dll)
2. **Step 2**: Implement saveFieldsStructureToPDF()
3. **Step 3**: Add "Save PDF with Fields" button to UI
4. **Step 4**: Wire up handler in App.tsx
5. **Step 5**: Test with sample fields
6. **Step 6**: Test opening in Adobe Reader
7. **Step 7**: Polish error messages & UX

---

**Status**: Ready untuk implementasi! 🚀
