# REIN BAILEYS

```
╭──────────────────────────────────────────────────────────╮
│  ✦  R E I N   B A I L E Y S                              │
├══════════════════════════════════════════════════════════┤
│  ◈  Fork rc13 · ESM + CJS · Multi-Device                 │
│  ◈  v7.0.0-rc13.1 · Pure JavaScript WhatsApp API         │
╰──────────────────────────────────────────────────────────╯
```

[![version](https://img.shields.io/badge/version-7.0.0--rc13.1-ff4d8d)](https://github.com/reindiandikarc/reinkabaileys) [![node](https://img.shields.io/badge/node-%3E%3D20-22d3ee)](https://nodejs.org/) [![license](https://img.shields.io/badge/license-MIT-a855f7)](LICENSE)

Library WhatsApp Web API murni JavaScript (ESM + CJS), hasil gabungan tiga fork Baileys dalam satu paket. Berjalan lewat WebSocket langsung — tanpa Selenium, tanpa Chromium, tanpa bot bawaan.

Saat paket diimpor, banner **REIN BAILEYS** berwarna gradient (`#ff4d8d → #a855f7 → #22d3ee`) dengan penghias `✦ ◈ ◆` otomatis muncul di terminal maupun console Pterodactyl.

> Repo GitHub: `reindiandikarc/reinkabaileys` · Nama paket: `reindiandikarc-baileys` · Versi protokol: `7.0.0-rc13.1`

---

## Daftar isi

- [Fitur](#fitur)
- [Hasil gabungan fork](#hasil-gabungan-fork)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Contoh penggunaan](#contoh-penggunaan)
- [Pairing code](#pairing-code)
- [Branding](#branding)
- [Catatan Pterodactyl](#catatan-pterodactyl)
- [Struktur paket](#struktur-paket)
- [Tes](#tes)
- [Atribusi dan disclaimer](#atribusi-dan-disclaimer)

---

## Fitur

### Koneksi dan login

- Koneksi langsung via **WebSocket** ke WhatsApp Web Multi-Device, tanpa browser otomatis.
- Dua metode login: **QR code** atau **pairing code** (tanpa scan).
- Sesi tersimpan lewat `useMultiFileAuthState` atau auth state kustom (database).
- Reconnect melalui event `connection.update`; `DisconnectReason` tersedia untuk membedakan logout, timeout, atau connection lost.
- Enkripsi **Signal Protocol** bawaan sesuai standar WhatsApp.

### Pesan dan media

- Teks, reply/quote, mention, forward, dan pesan dengan konteks.
- Media: gambar, video, GIF, audio/voice note, dokumen, dan *view once*.
- Lokasi, kontak vCard, reaksi emoji, pin pesan, dan polling/voting.
- Link preview otomatis.
- Download media masuk dan re-upload media.
- Hapus pesan untuk semua, edit pesan, dan manajemen pesan lain.

### Chat, grup, komunitas, dan channel

- Arsip, mute/unmute, tandai dibaca/belum dibaca, hapus chat, dan status online/typing/recording.
- Grup: buat/hapus, tambah/kick member, ubah admin, ubah info grup.
- Komunitas (Communities) dan Newsletter/Channel WhatsApp.
- API Business dasar untuk WhatsApp Business.

### Event dan API lain

- `sock.ev` untuk pesan masuk, update koneksi, perubahan grup, kontak, chat, dan lainnya.
- `executeUSyncQuery`, `onWhatsApp`, `fetchAccountReachoutTimelock`, `fetchNewChatMessageCap`.
- `waitForConnectionUpdate`, `waitForMessage`, dan helper socket lain dari rc13.

---

## Hasil gabungan fork

| Kemampuan | Export |
|---|---|
| In-memory store lengkap | `makeInMemoryStore`, `waChatKey`, `waMessageID`, `waLabelAssociationKey`, `makeOrderedDictionary`, `ObjectRepository` |
| Rekam/putar event stream | `captureEventStream`, `readAndEmitEventStream` |
| Antrean async per bucket | `queueJob` |
| Helper JID bot dan metadata channel | `getBotJid`, `extractNewsletterMetadata` |
| JID auto-follow siap pakai | `AUTO_FOLLOW_NEWSLETTER_JID` = `120363406952188879@newsletter` |
| Branding dan notifikasi | `BRAND`, `getBrandLines`, `gradientText`, `printBrand`, `printPairingNotice`, `attachPairingNoticeListener`, `wrapPairingCodeNotice` |

Rincian file yang di-port dan yang sengaja tidak di-port ada di [`PORT_MANIFEST.md`](PORT_MANIFEST.md).

> Auto-follow/auto-reaksi tidak dijalankan otomatis oleh library — itu tanggung jawab aplikasi konsumen. Hanya konstanta JID-nya yang disediakan.

---

## Persyaratan

- **Node.js 20 atau lebih baru**
- npm, yarn, atau pnpm

---

## Instalasi

Dari GitHub:

```bash
npm i github:reindiandikarc/reinkabaileys
```

Dari folder lokal hasil ekstrak zip:

```bash
npm i ./reindiandikarc-baileys
```

Nama paketnya tetap `reindiandikarc-baileys`, jadi import memakai nama itu:

```js
import makeWASocket from 'reindiandikarc-baileys'
```

---

## Contoh penggunaan

### ESM

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      // Render QR sendiri di aplikasi kamu.
      // REIN BAILEYS otomatis mencetak "QR READY" ke console.
      console.log(qr)
    }

    if (connection === 'close') {
      const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
      if (!loggedOut) connect()
    }
  })
}

connect()
```

### CommonJS

```js
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('reindiandikarc-baileys')

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      connect()
    }
  })
}

connect()
```

---

## Pairing code

```js
const code = await sock.requestPairingCode('6281234567890')
```

Nilai kembalian persis sama seperti rc13. REIN BAILEYS otomatis mencetak `PAIRING CODE <kode>` ke console. Notifikasi QR hanya dicetak sekali per nilai QR agar tidak membanjiri log.

---

## Branding

| Kontrol | Cara |
|---|---|
| Matikan banner | `REIN_NO_BANNER=1` (alias: `REINDIANDIKARC_NO_BANNER=1`) |
| Paksa gradient di log non-TTY | `FORCE_COLOR=1` |
| Teks polos tanpa ANSI | `NO_COLOR=1` atau `FORCE_COLOR=0`; otomatis saat stdout bukan TTY |
| Matikan notifikasi QR/pairing | `makeWASocket({ auth, brand: { pairingNotice: false } })` |

Banner dicetak sekali per proses, baik lewat `import` ESM maupun `require()` CJS.

---

## Catatan Pterodactyl

Gunakan Node.js 20. Startup tetap `node index.js` milik aplikasi konsumen — banner REIN BAILEYS muncul otomatis di console panel. Karena console panel bukan TTY, teks tampil polos secara default agar log tidak penuh escape code; tambahkan `FORCE_COLOR=1` pada environment variable egg bila ingin gradient berwarna. Tidak perlu egg khusus.

---

## Struktur paket

```
reindiandikarc-baileys/
├── lib/
│   ├── index.js                 entry ESM
│   ├── index.cjs                dispatcher CJS
│   ├── index.bundle.cjs         bundle rc13 utuh
│   ├── cjs/                     hasil build brand + ported (ter-commit)
│   ├── Brand/                   banner, gradient, hook pairing
│   ├── Defaults/                konstanta dan versi protokol
│   ├── Store/                   in-memory store hasil port
│   ├── Utils/                   helper rc13 + helper port
│   └── Signal/Group/queue-job.js
├── test/                        suite node:test
├── docs/superpowers/            spec dan plan implementasi
├── PORT_MANIFEST.md
└── THIRD_PARTY_NOTICES.md
```

---

## Tes

```bash
npm install
npm run build:cjs
npm test
```

---

## Atribusi dan disclaimer

Basis kode: WhiskeySockets/Baileys rc13 (MIT, 2025). File port: Ryuusuke/levvleys (MIT, 2026). Detail di [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) dan folder [`licenses/`](licenses/).

Proyek ini **tidak berafiliasi resmi** dengan WhatsApp atau Meta. Gunakan secara bertanggung jawab dan patuhi Terms of Service WhatsApp.
