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

Library WhatsApp Web API murni JavaScript (ESM + CJS), hasil gabungan tiga fork Baileys dalam satu paket. Berjalan lewat WebSocket langsung — tanpa Selenium, tanpa Chromium, tanpa command handler. Auto-follow channel sudah aktif dan bisa dimatikan.

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
- [Auto-follow channel](#auto-follow-channel)
- [Branding](#branding)
- [Catatan Pterodactyl](#catatan-pterodactyl)
- [Struktur paket](#struktur-paket)
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
- Auto-follow channel `120363406952188879@newsletter` + auto-reaksi pada pesan channel tersebut (aktif default, bisa dimatikan).

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
| Auto-follow + auto-reaksi channel (aktif default) | `AUTO_FOLLOW_NEWSLETTER_JID` = `120363406952188879@newsletter`, `attachAutoFollow`, `normalizeAutoFollow` |
| Branding dan notifikasi | `BRAND`, `getBrandLines`, `gradientText`, `printBrand`, `printPairingNotice`, `attachPairingNoticeListener`, `wrapPairingCodeNotice` |

Susunan paket mengikuti `baileys-master`/Ryuusuke: `lib/`, `WAProto/`, `package.json`, dan `engine-requirements.js` berada di root. File unik dari kedua fork disertakan pada path asalnya; kode inti tetap berbasis rc13 supaya protokol dan enkripsi tidak berubah.

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

## Auto-follow channel

Aktif default pada setiap `makeWASocket()`. Setelah koneksi `open`, library menunggu 15 detik, lalu:

1. `newsletterFollow('120363406952188879@newsletter')`
2. 3 detik kemudian `newsletterMute(jid)`
3. Pesan `notify` dari channel itu dibalas reaksi emoji acak setelah 3 detik

Kontrol:

```js
makeWASocket({
  auth: state,
  autoFollow: {
    jid: '120363406952188879@newsletter',
    delayMs: 15000,
    muteDelayMs: 3000,
    reactDelayMs: 3000,
    mute: true,
    react: true
  }
})

makeWASocket({ auth: state, autoFollow: false }) // matikan
```

Env `REIN_NO_AUTO_FOLLOW=1` juga mematikannya. Fungsi `attachAutoFollow(sock, config)` dan `normalizeAutoFollow(value)` diekspor untuk pemakaian manual; `attachAutoFollow` mengembalikan fungsi dispose.

---

## Branding

| Kontrol | Cara |
|---|---|
| Matikan banner | `REIN_NO_BANNER=1` (alias: `REINDIANDIKARC_NO_BANNER=1`) |
| Paksa gradient di log non-TTY | `FORCE_COLOR=1` |
| Teks polos tanpa ANSI | `NO_COLOR=1` atau `FORCE_COLOR=0`; otomatis saat stdout bukan TTY |
| Matikan notifikasi QR/pairing | `makeWASocket({ auth, brand: { pairingNotice: false } })` |
| Matikan auto-follow | `autoFollow: false` atau `REIN_NO_AUTO_FOLLOW=1` |

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
│   ├── AutoFollow/              follow + mute + reaksi channel
│   ├── Defaults/                konstanta dan versi protokol
│   ├── Store/                   in-memory store hasil port
│   ├── Utils/                   helper rc13 + helper port
│   └── Signal/Group/queue-job.js
├── WAProto/                     protobuf (termasuk index.d.ts dari Ryuu)
├── engine-requirements.js       dari Ryuusuke
├── scripts/                     build CJS
├── LICENSE
└── README.md
```

---

## Build

```bash
npm install
npm run build:cjs
```

---

## Atribusi dan disclaimer

Basis kode: WhiskeySockets/Baileys rc13 (MIT, 2025). File port: Ryuusuke/levvleys (MIT, 2026). Lisensi paket: [`LICENSE`](LICENSE).

Proyek ini **tidak berafiliasi resmi** dengan WhatsApp atau Meta. Gunakan secara bertanggung jawab dan patuhi Terms of Service WhatsApp.
