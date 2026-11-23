# reindiandikarc-baileys

![version](https://img.shields.io/badge/version-7.0.0--rc13.1-ff4d8d) ![node](https://img.shields.io/badge/node-%3E%3D20-22d3ee) ![license](https://img.shields.io/badge/license-MIT-a855f7)

**REIN BAILEYS** — library WhatsApp Web API murni JavaScript (ESM + CJS), hasil gabungan tiga fork Baileys dalam satu paket. Tanpa Selenium, tanpa Chromium, tanpa bot bawaan.

Saat paket diimpor, console menampilkan banner **REIN BAILEYS** berwarna gradient dengan penghias `✦ ◈ ◆`, otomatis di terminal maupun Pterodactyl.

> Versi protokol: `7.0.0-rc13.1` · Node.js `>=20.0.0` · MIT

---

## Instalasi

```bash
npm i github:<owner>/reindiandikarc-baileys
```

Atau dari folder lokal:

```bash
npm i ./reindiandikarc-baileys
```

CommonJS dan ESM keduanya didukung:

```js
// ESM
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

// CJS
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('reindiandikarc-baileys')
```

---

## Contoh penggunaan (ESM)

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      // Render QR sendiri di aplikasi kamu (mis. lewat library QR pilihanmu).
      // REIN BAILEYS otomatis mencetak pengumuman "QR READY" ke console.
      console.log(qr)
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) connect()
    }
  })
}

connect()
```

## Contoh penggunaan (CJS)

```js
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('reindiandikarc-baileys')

;(async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      process.exit(0)
    }
  })
})()
```

### Pairing code

```js
const code = await sock.requestPairingCode('6281234567890')
// Nilai kembalian sama persis seperti rc13.
// REIN BAILEYS otomatis mencetak "PAIRING CODE <kode>" ke console.
```

---

## Branding

| Kontrol | Cara |
|---|---|
| Matikan banner | `REIN_NO_BANNER=1` (alias lama: `REINDIANDIKARC_NO_BANNER=1`) |
| Teks polos tanpa ANSI | `NO_COLOR=1` atau `FORCE_COLOR=0` |
| Matikan notifikasi QR/pairing | `makeWASocket({ auth, brand: { pairingNotice: false } })` |
| Warna gradient | `#ff4d8d → #a855f7 → #22d3ee` |

Banner dicetak sekali per proses. Notifikasi QR hanya dicetak sekali per nilai QR agar tidak membanjiri console.

### Catatan Pterodactyl

Gunakan Node.js 20 (egg Node.js Generic / 20). Startup tetap `node index.js` milik aplikasi konsumen — banner REIN BAILEYS muncul otomatis di console panel. Tidak perlu egg khusus atau file tambahan.

---

## Fitur hasil gabungan

- Basis rc13 (ESM + CJS) dengan perbaikan path `lib/Defaults/`.
- Store lengkap: `makeInMemoryStore`, `waChatKey`, `waMessageID`, `waLabelAssociationKey`, `makeOrderedDictionary`, `ObjectRepository`.
- Utilitas event stream: `captureEventStream`, `readAndEmitEventStream`.
- Antrean async: `queueJob`.
- Helper selektif: `getBotJid`, `extractNewsletterMetadata`, `AUTO_FOLLOW_NEWSLETTER_JID` (`120363406952188879@newsletter`).
- Brand: `BRAND`, `getBrandLines`, `gradientText`, `printBrand`, `printPairingNotice`, `attachPairingNoticeListener`, `wrapPairingCodeNotice`.

Detail file yang di-port dan yang sengaja tidak di-port ada di [`PORT_MANIFEST.md`](PORT_MANIFEST.md). Atribusi pihak ketiga ada di [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

> Perilaku auto-follow/auto-reaksi tidak dimasukkan ke library — itu tanggung jawab aplikasi konsumen. Konstanta `AUTO_FOLLOW_NEWSLETTER_JID` disediakan sebagai nilai siap pakai.

---

## Tes

```bash
npm install
npm run build:cjs
npm test
```

---

## Disclaimer

Proyek ini **tidak berafiliasi resmi** dengan WhatsApp atau Meta. Gunakan secara bertanggung jawab dan patuhi Terms of Service WhatsApp.
