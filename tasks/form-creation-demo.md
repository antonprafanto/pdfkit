# 🎬 Demo: Membuat Form Fields untuk "Laporan Tutorial UT"

## 📋 Preparation

**PDF Target:** Laporan Pelaksanaan Tutorial Online - Universitas Terbuka

**Fields yang perlu dibuat:**
1. Nama Tutor Bekerja (text)
2. Nama Mata Kuliah (text)
3. Kode Mata Kuliah dan Kelas (text)
4. Fakultas (dropdown)
5. Golongan ASN (text, optional)
6. NPWP (text, optional)
7. No. Rekening (text)
8. Jumlah Peserta (number)
9. Peserta yang aktif (number)
10. Tugas 1, 2, 3 (numbers)

---

## 🚀 Demo Walkthrough

### Scene 1: Open PDF & Activate Forms Mode

```
[User opens PDF]
PDF: "Laporan Pelaksanaan Tutorial Online Universitas Terbuka"

[User clicks Forms Mode button (green document icon)]
✅ Forms sidebar appears on the left
```

**Sidebar shows:**
```
┌─────────────────────────────┐
│ Form Detection              │
│ [Detect Form Fields]        │
│                             │
│ 💡 No interactive fields    │
│ detected                    │
│                             │
│ This PDF may be a static    │
│ form.                       │
│                             │
│ To add fields manually:     │
│ 1. Click "Detect Form       │
│    Fields" first            │
│ 2. Then use "Create New     │
│    Fields"                  │
└─────────────────────────────┘
```

---

### Scene 2: Detect Forms (Will Find None)

```
[User clicks "Detect Form Fields"]

[Loading...]
Button shows: "Detecting..."

[After 1 second]
Dialog appears:
┌──────────────────────────────────────────────┐
│ pdf-kit                                   ✕  │
├──────────────────────────────────────────────┤
│ No interactive form fields detected in       │
│ this PDF.                                    │
│                                              │
│ This PDF may be a static form (image-based). │
│                                              │
│ You can:                                     │
│ 1. Click "Create New Fields" to manually    │
│    add form fields                           │
│ 2. Use a PDF with interactive AcroForm      │
│    fields                                    │
│                                              │
│              [OK]                            │
└──────────────────────────────────────────────┘

[User clicks OK]
```

**Console log:**
```
[Forms] Scanning 1 pages for form fields...
[Forms] Page 1: Found 0 annotation(s)
[Forms] Total fields detected: 0
```

**Sidebar updates:**
```
┌─────────────────────────────┐
│ Form Detection              │
│ [Detect Form Fields]        │
│ ✓ Found 0 fields            │ ← Status updated
│                             │
│ Form Data                   │
│ [Import Data]               │
│ [Export Data]               │
│                             │
│ Save Form                   │
│ [Save Filled PDF] (disabled)│
│                             │
│ Edit Mode                   │
│ [Create New Fields]         │ ← Now available
└─────────────────────────────┘
```

---

### Scene 3: Enter Edit Mode

```
[User clicks "Create New Fields"]

[Screen changes]
✅ PDF overlay turns light blue with opacity
✅ Cursor changes to crosshair (+)
✅ Banner appears at top center:
   "Click anywhere to add a form field"

[Sidebar button changes]
Button now shows: "Exit Edit Mode" (orange)
Text below: "Click on PDF to add fields"
```

---

### Scene 4: Create First Field - "Nama Tutor Bekerja"

```
[User clicks on the form at position after "Nama Tutor Bekerja:"]

[Dialog appears]
┌──────────────────────────────────────────────┐
│ Create Form Field                         ✕  │
├──────────────────────────────────────────────┤
│ Field Type *                                 │
│ [Text Input ▼]                               │
│                                              │
│ Field Name *                                 │
│ [nama_tutor_bekerja              ]          │
│                                              │
│ Default Value                                │
│ [                                ]          │
│                                              │
│ ☑ Required field                            │
│ ☐ Multiline (textarea)                      │
│                                              │
│ Position: Page 1, X: 500, Y: 265            │
│                                              │
│     [Cancel]         [Create Field]          │
└──────────────────────────────────────────────┘

[User fills:]
- Field Type: Text Input (default)
- Field Name: "nama_tutor_bekerja"
- Required: ✓ checked
- Multiline: unchecked

[User clicks "Create Field"]

[Dialog closes]
[Field placeholder appears at clicked position]
```

**Visual on PDF:**
```
Nama Tutor Bekerja    : [___________________]  ← New text input appears!
                         (blue border, white bg)
```

---

### Scene 5: Create Dropdown - "Fakultas"

```
[User clicks on position after "Fakultas:"]

[Dialog appears]
┌──────────────────────────────────────────────┐
│ Create Form Field                         ✕  │
├──────────────────────────────────────────────┤
│ Field Type *                                 │
│ [Dropdown ▼]                                 │ ← User selects Dropdown
│                                              │
│ Field Name *                                 │
│ [fakultas                        ]          │
│                                              │
│ Default Value                                │
│ [                                ]          │
│                                              │
│ Options (one per line)                       │
│ ┌────────────────────────────────┐          │
│ │Fakultas Ekonomi                │          │
│ │Fakultas Hukum                  │          │
│ │Fakultas Kedokteran             │          │
│ │Fakultas Teknik                 │          │
│ └────────────────────────────────┘          │
│                                              │
│ ☑ Required field                            │
│                                              │
│ Position: Page 1, X: 500, Y: 438            │
│                                              │
│     [Cancel]         [Create Field]          │
└──────────────────────────────────────────────┘

[User clicks "Create Field"]
```

**Visual on PDF:**
```
Fakultas              : [-- Select -- ▼]  ← New dropdown appears!
```

---

### Scene 6: Create Number Field - "Jumlah Peserta"

```
[User clicks on position after "Jumlah Peserta:"]

[Dialog - same process]
Field Type: Text Input
Field Name: "jumlah_peserta"
Required: ✓
Multiline: unchecked

[Creates successfully]
```

**Visual on PDF:**
```
Jumlah Peserta        : [____]  ← New text input (for number)
```

---

### Scene 7: Exit Edit Mode & Test Fields

```
[User clicks "Exit Edit Mode"]

[Screen returns to normal]
✅ Blue overlay removed
✅ Cursor back to normal
✅ Fields now interactive!

[User clicks on "nama_tutor_bekerja" field]
[Can type: "Dr. Ahmad Suryadi"]

[User clicks on "fakultas" dropdown]
[Dropdown opens showing options]
[User selects "Fakultas Ekonomi"]

[User clicks on "jumlah_peserta"]
[Can type: "20"]
```

**Sidebar now shows:**
```
┌─────────────────────────────┐
│ Form Detection              │
│ [Detect Form Fields]        │
│ ✓ Found 3 fields            │ ← Updated!
│                             │
│ Form Data                   │
│ [Import Data]               │
│ [Export Data]               │
│                             │
│ Save Form                   │
│ [Save Filled PDF]           │
│ ⚠ Unsaved changes           │ ← Shows dirty state
│                             │
│ Edit Mode                   │
│ [Create New Fields]         │
└─────────────────────────────┘
```

---

### Scene 8: Export Form Data

```
[User clicks "Export Data"]

[Dialog appears]
┌──────────────────────────────────────────────┐
│ Export Form Data                          ✕  │
├──────────────────────────────────────────────┤
│ Export form data to JSON format. You can     │
│ save this file and import it later.          │
│                                              │
│ [Generate & Download JSON]                   │
│                                              │
│ Generated JSON:                              │
│ ┌────────────────────────────────┐          │
│ │{                               │          │
│ │  "version": "1.0",             │          │
│ │  "fields": {                   │          │
│ │    "nama_tutor_bekerja":       │          │
│ │      "Dr. Ahmad Suryadi",      │          │
│ │    "fakultas":                 │          │
│ │      "Fakultas Ekonomi",       │          │
│ │    "jumlah_peserta": "20"      │          │
│ │  },                            │          │
│ │  "metadata": {                 │          │
│ │    "createdAt": "2025-12-28..." │          │
│ │  }                             │          │
│ │}                               │          │
│ └────────────────────────────────┘          │
│                                              │
│ File downloaded automatically.               │
│                                              │
│                        [Close]               │
└──────────────────────────────────────────────┘

[File downloads: "Laporan_Tutorial_1735401234.json"]
```

---

## ✅ End Result

**What User Achieved:**
1. ✅ Created 3 form fields manually
2. ✅ Filled the fields with data
3. ✅ Exported data to JSON
4. ✅ Can reuse this setup for next time

**Benefits:**
- 📝 Static PDF now has interactive fields
- 💾 Form data can be saved/loaded
- 🔄 Reusable for similar documents
- ✅ Professional form filling experience

---

## 🎯 Next Steps

User can:
1. **Continue adding fields** - Add remaining fields (NPWP, No. Rekening, etc)
2. **Save filled PDF** - Generate PDF with filled values
3. **Create template** - Reuse field positions for similar PDFs
4. **Import data** - Load previously saved JSON data

---

## 📊 Statistics

**Time to create 3 fields:** ~2 minutes
**Reusable:** Yes (via export/import)
**Quality:** Professional interactive form
**Effort:** Low (point & click)

---

**Demo complete!** 🎉

For full tutorial, see: [how-to-create-form-fields.md](./how-to-create-form-fields.md)
