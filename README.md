# Aerotop Island for Windows 10 / 11 🏝️✨

> **Futuristic Floating Notch, Ambient Clock & Desktop Assistant for Windows 10 & 11**

**Aerotop Island** menghadirkan notch interaktif mengambang (*Dynamic Floating Notch*) di bagian atas layar desktop Windows dengan animasi *spring physics morphing* yang mulus, estetika kaca gelap (*obsidian glassmorphism*), serta dukungan **Click-Through** transparan cerdas.

---

## 📸 Tampilan & Status Morfing

Aerotop Island dapat bertransformasi secara dinamis ke berbagai mode tampilan:
1. **Camera Dot State** (Default minimal): Kamera dot kecil di puncak layar.
2. **Notification Neon Banner**: Notifikasi pesan (WhatsApp Web, Email, Sistem) dengan animasi efek neon aura pulsing.
3. **USB & Storage Notch**: Banner biru otomatis saat Flashdisk / Harddisk USB dicolokkan, lengkap dengan tombol 1-klik *Safely Eject*.
4. **Ambient Standby Clock**: Jam desktop estetik minimalis otomatis aktif saat PC tidak digerakkan (idle 60 detik).
5. **Expanded Dashboard**: Panel kontrol lengkap multifungsi.

---

## ✨ Fitur-Fitur Unggulan

### 1. 🎵 Live Windows Media GSMTC & Master Volume
- Terintegrasi langsung dengan pemutar media Windows (Spotify, YouTube di Browser, Apple Music, Media Player).
- Menampilkan judul lagu, artis, thumbnail asli, dan soundwave visualizer animasi.
- Slider timeline sinkron real-time (dapat di-scrub/geser untuk lompat menit).
- Pengatur volume master Windows bawaan & tombol mute kilat.

### 2. 📋 Smart Clipboard Manager
- Mencatat riwayat copy teks dan gambar secara instan di latar belakang.
- Fitur **Pin 📌**: Mengunci catatan / snippet penting agar tidak terhapus.
- Filter pencarian item: *All*, *Pinned*, *Text*, dan *Images*.
- 1-klik untuk menyalin ulang teks/gambar kembali ke clipboard Windows.

### 3. ⏱️ Focus Timer & Stopwatch
- Lingkaran countdown progres SVG interaktif.
- Preset waktu instan: `1m`, `5m`, `15m`, dan `25m 🍅` (Pomodoro Session).
- Dilengkapi audio alert chime saat sesi selesai.

### 4. 📊 Hardware Telemetry & 💾 USB Storage Ejector
- **Battery**: Menampilkan persentase baterai laptop & status pengisian daya (AC Charging ⚡).
- **CPU & RAM**: Monitor beban prosesor dan memori RAM real-time.
- **Connected Storage & Drives**: Menampilkan seluruh drive lokal (C:, D:, E:, dll.) serta removable USB drive.
- **1-Click Safely Eject**: Cabut flashdisk dengan aman langsung dari aplikasi tanpa perlu membuka taskbar bawah.

### 5. 🧮 Mini Floating Calculator & Unit Converter
- Kalkulator aritmatika praktis langsung di dalam notch (mendukung klik tombol atau ketik keyboard + Enter).
- **Quick Converter**:
  - 💵 USD ke IDR
  - 💾 GB ke MB
  - 🌡️ °C ke °F
  - 🛣️ KM ke Miles
- Tombol 1-klik salin hasil ke clipboard.

### 6. 🎨 Ambient Standby Mode (Idle Clock)
- Ketika mouse tidak digerakkan selama 60 detik, notch otomatis bermutasi menjadi jam standby digital elegan yang menampilkan waktu, detik, tanggal, dan status baterai.
- Gerakkan mouse sedikit, notch akan kembali ke ukuran minimalisnya secara otomatis.

### 7. 🚀 Windows Auto-Run (Startup Boot)
- Opsi **"Run on Startup (Auto-run)"** di menu System Tray (klik kanan).
- Aplikasi akan otomatis berjalan setiap kali komputer Windows dinyalakan.

### 8. 🎨 5 Tema Warna Obsidian
- **Obsidian Pure** (Minimalist White & Slate)
- **Cyber Cyan** (Futuristic Neon Cyan)
- **Sunset Orange** (Warm Tangerine Glow)
- **Emerald Green** (Vibrant Matrix Green)
- **Royal Purple** (Cyberpunk Neon Violet)

---

## 📦 Cara Install File Installer Windows (`.exe`)

File installer resmi telah berhasil dibuat di dalam folder `dist/`:

### Langkah Instalasi:
1. Buka folder `dist/` di dalam direktori aplikasi:
   ```
   dist/Aerotop Island Setup 1.0.0.exe
   ```
2. **Klik dua kali** file `Aerotop Island Setup 1.0.0.exe`.
3. Ikuti wizard instalasi:
   - Tentukan folder instalasi (opsional).
   - Shortcut akan otomatis dibuat di **Desktop** dan **Start Menu**.
4. Klik **Finish**. Aplikasi akan langsung berjalan.
5. **Aktifkan Auto-Run**: Klik kanan ikon Aerotop Island di System Tray (taskbar pojok kanan bawah), lalu centang **"Run on Startup (Auto-run)"**.

---

## 🛠️ Menjalankan Dari Source Code (Development)

Jika ingin menjalankan atau mengembangkan langsung via Node.js:

### 1. Menjalankan Mode Dev
```powershell
npm start
```
*(atau klik ganda file `start.bat`)*

### 2. Membangun Ulang Installer `.exe`
```powershell
npm run build
```
File installer setup `.exe` baru akan otomatis dihasilkan di folder `dist/`.

---

## ⌨️ Shortcut Keyboard & Kontrol Cepat

| Aksi | Kontrol |
|---|---|
| **Buka / Tutup Notch** | Tekan `Ctrl + Shift + D` dari mana saja |
| **Hover Auto-Expand** | Arahkan kursor ke notch (dapat diaktifkan/matikan di tab Settings) |
| **Pin / Kunci Terbuka** | Klik ikon Pin di pojok kanan atas expanded notch |
| **Reset Posisi** | Klik kanan ikon di System Tray -> *Reset Position (Top Center)* |
| **Menu System Tray** | Klik kanan icon di sudut kanan bawah taskbar Windows |

---

## 📄 Lisensi
Didistribusikan di bawah lisensi **MIT License**.
