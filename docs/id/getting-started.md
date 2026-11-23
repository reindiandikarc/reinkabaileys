# Mulai cepat

## Kebutuhan

- Node.js **20 atau lebih baru**
- npm, yarn, atau pnpm
- Akun WhatsApp yang akan dipasangkan sebagai perangkat pendamping

Untuk fungsi inti, kamu tidak butuh Python, ffmpeg, ataupun browser.

## Pasang paket

Letakkan referensi GitHub di `package.json` bot:

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Jalankan `npm install`. Nama paketnya tetap `reindiandikarc-baileys`, walaupun repositorinya bernama `reinkabaileys`.

## Koneksi pertama dengan ESM

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) console.log(qr)

    if (connection === 'close') {
      const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
      if (!loggedOut) connect()
    }
  })

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      console.log(msg.key.remoteJid, msg.message)
    }
  })

  return sock
}

connect()
```

Dua baris yang paling penting: `saveCreds` pada `creds.update` supaya sesi tersimpan, dan pengecekan `loggedOut` supaya reconnect berhenti saat kredensial sudah tidak berlaku. Setelah logout sungguhan, hapus folder auth lalu pasangkan ulang.

## CommonJS

Paket ini menyediakan entry ESM dan CJS. Dengan `require()`, factory socket ada di properti `default`:

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

Artefak CJS sudah ikut ter-commit di paket, jadi konsumen tidak perlu menjalankan build dulu.

## Opsi koneksi

`makeWASocket(config)` memakai nilai bawaan dari `lib/Defaults/index.js`. Opsi yang paling sering dipakai:

- `auth` — auth state; wajib untuk login.
- `browser` — identitas perangkat pendamping, misalnya `Browsers.ubuntu('Chrome')`.
- `markOnlineOnConnect` — isi dengan `false` supaya tidak otomatis terlihat online.
- `syncFullHistory` — bawaan `true`; ubah ke `false` untuk melewati sinkronisasi awal yang besar.
- `logger` — logger yang kompatibel dengan pino.
- `shouldIgnoreJid` — menyaring JID masuk, misalnya `jid => jid.endsWith('@broadcast')`.
- `cachedGroupMetadata` — mengambil metadata grup dari cache sendiri.
- `getMessage` — mengambil pesan untuk retry dan quote.
- `generateHighQualityLinkPreview` — mengaktifkan preview tautan kualitas tinggi.
- `autoFollow` — pengaturan auto-follow channel; lihat [Newsletter](./newsletter.html).
- `brand.pairingNotice` — isi `false` untuk mematikan notifikasi QR dan pairing.

```js
const sock = makeWASocket({
  auth: state,
  browser: Browsers.ubuntu('Chrome'),
  markOnlineOnConnect: false,
  syncFullHistory: false,
  autoFollow: false,
  shouldIgnoreJid: jid => jid.endsWith('@broadcast')
})
```

Versi protokol bawaan adalah `[2, 3000, 1035194821]` dan endpoint WebSocket-nya `wss://web.whatsapp.com/ws/chat`. Keduanya berasal dari default rc13 dan biasanya tidak perlu diubah.

## Event yang langsung dipakai

- `connection.update` — `{ connection, qr, lastDisconnect, isNewLogin }`; nilai `connection` adalah `connecting`, `open`, atau `close`.
- `creds.update` — simpan kredensial di sini.
- `messages.upsert` — `{ messages, type }`, dengan `notify` untuk pesan langsung.

Daftar event lengkap ada di [Pesan](./messages.html).

## Branding dan variabel lingkungan

- `REIN_NO_BANNER=1` (alias `REINDIANDIKARC_NO_BANNER=1`) — tanpa banner saat start.
- `NO_COLOR=1` atau `FORCE_COLOR=0` — teks polos tanpa ANSI.
- `FORCE_COLOR=1` — paksa warna di log non-TTY seperti Pterodactyl.
- `REIN_NO_AUTO_FOLLOW=1` — matikan auto-follow channel.

Kalau ingin mencetak identitas sendiri, tersedia `BRAND`, `getBrandLines`, `gradientText`, dan `printBrand`.

## Catatan Pterodactyl

Pakai egg Node.js 20 dan biarkan perintah start aplikasi tetap `node index.js`. Konsol panel bukan TTY, jadi keluaran defaultnya polos; tambahkan `FORCE_COLOR=1` pada environment variable egg kalau ingin banner berwarna.
