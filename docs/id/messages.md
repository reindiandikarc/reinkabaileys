# Pesan

## Menerima pesan

Semua yang masuk lewat `sock.ev`. Event `messages.upsert` membawa sekumpulan pesan:

```js
sock.ev.on('messages.upsert', ({ messages, type }) => {
  if (type !== 'notify') return
  for (const msg of messages) {
    if (msg.key.fromMe) continue
    const teks = msg.message?.conversation || msg.message?.extendedTextMessage?.text
    if (!teks) continue
    console.log(msg.key.remoteJid, teks)
  }
})
```

Nilai `type` adalah `notify` untuk pesan baru dan `append` untuk pesan dari riwayat atau sinkronisasi. Karena `emitOwnEvents` bernilai `true` secara bawaan, pesan yang kamu kirim juga bisa muncul di event ini; saring dengan `msg.key.fromMe` kalau yang diinginkan hanya pesan pengguna.

## Event terkait aktivitas chat

- `messages.update` — perubahan status, seperti terbaca, terkirim, dan reaksi.
- `chats.upsert` — chat baru atau yang berubah.
- `contacts.update` — kontak baru atau yang berubah.
- `presence.update` — `{ id, presences }` berisi status online, mengetik, atau merekam.
- `blocklist.update` — perubahan daftar blokir.
- `call` — panggilan masuk.

## Alamat JID

`jid` adalah alamat chat:

- `6281234567890@s.whatsapp.net` — nomor perorangan.
- `120363...@g.us` — grup.
- `120363406952188879@newsletter` — channel.

Fungsi `getBotJid` menerjemahkan JID `@bot` menjadi nomor `@s.whatsapp.net`.

## Kirim teks dan balasan

```js
const jid = '6281234567890@s.whatsapp.net'

await sock.sendMessage(jid, { text: 'Halo dari REIN BAILEYS' })

await sock.sendMessage(jid, {
  text: 'Ini mengedit pesan sebelumnya',
  edit: msg.key
})

await sock.sendMessage(jid, {
  text: 'Balasan dengan kutipan',
  quoted: msg
})

await sock.sendMessage(jid, {
  text: '@6281234567890 tolong dicek',
  mentions: ['6281234567890@s.whatsapp.net']
})
```

## Media dan jenis lain

```js
await sock.sendMessage(jid, { image: { url: './foto.jpg' }, caption: 'Foto dari REIN' })
await sock.sendMessage(jid, { video: { url: './klip.mp4' }, caption: 'Klip' })
await sock.sendMessage(jid, { audio: { url: './suara.mp3' }, mimetype: 'audio/mp4' })
await sock.sendMessage(jid, { document: { url: './laporan.pdf' }, mimetype: 'application/pdf' })
await sock.sendMessage(jid, { location: { degreesLatitude: -6.2, degreesLongitude: 106.8 } })
await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } })
```

Helper dari hasil gabungan fork mencakup polling, media sekali lihat, stiker, kartu kontak, pesan terjadwal, dan status mention:

```js
await sock.sendMessage(jid, {
  poll: { name: 'Pilih satu', values: ['A', 'B'], selectableCount: 1 }
})

import { makePollAddOptionMessage, makeEventInviteMessage } from 'reindiandikarc-baileys'
```

Untuk media, `sendMessage` menerima path maupun buffer. Upload memakai `waUploadToServer`, dan koneksi media bisa disegarkan lewat `refreshMediaConn`.

## Presence dan tanda baca

```js
await sock.sendPresenceUpdate('composing', jid)
await sock.sendMessage(jid, { text: 'Selesai' })
await sock.readMessages([msg.key])
```

## Rekam dan putar ulang event

`captureEventStream` menulis event ke berkas JSONL. `readAndEmitEventStream` mengembalikan emitter yang bisa diikat ke store:

```js
import { captureEventStream, readAndEmitEventStream, makeInMemoryStore } from 'reindiandikarc-baileys'

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
const store = makeInMemoryStore({})
store.bind(replay.ev)
await replay.task
```

## Antrean dengan queueJob

`queueJob` menjalankan tugas dalam satu bucket secara berurutan. Ini berguna kalau beberapa handler ingin menulis ke chat yang sama:

```js
import { queueJob } from 'reindiandikarc-baileys'

await queueJob(jid, async () => {
  await sock.sendMessage(jid, { text: 'Pesan ini tidak akan mendahului pesan sebelumnya' })
})
```

## Kirim dari builder

Untuk tombol, carousel, dan respons AI kaya, susun pesan dengan [MessageBuilder](./builder.html), lalu kirim lewat `send(jid)` atau teruskan ke `sock.relayMessage`.
