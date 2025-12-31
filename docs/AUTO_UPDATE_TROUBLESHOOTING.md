# Troubleshooting Auto-Update

## Kemungkinan Penyebab Notifikasi Tidak Muncul:

### 1. **App Belum Cek Update**
Auto-updater cek update:
- Saat startup (setelah 5 detik delay)
- Setiap 4 jam

**Solusi**: Restart app dan tunggu 5-10 detik

### 2. **Cache Issue**
Electron mungkin cache versi lama dari `latest.yml`

**Solusi**: 
- Tutup app sepenuhnya
- Hapus cache: `%APPDATA%\PDF Kit\`
- Buka lagi

### 3. **Versi Tidak Berubah**
Cek di About dialog - apakah sudah menunjukkan 1.0.1?

### 4. **Auto-Updater Disabled di Development**
Auto-updater hanya aktif di production build (bukan `npm run dev`)

---

## Quick Test:

1. **Tutup PDF Kit sepenuhnya** (Task Manager → End Task)
2. **Buka lagi dari Start Menu**
3. **Tunggu 10 detik**
4. **Cek banner di atas app** - harusnya muncul notifikasi

Kalau masih tidak muncul, coba:
- Buka DevTools (Ctrl+Shift+I)
- Lihat Console untuk error messages
- Cari log "Checking for update..."
