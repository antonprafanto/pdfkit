# 📋 Release Notes — PDF Kit v1.0.19

**Release Date:** 2026-04-27  
**Branch:** `master`  
**Contributors:** @antonprafanto, @julianromli

---

## ✨ New Features

### 🎬 Presentation / Slideshow Mode (by @julianromli)
Fitur mode presentasi yang komprehensif kini hadir di PDF Kit! Nikmati pengalaman presentasi PDF yang lebih profesional dengan:

- **Slideshow Mode (F5)** — Tampilkan PDF dalam mode layar penuh yang bersih dan bebas gangguan.
- **External Display Sync** — Mendukung sinkronisasi tampilan ke layar eksternal/proyektor secara otomatis melalui window presenter terpisah.
- **Floating Controls** — Kontrol navigasi melayang yang muncul saat hover untuk berpindah halaman dengan mulus.
- **Reading Mode / View Modes** — Opsi tampilan baru seperti mode membaca yang lebih nyaman.
- **Keyboard Navigation** — Gunakan tombol panah, Page Up/Down, atau F5 untuk navigasi antar halaman saat presentasi.
- **Settings Integration** — Pilihan layar presentasi kini tersedia di panel Settings → General.

### 🗂️ Drag & Drop PDF Merge (by @julianromli)
Fitur penggabungan PDF kini jauh lebih intuitif:

- **Drag & Drop Upload** — Seret file PDF langsung dari Explorer ke dalam dialog Merge PDF.
- **Drag to Reorder** — Urutkan ulang file yang akan digabungkan dengan cara menyeretnya ke posisi yang diinginkan.
- **Stable Item IDs** — Input page range pada setiap file tidak akan hilang saat melakukan reorder.
- **Smart Drop Routing** — Menjatuhkan file baru di atas baris yang sudah ada tetap menambahkan file baru, bukan menggantikan.
- **Validation** — Pesan error yang jelas jika file yang dijatuhkan bukan PDF.

---

## 🛠️ Improvements & Bug Fixes

- **Fix: Infinite Render Loop** — Memperbaiki bug kritis di mana masuk ke mode single-page memicu loop render tanpa henti yang menyebabkan aplikasi freeze dan force-close. `handleFitToPage` dan `handleFitToWidth` sekarang dibungkus dengan `useCallback` untuk stabilitas penuh.
- **Fix: DOM Variable Shadowing** — Semua akses DOM di `PDFViewer.tsx` kini menggunakan `window.document` untuk menghindari konflik dengan objek PDF dari `pdfjs-dist`.
- **Fix: Keyboard Shortcuts** — Shortcut F5 dan F11 untuk Presentation Mode kini terdokumentasi di dialog Keyboard Shortcuts Help.
- **Fix: dev:electron Script** — Script development Electron sekarang melakukan `build:electron` terlebih dahulu sebelum launch untuk memastikan kode main process terbaru selalu digunakan.
- **Cleanup** — Menghapus file sampah (`nul`, `commit.txt`, `git_log_*.txt`) dari workspace.

---

## 🧪 Testing

- **90 unit tests** dari **12 file test** — semua **PASS** ✅
- Termasuk 5 test baru untuk `MergeDialog` (drag & drop, reorder, validasi)
- Termasuk test baru untuk `PDFViewer` dan `ViewerFloatingControls`
- Termasuk test baru untuk `pdf-store` dan `settings-store`

---

## 📦 What's Changed

| File | Perubahan |
|---|---|
| `src/renderer/components/editing/MergeDialog.tsx` | Drag & drop upload + reorder |
| `src/renderer/components/PDFViewer.tsx` | Presentasi mode + fix infinite loop |
| `src/renderer/components/RibbonToolbar.tsx` | Integrasi tombol slideshow |
| `src/renderer/components/ViewerFloatingControls.tsx` | Komponen baru — floating nav controls |
| `src/renderer/PresenterApp.tsx` | Komponen baru — window presenter eksternal |
| `src/renderer/store/pdf-store.ts` | State baru untuk view mode |
| `src/renderer/lib/view-mode.ts` | Utilitas baru untuk view mode |
| `src/shared/types/presenter.ts` | Type baru untuk presenter |
| `src/main/main.ts` | IPC handler untuk presenter window |
| `src/renderer/i18n/locales/en.json` | Terjemahan baru |
| `src/renderer/i18n/locales/id.json` | Terjemahan baru |

---

## ⬇️ Download

> Link installer akan tersedia setelah proses packaging selesai.

---

*Built with ❤️ by PDF Kit Team*
