# REIN BAILEYS

REIN BAILEYS adalah API WhatsApp Web Multi-Device berbasis JavaScript murni untuk Node.js. Koneksinya langsung sebagai perangkat pendamping lewat `wss://web.whatsapp.com/ws/chat`, dengan handshake Noise dan protokol Signal. Tidak perlu Selenium, tidak perlu Chromium, dan tidak ada command handler di dalam pustaka.

- Nama paket: `reindiandikarc-baileys`
- Repositori: `reindiandikarc/reinkabaileys`
- Versi: `7.0.0-rc13.1` (protokol rc13)
- Runtime: Node.js **20 ke atas**, tersedia dalam ESM dan CJS

Saat paket diimpor, banner gradasi REIN BAILEYS muncul sekali per proses. Pakai `REIN_NO_BANNER=1` untuk menyembunyikannya, atau `NO_COLOR=1` kalau ingin teks polos.

## Yang sudah digabung

Satu paket ini merangkum hasil kerja empat fork:

- **WhiskeySockets/Baileys rc13** — pondasi protokol: WebSocket, Noise, Signal, WAProto, app state, dan sinkronisasi riwayat.
- **Ryuusuke/levvleys** — `makeInMemoryStore`, `captureEventStream`, `readAndEmitEventStream`, `queueJob`, `getBotJid`, dan `extractNewsletterMetadata`.
- **Elaina Baileys** — `MessageBuilder` / `MB`, helper native flow dan A2UI, `makeVoipClient`, auth state database, serta definisi WAProto dengan 25 tipe pesan tambahan.
- **Bell/baileys-master** — tata letak `lib/` dan arsitektur socket berlapis.

Tidak perlu memasang paket tambahan: builder, klien VoIP, dan store sudah ikut di dalamnya.

## Arsitektur singkat

`makeWASocket()` membungkus socket komunitas, bisnis, terima/kirim pesan, newsletter, grup, dan chat di atas satu socket WebSocket. Hampir semua data masuk lewat `sock.ev`, sedangkan panggilan seperti `sock.sendMessage()` keluar lewat socket yang sama.

## Mulai dari mana

- [Mulai cepat](./getting-started.html) — pasang paket, ESM/CJS, reconnect, konfigurasi
- [Pesan](./messages.html) — event, JID, teks, media, reaksi, polling
- [Grup](./groups.html) — grup dan komunitas
- [Newsletter](./newsletter.html) — channel dan auto-follow
- [Kode pairing](./pairing.html) — pasangkan perangkat tanpa memindai QR
- [Sesi](./sessions.html) — auth state berkas dan database
- [MessageBuilder](./builder.html) — tombol, carousel, AIRich, A2UI
- [Contoh](./examples.html) — bot lengkap
- [Referensi API](./api-reference.html) — nama ekspor yang dibangkitkan dari sumber

## Pemasangan

Tambahkan referensi GitHub ke `package.json` bot kamu:

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Lalu jalankan `npm install`. Saat import, pakai nama paketnya, bukan nama repositorinya.

## Contoh paling singkat

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', ({ connection, qr }) => {
  if (qr) console.log(qr)
})

sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return
  const msg = messages[0]
  if (!msg?.message || msg.key.fromMe) return
  await sock.sendMessage(msg.key.remoteJid, { text: 'Halo dari REIN BAILEYS' })
})
```

Halaman [Mulai cepat](./getting-started.html) menambahkan logika reconnect yang dibutuhkan bot yang berjalan terus.

## Bukan apa

REIN BAILEYS adalah lapisan transport dan API, bukan framework bot. Tidak ada router perintah, penjadwal, atau sistem plugin. Semua keputusan itu ada di kode aplikasi kamu sendiri.

## Lisensi dan atribusi

Paket ini berlisensi MIT dan tidak berafiliasi dengan WhatsApp maupun Meta. Atribusi untuk WhiskeySockets, Ryuusuke, Termai, Elaina Dev, dan reindiandikarc tercantum di README repositori.
