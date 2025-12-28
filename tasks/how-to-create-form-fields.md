# 📝 Cara Membuat Form Fields Manual di PDF Kit

## 🎯 Kapan Perlu Create Manual?

Ketika PDF Anda adalah **static form** (form visual tanpa interactive fields), seperti:
- PDF dari Word/PowerPoint yang di-export
- Form yang di-scan
- PDF dengan garis dan kotak tapi tidak bisa diklik

---

## 🚀 Step-by-Step: Membuat Form Fields

### Step 1: Buka Forms Mode
1. Buka PDF Anda
2. Klik button **Forms Mode** di toolbar (icon document hijau)
3. Sidebar Forms akan muncul di sebelah kiri

### Step 2: Aktifkan Edit Mode
1. Di Forms sidebar, klik button **"Create New Fields"**
2. Layar PDF akan berubah menjadi biru transparan dengan crosshair cursor
3. Text "Click anywhere to add a form field" muncul

### Step 3: Tambahkan Field
1. **Klik** pada posisi di PDF dimana field seharusnya berada
   - Contoh: Klik di kotak setelah text "Nama:"
2. Dialog **"Create Form Field"** akan muncul
3. Isi konfigurasi field:

   **Field Type:** (pilih salah satu)
   - Text Input (untuk nama, alamat, dll)
   - Checkbox (untuk pilihan yes/no)
   - Radio Button (untuk pilihan multiple choice)
   - Dropdown (untuk select dari list)

   **Field Name:** (wajib)
   - Contoh: `nama`, `npm`, `fakultas`
   - Gunakan huruf kecil, no spasi

   **Default Value:** (optional)
   - Value awal field

   **Required field:** (checkbox)
   - ✓ jika field wajib diisi

   **Multiline:** (hanya untuk Text)
   - ✓ jika perlu textarea (untuk alamat panjang, dll)

4. Klik **"Create Field"**

### Step 4: Ulangi untuk Semua Fields
Ulangi Step 3 untuk setiap field yang perlu ditambahkan.

### Step 5: Exit Edit Mode
1. Klik lagi button **"Create New Fields"** untuk exit edit mode
2. Field yang sudah dibuat akan muncul sebagai input box interaktif

### Step 6: Test Fields
1. Coba isi fields yang sudah dibuat
2. Validasi akan berjalan otomatis (required fields, dll)

### Step 7: Save (Optional)
1. Klik **"Save Filled PDF"** untuk save dengan field values
2. Atau **"Export Data"** untuk export values ke JSON

---

## 💡 Tips & Best Practices

### Field Naming
✅ **Good:**
- `nama_lengkap`
- `npm`
- `fakultas`
- `tanggal_lahir`

❌ **Avoid:**
- `Nama Lengkap` (ada spasi)
- `NAMA` (all caps)
- `field1` (tidak descriptive)

### Field Positioning
1. **Zoom in** untuk precision positioning
2. Field akan muncul di posisi yang diklik
3. Default size: 200px × 30px (bisa disesuaikan nanti)

### Field Types Guide

**Text Input** - Untuk:
- Nama, alamat, email
- NPM, NIM, nomor
- Text pendek

**Textarea (Multiline)** - Untuk:
- Alamat lengkap
- Komentar, catatan
- Text panjang

**Checkbox** - Untuk:
- Persetujuan (ya/tidak)
- Multiple options yang bisa dipilih lebih dari 1
- Toggle states

**Radio Button** - Untuk:
- Pilihan mutually exclusive (hanya 1 yang bisa dipilih)
- Contoh: Gender (Laki-laki / Perempuan)
- Gunakan **same group name** untuk opsi yang saling eksklusif

**Dropdown** - Untuk:
- List pilihan yang panjang
- Contoh: Provinsi, Fakultas, Jurusan
- Masukkan options satu per baris di dialog

---

## 🎯 Contoh: Form Tutorial Universitas

Untuk PDF "Laporan Tutorial" yang Anda buka, berikut field-field yang perlu dibuat:

### 1. Nama Tutor Bekerja
```
Field Name: nama_tutor_bekerja
Field Type: Text Input
Required: Yes
Position: Klik di kotak setelah "Nama Tutor Bekerja"
```

### 2. Nama Mata Kuliah
```
Field Name: nama_matakuliah
Field Type: Text Input
Required: Yes
Position: Klik di kotak setelah "Nama Mata Kuliah"
```

### 3. Kode Mata Kuliah dan Kelas
```
Field Name: kode_matakuliah_kelas
Field Type: Text Input
Required: Yes
Position: Klik di kotak setelah "Kode Mata Kuliah dan Kelas"
```

### 4. Fakultas
```
Field Name: fakultas
Field Type: Dropdown
Required: Yes
Options:
  Fakultas Teknik
  Fakultas Ekonomi
  Fakultas Kedokteran
  Fakultas Hukum
  (dst...)
Position: Klik di kotak setelah "Fakultas"
```

### 5. Golongan (Bagi Tutor yang Berstatus ASN)
```
Field Name: golongan_asn
Field Type: Text Input
Required: No
Position: Klik di kotak setelah "Golongan"
```

### 6. NPWP
```
Field Name: npwp
Field Type: Text Input
Required: No
Position: Klik di kotak setelah "NPWP"
```

### 7. No. Rekening
```
Field Name: no_rekening
Field Type: Text Input
Required: Yes
Position: Klik di kotak setelah "No. Rekening (disarankan BRI/Mandiri)"
```

### 8-11. Jumlah Peserta, Aktif, Tugas 1-3 (Fields numerik)
```
Field Name: jumlah_peserta
Field Type: Text Input
Validation: Number
Position: Klik di kotak setelah "Jumlah Peserta"
```

(Ulangi untuk: `peserta_aktif`, `tugas1`, `tugas2`, `tugas3`)

---

## 🔧 Troubleshooting

### Field tidak muncul setelah create?
- ✅ Pastikan Anda sudah **exit edit mode**
- ✅ Field hanya muncul di page yang sama dengan posisi click
- ✅ Coba scroll atau zoom untuk lihat field

### Field posisi salah?
- ❌ **Belum ada move functionality** (coming soon)
- ✅ Solusi: Hapus field dan create ulang
- ✅ Zoom in untuk positioning lebih presisi

### Field terlalu kecil/besar?
- ❌ **Belum ada resize functionality** (coming soon)
- ✅ Default size: 200×30px untuk text, 30×30px untuk checkbox/radio

### Tidak bisa save PDF with fields?
- ⚠️ Feature "Save Filled PDF" memerlukan original PDF bytes
- ✅ Gunakan "Export Data" untuk save values ke JSON
- ✅ Import JSON nanti untuk populate fields

---

## 🎉 After Creating Fields

Setelah semua fields dibuat:

1. **Fill the form** - Isi fields seperti form interaktif biasa
2. **Validate** - Required fields akan ditandai, error akan muncul
3. **Export data** - Save values ke JSON untuk reuse
4. **Print/Save** - Print PDF dengan values terisi

---

## 🚀 Next Steps (Future Features)

Features yang akan ditambahkan:
- 🔄 Move/resize fields
- 🎨 Field styling (colors, fonts)
- 🤖 **AI Auto-detect fields** (Phase 7)
- 📦 Field templates
- 🔗 Field calculations

---

**Happy form creating!** 📝✨

Jika ada pertanyaan atau butuh bantuan, silakan tanya! 😊
