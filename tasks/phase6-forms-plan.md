# Phase 6 - Forms Implementation Plan

## 🎯 Objective
Implement PDF form detection, filling, and editing capabilities.

## 📋 Items to Implement (5 items)

### 1. ✅ Detect form fields dalam PDF
**Goal:** Detect and parse existing form fields from PDF documents

**Implementation:**
- Use PDF.js `getFieldObjects()` API to extract form fields
- Parse field types: text, checkbox, radio, dropdown, button
- Extract field properties: name, value, default value, flags, rect
- Create TypeScript interfaces for form field data

**Files:**
- `src/renderer/lib/pdf-forms.service.ts` - Form detection service
- `src/renderer/store/forms-store.ts` - Zustand store for form state

---

### 2. ✅ Implement form filling interface
**Goal:** Allow users to fill out detected form fields

**Implementation:**
- Render form fields as interactive overlays on PDF pages
- Support different field types:
  - Text input fields
  - Checkboxes
  - Radio buttons
  - Dropdown selects
- Position overlays accurately using field coordinates
- Update field values in real-time

**Files:**
- `src/renderer/components/forms/FormFieldOverlay.tsx` - Main overlay container
- `src/renderer/components/forms/FormTextField.tsx` - Text input field
- `src/renderer/components/forms/FormCheckbox.tsx` - Checkbox field
- `src/renderer/components/forms/FormRadioButton.tsx` - Radio button field
- `src/renderer/components/forms/FormDropdown.tsx` - Dropdown select field

---

### 3. ✅ Add form data save/load
**Goal:** Persist form data for later use

**Implementation:**
- Export form data to JSON/FDF format
- Import form data from JSON/FDF
- Save filled form as new PDF (flatten fields)
- Load form data into existing PDF

**Features:**
- Export form values to JSON file
- Import JSON to populate form fields
- Save filled PDF (with pdf-lib)
- Print with form data (flatten)

**Files:**
- `src/renderer/components/forms/FormDataDialog.tsx` - Import/Export UI
- Update `pdf-manipulation.service.ts` - Add form flattening

---

### 4. ✅ Create form field editor (create new fields)
**Goal:** Allow users to create new form fields on PDF

**Implementation:**
- Click-to-place mode for adding fields
- Drag to define field rectangle
- Field properties dialog:
  - Field name
  - Field type (text, checkbox, radio, dropdown)
  - Default value
  - Required/Optional
  - Validation rules
- Visual indicators for placed fields

**Files:**
- `src/renderer/components/forms/FormFieldEditor.tsx` - Editor mode
- `src/renderer/components/forms/CreateFieldDialog.tsx` - Field properties
- `src/renderer/components/forms/FieldPlaceholder.tsx` - Visual preview

---

### 5. ✅ Support different field types
**Goal:** Complete support for all common PDF form field types

**Field Types:**
1. **Text Fields**
   - Single line
   - Multi-line (textarea)
   - Password (masked)
   - Number (validation)
   - Email (validation)

2. **Checkboxes**
   - On/Off state
   - Custom check styles

3. **Radio Buttons**
   - Group management
   - Single selection per group

4. **Dropdowns**
   - Option list
   - Allow custom input
   - Default selection

5. **Buttons** (optional)
   - Submit button
   - Reset button
   - Custom actions

**Files:**
- Update existing form field components
- Add validation utilities

---

## 🛠️ Technical Architecture

### Services Layer
```typescript
// pdf-forms.service.ts
class PDFFormsService {
  // Detection
  async detectFormFields(doc: PDFDocumentProxy): Promise<FormField[]>

  // Data management
  exportFormData(fields: FormField[]): FormDataJSON
  importFormData(json: FormDataJSON): FormField[]

  // PDF operations
  async fillFormFields(pdfBytes: Uint8Array, data: FormDataJSON): Promise<Uint8Array>
  async flattenForm(pdfBytes: Uint8Array): Promise<Uint8Array>
  async createFormField(doc: PDFDocument, field: FormFieldConfig): Promise<void>
}
```

### State Management
```typescript
// forms-store.ts
interface FormsStore {
  fields: FormField[]
  fieldValues: Record<string, any>
  editMode: boolean
  selectedField: string | null

  // Actions
  setFields: (fields: FormField[]) => void
  updateFieldValue: (name: string, value: any) => void
  toggleEditMode: () => void
  selectField: (name: string | null) => void
  addField: (field: FormField) => void
  removeField: (name: string) => void
}
```

### Types
```typescript
interface FormField {
  id: string
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button'
  page: number
  rect: [number, number, number, number] // [x, y, width, height]
  value: any
  defaultValue: any
  required: boolean
  readOnly: boolean
  options?: string[] // for dropdown
  group?: string // for radio buttons
  validation?: FieldValidation
}

interface FieldValidation {
  type: 'email' | 'number' | 'regex' | 'custom'
  pattern?: string
  min?: number
  max?: number
  message?: string
}
```

---

## 📁 File Structure

```
src/renderer/
├── lib/
│   └── pdf-forms.service.ts          ← NEW: Form detection & operations
├── store/
│   └── forms-store.ts                ← NEW: Forms state management
├── components/
│   └── forms/                        ← NEW: Forms components folder
│       ├── FormFieldOverlay.tsx      ← Main overlay container
│       ├── FormTextField.tsx         ← Text input
│       ├── FormCheckbox.tsx          ← Checkbox
│       ├── FormRadioButton.tsx       ← Radio button
│       ├── FormDropdown.tsx          ← Dropdown select
│       ├── FormFieldEditor.tsx       ← Create fields mode
│       ├── CreateFieldDialog.tsx     ← Field properties dialog
│       ├── FieldPlaceholder.tsx      ← Visual field preview
│       ├── FormDataDialog.tsx        ← Import/Export UI
│       └── FormToolbar.tsx           ← Forms toolbar
```

---

## 🎯 Implementation Order

### Day 1: Foundation & Detection
1. ✅ Create `pdf-forms.service.ts` - Form detection logic
2. ✅ Create `forms-store.ts` - State management
3. ✅ Implement field detection from PDF.js
4. ✅ Test with sample PDF forms

### Day 2: Form Filling UI
5. ✅ Create `FormFieldOverlay.tsx` - Container
6. ✅ Create `FormTextField.tsx` - Text inputs
7. ✅ Create `FormCheckbox.tsx` - Checkboxes
8. ✅ Create `FormRadioButton.tsx` - Radio buttons
9. ✅ Create `FormDropdown.tsx` - Dropdowns
10. ✅ Integrate with PDF viewer

### Day 3: Data Management
11. ✅ Create `FormDataDialog.tsx` - Import/Export UI
12. ✅ Implement JSON export/import
13. ✅ Implement form flattening (save filled PDF)
14. ✅ Add form toolbar to main UI

### Day 4: Field Editor
15. ✅ Create `FormFieldEditor.tsx` - Editor mode
16. ✅ Create `CreateFieldDialog.tsx` - Properties dialog
17. ✅ Implement click-to-place field creation
18. ✅ Add field type selection

### Day 5: Polish & Testing
19. ✅ Add validation for all field types
20. ✅ Error handling
21. ✅ UI/UX improvements
22. ✅ Test with various PDF forms
23. ✅ Documentation

---

## ✅ Acceptance Criteria

Phase 6 Forms will be complete when:

1. ✅ App can detect existing form fields in PDF
2. ✅ User can fill text fields
3. ✅ User can check/uncheck checkboxes
4. ✅ User can select radio buttons (mutually exclusive in groups)
5. ✅ User can select from dropdowns
6. ✅ User can export filled form data to JSON
7. ✅ User can import form data from JSON
8. ✅ User can save filled form as new PDF (flattened)
9. ✅ User can create new form fields (edit mode)
10. ✅ User can set field properties (name, type, required, etc.)
11. ✅ All field types are fully functional
12. ✅ Form validation works (required fields, email, number)
13. ✅ Forms work in all view modes (single, continuous, facing)

---

## 💡 Simplicity Guidelines

- ✅ Keep overlay positioning simple (transform CSS)
- ✅ Use native HTML inputs when possible
- ✅ Minimal dependencies (use PDF.js + pdf-lib)
- ✅ Reuse existing UI components (Button, Dialog, Input)
- ✅ Clear visual indicators for form fields
- ✅ One feature at a time - test incrementally

---

## 🚀 Ready to Start!

**First Step:** Create the forms service and detection logic.

Apakah rencana ini sudah sesuai? Saya akan mulai implementasi!
