# Merge PDF Drag-and-Drop

## Todo

- [x] Add drag-and-drop upload support to the merge dialog using the existing merge flow.
- [x] Add drag-and-drop reordering for uploaded merge files with stable item ids.
- [x] Update merge dialog copy in English and Indonesian for drop hints and invalid-drop feedback.
- [x] Add focused tests for file drop and reorder behavior in the merge dialog.
- [x] Run targeted verification and fix any issues found.

## Review

- Merge dialog now accepts dropped PDF files through the same append flow as the file picker, so upload behavior stays consistent.
- Uploaded merge items now use stable ids and support drag-and-drop reordering without losing their page-range input state.
- Added English and Indonesian copy for drop hints, reorder hints, and invalid file-drop feedback.
- Added focused component tests covering PDF drop, invalid drop, drag reorder, and existing arrow-button reorder.
- Verification: `npx vitest run src/renderer/components/editing/MergeDialog.test.tsx` passed.
- Verification note: `npm run type-check` still fails because of pre-existing repo-wide TypeScript issues outside this feature, but filtering the output showed no remaining `MergeDialog` errors from these changes.
