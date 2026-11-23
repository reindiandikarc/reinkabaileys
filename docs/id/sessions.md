# Sesi

Sesi adalah pasangan kredensial dan kunci yang membuat socket bisa tersambung ulang tanpa pairing lagi. REIN BAILEYS memakai bentuk auth state rc13, sehingga adapter yang mengikuti bentuk itu tetap kompatibel.

## Auth state multi-berkas

`useMultiFileAuthState(folder)` menyimpan kredensial dan kunci ke sebuah direktori:

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

`saveCreds` wajib dipasang pada `creds.update`. Tanpa itu, setiap restart akan meminta pairing baru. Jangan masukkan direktori ini ke version control dan pastikan aplikasi punya izin tulis.

## Bentuk auth state kustom

Untuk database, siapkan objek seperti yang dipakai rc13:

```js
const auth = {
  creds: {
    me: undefined,
    signedPreKey: undefined,
    noiseKey: undefined
  },
  keys: {
    get: async (type, ids) => ({}),
    set: async data => {},
    has: async (type, ids) => ({}),
    delete: async (type, ids) => {}
  }
}
```

`get` dan `has` mengembalikan objek yang dipetakan per id yang diminta; `set` dan `delete` menerima data kunci yang dikelompokkan per tipe.

## Auth state database

Ekspor dari Elaina mencakup penyimpanan yang umum dipakai:

- `useSqliteAuthState`
- `useMySQLAuthState`
- `useMongoAuthState`
- `usePostgresAuthState`
- `useRedisAuthState`
- `useNekoDBAuth`
- `useSingleFileAuthState`

Semuanya mengembalikan pasangan `{ state, saveCreds }` seperti `useMultiFileAuthState`; driver yang dibutuhkan dimuat hanya saat dipakai.

```js
import { useSqliteAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useSqliteAuthState({ filePath: './session.db' })
const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)
```

Untuk penyimpanan sendiri, `makeAuthStateFromStore(store)` mengubah adapter key-value menjadi auth state. `CREDS_KEY`, `encodeAuthValue`, dan `decodeAuthValue` juga diekspor untuk keperluan yang sama.

## In-memory store

`makeInMemoryStore` menyimpan chat, kontak, dan pesan di memori proses. Fungsi ini tidak menggantikan kredensial: tetap berikan auth state ke `makeWASocket`.

```js
import { makeInMemoryStore } from 'reindiandikarc-baileys'

const store = makeInMemoryStore({})
store.bind(sock.ev)

console.log(store.chats.get('6281234567890@s.whatsapp.net'))
```

Ekspor terkait: `waChatKey`, `waMessageID`, `waLabelAssociationKey`, `makeOrderedDictionary`, dan `ObjectRepository`.

## Putar ulang sesi yang direkam

`captureEventStream` menambahkan event ke berkas JSONL. `readAndEmitEventStream` membacanya kembali menjadi emitter:

```js
import { captureEventStream, readAndEmitEventStream } from 'reindiandikarc-baileys'

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
const store = makeInMemoryStore({})
store.bind(replay.ev)
await replay.task
```

## Catatan keamanan

Kredensial berisi kunci privat. Perlakukan folder auth atau database sebagai rahasia, buat cadangannya, dan hapus segera setelah logout. `DisconnectReason.loggedOut` menandakan sesi tidak bisa dipakai lagi; loop reconnect tidak akan membantu.
