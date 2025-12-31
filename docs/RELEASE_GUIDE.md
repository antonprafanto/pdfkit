# 📦 Panduan Rilis Versi Baru PDF Kit

Dokumen ini berisi langkah-langkah untuk merilis versi baru PDF Kit. Ikuti panduan ini setiap kali ada update.

---

## 🚀 Quick Release (Copy-Paste Commands)

```bash
# 1. Update versi di package.json (contoh: dari 1.0.0 ke 1.0.1)

# 2. Commit semua perubahan
git add .
git commit -m "release: v1.0.1 - [deskripsi singkat update]"

# 3. Buat tag versi
git tag v1.0.1

# 4. Push ke GitHub (tag + branch)
git push origin main --tags
```

Setelah push, GitHub Actions akan **otomatis**:
- ✅ Build untuk Windows (.exe)
- ✅ Build untuk macOS (.dmg)
- ✅ Build untuk Linux (.AppImage, .deb, .rpm)
- ✅ Buat Draft Release dengan semua files

---

## 📝 Langkah Detail

### Step 1: Update Versi di `package.json`

Buka `package.json` dan update field `version`:

```json
{
  "name": "pdf-kit",
  "version": "1.0.1",  // <- ubah ini
  ...
}
```

**Aturan Versi (Semantic Versioning):**
- `1.0.X` - Bug fixes, perbaikan kecil
- `1.X.0` - Fitur baru (backward compatible)
- `X.0.0` - Perubahan besar (breaking changes)

### Step 2: Update Release Notes (Opsional tapi Direkomendasikan)

Edit file `RELEASE_NOTES.md` untuk menambahkan changelog:

```markdown
## v1.0.1 (2025-01-01)

### 🆕 Fitur Baru
- Deskripsi fitur baru

### 🐛 Bug Fixes
- Deskripsi bug yang diperbaiki

### 🔧 Improvements
- Deskripsi peningkatan
```

### Step 3: Commit & Tag

```bash
# Stage semua perubahan
git add .

# Commit dengan format: release: vX.X.X - deskripsi
git commit -m "release: v1.0.1 - perbaikan bug dan peningkatan performa"

# Buat tag (HARUS sama dengan versi di package.json)
git tag v1.0.1
```

### Step 4: Push ke GitHub

```bash
# Push commit dan tag sekaligus
git push origin main --tags
```

### Step 5: Cek GitHub Actions

1. Buka https://github.com/antonprafanto/pdfkit/actions
2. Pastikan workflow "Build and Release" berjalan
3. Tunggu sampai selesai (± 15-30 menit)

### Step 6: Publish Release

1. Buka https://github.com/antonprafanto/pdfkit/releases
2. Akan ada **Draft Release** dengan tag terbaru
3. Review release notes
4. Klik **"Publish release"**

Setelah dipublish, user yang sudah install PDF Kit akan **otomatis** mendapat notifikasi update!

---

## ⚠️ Troubleshooting

### Build Gagal di GitHub Actions
1. Cek tab Actions untuk error message
2. Biasanya karena:
   - Dependency yang bermasalah
   - Test yang gagal
   - Resource limit

### User Tidak Mendapat Notifikasi Update
- Pastikan release sudah di-**Publish** (bukan Draft)
- Versi di `package.json` harus lebih tinggi dari versi yang terinstall
- Auto-updater hanya aktif di production build (bukan dev mode)

### Build Lokal untuk Testing

```bash
# Build untuk Windows saja (untuk test lokal)
npm run package:win

# Hasil di folder: release/
```

---

## 📋 Checklist Sebelum Release

- [ ] Semua fitur baru sudah di-test
- [ ] Tidak ada console error di browser
- [ ] `npm run dev` jalan tanpa error
- [ ] Versi di `package.json` sudah di-update
- [ ] `RELEASE_NOTES.md` sudah di-update
- [ ] Commit message menggunakan format: `release: vX.X.X`
- [ ] Tag name sama dengan versi: `vX.X.X`

---

## 🔗 Link Penting

- **GitHub Repo**: https://github.com/antonprafanto/pdfkit
- **Actions (CI/CD)**: https://github.com/antonprafanto/pdfkit/actions
- **Releases**: https://github.com/antonprafanto/pdfkit/releases

---

*Terakhir diupdate: 31 Desember 2025*
