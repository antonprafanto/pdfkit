/**
 * Forms Store
 * Zustand store for managing PDF form state
 */

import { create } from 'zustand';
import { FormField } from '../lib/pdf-forms.service';

interface FormsStore {
  // State
  fields: FormField[];
  fieldValues: Record<string, any>;
  editMode: boolean;
  selectedField: string | null;
  validationErrors: Record<string, string>;
  isFormDetected: boolean;
  isDirty: boolean; // Track if form has unsaved changes

  // Actions - Field Management
  setFields: (fields: FormField[]) => void;
  updateFieldValue: (name: string, value: any) => void;
  resetFieldValues: () => void;
  clearFields: () => void;

  // Actions - Edit Mode
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;

  // Actions - Field Selection
  selectField: (id: string | null) => void;

  // Actions - Field CRUD
  addField: (field: FormField) => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;

  // Actions - Validation
  setValidationError: (fieldName: string, error: string) => void;
  clearValidationError: (fieldName: string) => void;
  clearAllValidationErrors: () => void;

  // Actions - State
  setFormDetected: (detected: boolean) => void;
  setDirty: (dirty: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  fields: [],
  fieldValues: {},
  editMode: false,
  selectedField: null,
  validationErrors: {},
  isFormDetected: false,
  isDirty: false,
};

export const useFormsStore = create<FormsStore>((set, get) => ({
  ...initialState,

  // Field Management
  setFields: (fields) => {
    const fieldValues: Record<string, any> = {};
    fields.forEach((field) => {
      fieldValues[field.name] = field.value;
    });

    set({
      fields,
      fieldValues,
      isFormDetected: fields.length > 0,
      isDirty: false,
    });
  },

  updateFieldValue: (name, value) => {
    const { fields, fieldValues } = get();

    // Update field value in fields array
    const updatedFields = fields.map((field) =>
      field.name === name ? { ...field, value } : field
    );

    // Update field values object
    const updatedFieldValues = {
      ...fieldValues,
      [name]: value,
    };

    set({
      fields: updatedFields,
      fieldValues: updatedFieldValues,
      isDirty: true,
    });
  },

  resetFieldValues: () => {
    const { fields } = get();
    const fieldValues: Record<string, any> = {};

    // Reset to default values
    fields.forEach((field) => {
      fieldValues[field.name] = field.defaultValue;
    });

    const resetFields = fields.map((field) => ({
      ...field,
      value: field.defaultValue,
    }));

    set({
      fields: resetFields,
      fieldValues,
      isDirty: false,
    });
  },

  clearFields: () => {
    set({
      fields: [],
      fieldValues: {},
      isFormDetected: false,
      isDirty: false,
    });
  },

  // Edit Mode
  toggleEditMode: () => {
    set((state) => ({ editMode: !state.editMode, selectedField: null }));
  },

  setEditMode: (enabled) => {
    set({ editMode: enabled, selectedField: null });
  },

  // Field Selection
  selectField: (id) => {
    set({ selectedField: id });
  },

  // Field CRUD
  addField: (field) => {
    const { fields } = get();
    set({
      fields: [...fields, field],
      fieldValues: { ...get().fieldValues, [field.name]: field.value },
      isDirty: true,
    });
  },

  removeField: (id) => {
    const { fields, fieldValues } = get();
    const fieldToRemove = fields.find((f) => f.id === id);

    if (fieldToRemove) {
      const updatedFieldValues = { ...fieldValues };
      delete updatedFieldValues[fieldToRemove.name];

      set({
        fields: fields.filter((f) => f.id !== id),
        fieldValues: updatedFieldValues,
        selectedField: null,
        isDirty: true,
      });
    }
  },

  updateField: (id, updates) => {
    const { fields } = get();
    const updatedFields = fields.map((field) =>
      field.id === id ? { ...field, ...updates } : field
    );

    set({
      fields: updatedFields,
      isDirty: true,
    });
  },

  // Validation
  setValidationError: (fieldName, error) => {
    set((state) => ({
      validationErrors: {
        ...state.validationErrors,
        [fieldName]: error,
      },
    }));
  },

  clearValidationError: (fieldName) => {
    const { validationErrors } = get();
    const updated = { ...validationErrors };
    delete updated[fieldName];
    set({ validationErrors: updated });
  },

  clearAllValidationErrors: () => {
    set({ validationErrors: {} });
  },

  // State Management
  setFormDetected: (detected) => {
    set({ isFormDetected: detected });
  },

  setDirty: (dirty) => {
    set({ isDirty: dirty });
  },

  resetStore: () => {
    set(initialState);
  },
}));
