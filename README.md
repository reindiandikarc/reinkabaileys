# reindiandikarcbaileys
<h1 align="center">Baileys</h1>

<p align="center">
Library JavaScript (ESM/CJS, murni JS tanpa TypeScript) untuk berinteraksi dengan WhatsApp Web API lewat <b>WebSocket</b> — tanpa Selenium, tanpa Chromium/headless browser.
</p>

> Versi: `@whiskeysockets/baileys` **7.0.0-rc13**
> Lisensi: MIT

---

## 📌 Apa itu Baileys?

Baileys adalah library yang memungkinkan Node.js untuk login dan mengontrol akun WhatsApp (Multi-Device) secara langsung, tanpa harus menjalankan browser otomatis seperti Selenium/Puppeteer. Karena hanya memakai WebSocket murni, penggunaan RAM jauh lebih hemat (bisa hemat ratusan MB dibanding solusi berbasis browser).

Dengan Baileys kamu bisa membuat:
- Bot WhatsApp (auto-reply, customer service, dsb.)
- Integrasi WhatsApp ke sistem/aplikasi lain
- Tools otomasi pesan, grup, maupun channel/komunitas WhatsApp

> ⚠️ **Disclaimer**: Proyek ini tidak berafiliasi resmi dengan WhatsApp/Meta. Gunakan secara bertanggung jawab — jangan untuk spam, stalkerware, atau pengiriman pesan massal yang melanggar Terms of Service WhatsApp.

---

## ✨ Fitur Utama

- **Koneksi langsung via WebSocket** ke WhatsApp Web Multi-Device (tanpa browser).
- **Dua metode login**: scan QR Code atau Pairing Code (kode angka, tanpa scan).
- **Penyimpanan sesi (auth state)** — login sekali, sesi bisa disimpan ke file/folder (`useMultiFileAuthState`) atau database kustom.
- **Pengiriman pesan lengkap**:
  - Teks, quote/reply, mention, forward
  - Lokasi, kontak (vCard), reaksi (emoji), pin pesan, polling/voting
  - Media: gambar, video, GIF, audio/voice note, dokumen, pesan sekali lihat (*view once*)
  - Link preview otomatis
- **Manajemen pesan**: hapus pesan (untuk semua), edit pesan, download media masuk, re-upload media.
- **Manajemen chat**: arsip, mute/unmute, tandai dibaca/belum dibaca, hapus chat/pesan, update status "online/typing/recording".
- **Manajemen grup**: buat/hapus grup, tambah/kick member, ubah admin, ubah info grup, dsb.
- **Komunitas (Communities)** dan **Newsletter/Channel** WhatsApp.
- **Fitur bisnis (Business API)** dasar untuk akun WhatsApp Business.
- **Sistem event** (`sock.ev`) untuk mendengarkan update real-time: pesan masuk, update status koneksi, perubahan grup, kontak, chat, dll.
- **Enkripsi Signal Protocol** bawaan — pesan tetap terenkripsi end-to-end sesuai standar WhatsApp.

---

## 🧰 Persyaratan

- **Node.js** (disarankan versi LTS terbaru, minimal Node 18+) — karena library ini berbasis ESM (`"type": "module"`).
- Package manager: `npm`, `yarn`, atau `pnpm`.

---

## 📦 Instalasi

### 1. Opsi A — Install dari npm (versi stabil, direkomendasikan)

```bash
npm install @whiskeysockets/baileys
# atau
yarn add @whiskeysockets/baileys
```

### 2. Opsi B — Pakai folder project ini langsung (lokal)

Jika kamu sudah mengekstrak folder `baileys-master` ini dan ingin memakainya sebagai dependency lokal (bukan dari npm registry):

```bash
cd baileys-master
npm install
```

Lalu dari project lain, referensikan folder ini di `package.json`:

```json
"dependencies": {
  "@whiskeysockets/baileys": "file:../baileys-master"
}
```

### 3. Opsi C — Clone dari Git Repository

Metode ini cocok kalau kamu ingin kode sumber lengkap (termasuk untuk dikembangkan sendiri), dan bisa dipakai di Termux (Android), Windows, Linux, maupun macOS.

#### 🐧 Linux

```bash
# Update paket & install Node.js + Git (contoh untuk Debian/Ubuntu)
sudo apt update && sudo apt install -y nodejs npm git

# Clone repository
git clone https://github.com/WhiskeySockets/Baileys.git
cd Baileys

# Install dependency
npm install
```

#### 🍎 macOS

```bash
# Pastikan Homebrew sudah terpasang, lalu install Node.js & Git
brew install node git

# Clone repository
git clone https://github.com/WhiskeySockets/Baileys.git
cd Baileys

# Install dependency
npm install
```

#### 🪟 Windows

1. Install [Node.js LTS](https://nodejs.org/) dan [Git for Windows](https://git-scm.com/download/win) terlebih dahulu.
2. Buka **Command Prompt**, **PowerShell**, atau **Git Bash**, lalu jalankan:

```powershell
git clone https://github.com/WhiskeySockets/Baileys.git
cd Baileys
npm install
```

> 💡 Jika `npm install` gagal karena modul native (contoh: `libsignal`), install dulu **Visual Studio Build Tools** (workload "Desktop development with C++") atau jalankan `npm install --global windows-build-tools` (Node versi lama) sebelum ulangi `npm install`.

#### 📱 Termux (Android)

```bash
# Update paket Termux
pkg update && pkg upgrade -y

# Install Node.js dan Git
pkg install -y nodejs git

# (Opsional tapi disarankan) install build tools untuk modul native
pkg install -y python make clang

# Clone repository
git clone https://github.com/WhiskeySockets/Baileys.git
cd Baileys

# Install dependency
npm install
```

> 💡 Jika muncul error terkait memori saat `npm install` di HP dengan RAM kecil, coba jalankan `npm install --no-optional` atau tutup aplikasi lain terlebih dahulu.
> 💡 Agar sesi tetap jalan di background Termux, aktifkan **Wake Lock** (`termux-wake-lock`) dan jangan swipe-close aplikasi Termux dari recent apps.

#### Menjalankan project setelah clone

Setelah `npm install` selesai di platform manapun, buat file `index.js` (contoh ada di bagian [Contoh Penggunaan Dasar](#-contoh-penggunaan-dasar)), lalu jalankan:

```bash
node index.js
```

### 4. Import ke kode kamu

Karena library ini ESM, gunakan `import` (bukan `require`) di file `.js` project kamu, dan pastikan `package.json` project kamu memiliki `"type": "module"` — atau gunakan ekstensi `.mjs`:

```js
import makeWASocket from '@whiskeysockets/baileys'
```

Jika project kamu CommonJS, tetap bisa dipakai lewat entry `require`:

```js
const { default: makeWASocket } = require('@whiskeysockets/baileys')
```

---

## 🚀 Contoh Penggunaan Dasar

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function startBot() {
  // Simpan sesi login ke folder 'auth_info' agar tidak perlu scan ulang
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true // tampilkan QR code di terminal
  })

  // Simpan sesi setiap kali ada update kredensial
  sock.ev.on('creds.update', saveCreds)

  // Pantau status koneksi
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom &&
          lastDisconnect.error.output?.statusCode) !== DisconnectReason.loggedOut
      console.log('Koneksi terputus. Reconnect:', shouldReconnect)
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('Berhasil terhubung ke WhatsApp!')
    }
  })

  // Dengarkan pesan masuk
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.key.fromMe && msg.message) {
      const sender = msg.key.remoteJid
      await sock.sendMessage(sender, { text: 'Halo! Pesan kamu sudah diterima 👋' })
    }
  })
}

startBot()
```

### Login dengan Pairing Code (tanpa scan QR)

```js
if (!sock.authState?.creds?.registered) {
  const code = await sock.requestPairingCode('628xxxxxxxxxx') // nomor WA tujuan
  console.log('Kode pairing kamu:', code)
}
```

---

## 📡 Sistem Event Penting

Semua update berjalan lewat `sock.ev.on(nama_event, callback)`. Beberapa yang paling sering dipakai:

| Event | Kegunaan |
|---|---|
| `connection.update` | Status koneksi (connecting, open, close) & QR code |
| `creds.update` | Kredensial berubah → wajib disimpan |
| `messages.upsert` | Pesan baru masuk/terkirim |
| `messages.update` | Status pesan berubah (terkirim, dibaca, dihapus) |
| `chats.upsert` / `chats.update` | Perubahan data chat |
| `contacts.upsert` / `contacts.update` | Perubahan data kontak |
| `groups.update` / `group-participants.update` | Perubahan info/anggota grup |
| `presence.update` | Status online/typing lawan bicara |

---

## ⚠️ Catatan Penting

- **Jangan** scan QR/login akun yang sama di banyak tempat sekaligus — berisiko logout paksa.
- Gunakan **cache metadata grup** jika bot kamu aktif di banyak grup, agar performa lebih baik (lihat dokumentasi lanjutan).
- Untuk penggunaan produksi, simpan auth state di database (SQL/NoSQL), bukan hanya file lokal.
- Baileys dikembangkan komunitas (fork dari proyek asli) — untuk dokumentasi lengkap & terbaru, kunjungi: https://baileys.wiki
- Diskusi & bantuan komunitas: Discord resmi WhiskeySockets.

---

## 📄 Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan selama mencantumkan notice lisensi asli (lihat file `LICENSE`).
