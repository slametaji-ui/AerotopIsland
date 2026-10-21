# Dynamic Island for Windows 10 / 11 🏝️✨

Aplikasi desktop mengambang bergaya **Apple Dynamic Island** untuk Windows 10 & Windows 11. Menghadirkan kapsul cerdas di bagian atas layar desktop dengan animasi pegas (*spring morphing*) yang sangat halus, transparan murni, dan interaktif.

---

## ✨ Fitur Utama

- 🏝️ **Floating Capsule Overlay**: Melayang elegan di bagian tengah atas layar, *borderless*, dan selalu di atas aplikasi lain (*Always-on-Top*).
- 🖱️ **Intelligent Click-Through**: Area transparan di luar kapsul dapat ditembus klik mouse sehingga tidak menghalangi jendela aplikasi Windows di belakangnya.
- 🎵 **Live Music Player & Audio Visualizer**:
  - Pemutar audio bawaan dengan generator synthesizer lo-fi chill.
  - Dynamic wave equalizer animasi.
  - Kontrol lagu (Play/Pause, Next/Prev, Scrubber durasi, Slider volume).
  - Indikator bar gelombang mini di kapsul saat compact.
- ⏱️ **Timer & Stopwatch Interaktif**:
  - Countdown ring SVG dinamis dengan preset (1m, 5m, 15m, 25m Pomodoro).
  - Chime alert audio saat timer selesai.
  - Badge mini `⏱ 04:32` di kapsul saat diminimalkan.
- 📊 **Real-time System & Battery Telemetry**:
  - Persentase baterai laptop & deteksi pengisian daya (Charging ⚡).
  - Monitor penggunaan CPU & RAM real-time.
  - Status uptime Windows.
- 📝 **Quick Tools & Scratchpad**:
  - Catatan kilat tersimpan otomatis (*auto-save*).
  - Shortcut praktis untuk kalkulator dan task manager.
- 🎨 **5 Pilihan Tema Warna**:
  - Obsidian Pure (Apple Classic White)
  - Cyber Cyan
  - Sunset Orange
  - Emerald Green
  - Royal Purple
- ⚡ **Shortcut Global & System Tray**:
  - Tekan **`Ctrl + Shift + D`** untuk toggle ekspansi / kolaps dari mana saja.
  - Klik ikon di System Tray Windows untuk menu cepat dan keluar.

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Terminal
Buka PowerShell atau Command Prompt di direktori project:
```bash
npm start
```

### Cara 2: Klik Dua Kali File Batch
Cukup klik ganda pada file:
```
start.bat
```

---

## ⚙️ Kontrol & Gestur
- **Klik Pill Compact**: Membuka tampilan penuh (Expanded).
- **Arahkan Mouse (Hover)**: Jika fitur "Auto-Expand on Hover" diaktifkan di tab Settings, kapsul akan otomatis terbuka saat kursor diarahkan ke pill.
- **Tombol Panah / Klik Luar**: Menutup kembali menjadi kapsul kecil.
- **Shortcut Keyboard**: `Ctrl + Shift + D` untuk membuka/menutup secara instan.
