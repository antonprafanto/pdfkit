# Presenter Mode for External Display

## Ringkasan
- Tambahkan fitur `Presenter Mode` terpisah dari `Slide Show`.
- Button `Presenter Mode` hanya muncul saat Electron mendeteksi minimal satu external display.
- Saat aktif, projector menampilkan window kedua yang fullscreen, single-page, fit-to-screen, tanpa toolbar; laptop tetap memakai window utama dengan flow penuh seperti sekarang.
- Toolbar laptop saat presenter aktif menambah stopwatch `Start/Pause + Reset`.
- Jika external display dicabut saat sesi berjalan, window presenter langsung ditutup dan laptop tetap normal.

## Perubahan Implementasi
### 1. Arsitektur dual-window
- Implement presenter sebagai `BrowserWindow` kedua di main process, bukan fullscreen renderer tunggal.
- Gunakan Electron `screen` module untuk:
  - membaca daftar display
  - membedakan internal vs external display
  - mendeteksi `display-added`, `display-removed`, dan `display-metrics-changed`
- Presenter window dibuka pada display yang dipilih user dari monitor picker, lalu fullscreen di display tersebut.
- Presenter window memakai renderer app yang sama dalam mode khusus `presenter`, bukan flow app penuh.

### 2. Data flow laptop -> projector
- Saat presenter dimulai, laptop mengirim payload dokumen aktif ke presenter window:
  - `pdfBytes`
  - `fileName`
  - halaman aktif saat start
- Presenter window memuat PDF dari bytes, lalu selalu render:
  - single-page
  - fit-to-screen
  - fullscreen
  - tanpa toolbar/panel/editing chrome
- Sinkronisasi runtime dari laptop ke projector hanya untuk:
  - perubahan halaman
- Zoom, layout, dan state toolbar di laptop tidak memengaruhi projector setelah presenter aktif.
- Presenter session diikat ke tab/dokumen aktif saat start; jika source document ditutup atau user pindah ke tab lain, presenter mode dihentikan untuk menghindari sinkronisasi ambigu.

### 3. UX di laptop
- `Presenter Mode` button hanya visible jika ada external display.
- Klik button membuka monitor picker dulu, bukan langsung start.
- Setelah monitor dipilih:
  - button berubah ke state aktif / stop presenter
  - toolbar laptop menampilkan stopwatch dengan:
    - waktu berjalan
    - `Start/Pause`
    - `Reset`
- Stopwatch hanya tampil saat presenter mode aktif, dan hanya di laptop.
- `Slide Show` tetap single-window fullscreen biasa; tidak otomatis naik kelas menjadi presenter mode.

### 4. UX di projector
- Projector menampilkan presentasi bersih:
  - fullscreen
  - single page
  - fit-to-screen
  - tanpa toolbar, timer, atau chrome lain
- Navigasi halaman dari laptop yang harus tersinkron:
  - next/previous
  - go to page
  - thumbnail click
  - keyboard/page navigation lain yang mengubah halaman aktif source tab

### 5. Main/renderer interface changes
- Tambahkan bridge preload untuk:
  - query daftar external display yang tersedia
  - start presenter mode dengan `displayId`
  - stop presenter mode
  - event perubahan availability display
  - event status presenter mode
- Tambahkan mode renderer khusus presenter agar window kedua tidak boot ke app shell penuh.
- Tambahkan state presenter mode di laptop renderer:
  - active/inactive
  - selected display
  - stopwatch state
  - source tab binding

## Test Plan
- Verifikasi button `Presenter Mode` hidden saat tidak ada external display.
- Verifikasi button muncul saat external display terdeteksi.
- Verifikasi monitor picker menampilkan daftar external display dan start hanya setelah satu dipilih.
- Verifikasi presenter window terbuka di display yang dipilih dan fullscreen.
- Verifikasi projector selalu single-page fit-to-screen meski laptop layout berbeda.
- Verifikasi navigasi halaman dari laptop tersinkron ke projector.
- Verifikasi zoom/layout laptop tidak ikut mengubah projector.
- Verifikasi stopwatch laptop bisa start, pause, dan reset tanpa memengaruhi projector.
- Verifikasi mencabut external display menutup presenter window dan membersihkan state presenter.
- Verifikasi menutup atau berpindah dari source tab menghentikan presenter mode.
- Verifikasi `Slide Show` lama tetap bekerja dan tidak berubah jadi dual-screen mode.

## Asumsi
- Presenter mode hanya mendukung satu projector window aktif pada satu waktu.
- Monitor picker tidak perlu mengingat pilihan terakhir di v1.
- Stopwatch hanya muncul di laptop saat presenter mode aktif.
- Projector menampilkan halaman saja; tidak ada timer, preview, atau overlay presenter lain di v1.
- Jika source tab berubah/ditutup, presenter mode berhenti, bukan otomatis pindah ke dokumen lain.
