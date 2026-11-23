# REIN BAILEYS

```
╭──────────────────────────────────────────────────────────╮
│  ✦  R E I N   B A I L E Y S                              │
├══════════════════════════════════════════════════════════┤
│  ◈  Protokol rc13 · ESM + CJS · Multi-Device             │
│  ◈  v7.0.0-rc13.1 · Pure JavaScript WhatsApp API         │
╰──────────────────────────────────────────────────────────╯
```

[![version](https://img.shields.io/badge/version-7.0.0--rc13.1-ff4d8d)](https://github.com/reindiandikarc/reinkabaileys) [![node](https://img.shields.io/badge/node-%3E%3D20-22d3ee)](https://nodejs.org/) [![license](https://img.shields.io/badge/license-MIT-a855f7)](LICENSE)

REIN BAILEYS adalah library WhatsApp Web API murni JavaScript untuk Node.js 20 atau lebih baru. Library ini menghubungkan aplikasi kamu ke WhatsApp sebagai perangkat pendamping lewat WebSocket. Kamu tidak menjalankan browser, tidak memakai Selenium, dan tidak mendapatkan bot siap pakai. Semua keputusan aplikasi tetap ada di kode kamu.

## Sekilas

| Informasi | Nilai |
|---|---|
| Nama paket | `reindiandikarc-baileys` |
| Repository | `reindiandikarc/reinkabaileys` |
| Versi | `7.0.0-rc13.1` |
| Versi protokol WA | `[2, 3000, 1035194821]` |
| Format modul | ESM dan CommonJS |
| Node.js | `>=20.0.0` |
| Lisensi | MIT |

---

## Fitur utama

### 1. Koneksi dan keamanan

- Koneksi langsung ke WhatsApp Web Multi-Device lewat WebSocket `wss://web.whatsapp.com/ws/chat`.
- Login lewat QR code atau pairing code. Pairing code cukup memakai nomor telepon, tanpa scan QR.
- Handshake Noise dan enkripsi Signal Protocol untuk pesan. Semua payload diserialisasi lewat `WAProto/index.js`.
- Sinkronisasi kontak, chat, pengaturan privasi, dan riwayat saat login pertama.
- Reconnect diatur lewat event `connection.update`. `DisconnectReason` membedakan logout, timeout, dan koneksi terputus.

### 2. Pesan dan media

- Kirim teks, reply, quote, mention, forward, edit pesan, dan hapus pesan.
- Kirim gambar, video, GIF, audio, voice note, dokumen, stiker, dan pesan sekali lihat.
- Kirim lokasi, kartu kontak vCard, reaksi emoji, pin pesan, dan polling.
- Unduh media masuk, unggah ulang media, dan buat thumbnail gambar atau video.
- Link preview otomatis, dengan opsi kualitas tinggi.
- Tandai pesan dibaca, retry pesan, label, bintang, dan quick reply.

Contoh:

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', { text: 'Halo dari REIN BAILEYS' })

await sock.sendMessage(jid, { image: { url: './foto.jpg' }, caption: 'Foto dari REIN' })

await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } })

await sock.sendMessage(jid, {
  poll: { name: 'Pilih', values: ['A', 'B'], selectableCount: 1 }
})
```

`jid` adalah alamat tujuan. Bisa berupa nomor pribadi (`...@s.whatsapp.net`), grup (`...@g.us`), atau channel (`...@newsletter`).

### 3. Grup dan komunitas

- Buat grup, ubah subjek dan deskripsi, buat atau cabut invite code.
- Tambah dan keluarkan member, ubah admin, atur approval mode dan cara tambah member.
- Atur pesan sementara, pengaturan grup, dan metadata lengkap.
- Buat komunitas, hubungkan atau lepaskan grup, dan kelola request participant.

### 4. Channel atau newsletter

- Baca metadata, subscriber, dan daftar pesan channel.
- Follow, unfollow, mute, dan unmute channel.
- Ubah nama, deskripsi, dan foto channel.
- Buat dan hapus channel, hitung admin, ubah owner, dan demote admin.
- Beri reaksi pada pesan channel dan pantau view channel.
- Auto-follow ke channel yang sudah ditentukan, dengan opsi mute dan reaksi otomatis.

### 5. Chat, kontak, dan privasi

- Arsip chat, mute atau unmute, tandai dibaca atau belum dibaca, dan hapus chat.
- Atur presence: online, typing, atau recording.
- Ubah nama, foto, status, dan about profil. Ambil URL foto profil.
- Kelola blocklist, daftar perangkat, dan pengaturan privasi seperti last seen, read receipt, dan siapa yang bisa menambahkan kamu ke grup.
- Tambah, ubah, dan hapus kontak. Baca profil WhatsApp Business.

### 6. MessageBuilder dan pesan kaya

`MessageBuilder`, juga diekspor sebagai `MB`, adalah kumpulan builder pesan interaktif. Tiap builder menerima socket sebagai argumen pertama, lalu dirangkai lewat method setter.

- `Button`, `ButtonV2`, `Carousel`, dan `AIRich` untuk tombol native flow, kartu geser, dan jawaban AI.
- Helper A2UI dan HTML app lewat `a2uiCard`, `a2uiText`, `sendA2UI`, dan `sendHtmlApp`.
- Helper status, sticker, newsletter, dan mention status.
- Pesan terjadwal, undangan event, polling lanjutan, dan pembayaran.
- Pencarian username lewat `validateUsername` dan `displayUsername`.

Contoh:

```js
import { MB } from 'reindiandikarc-baileys'

await new MB.Button(sock)
  .setTitle('Pilih salah satu')
  .setBody('Ketuk tombol di bawah')
  .addReply('Ya', 'ya')
  .addReply('Tidak', 'tidak')
  .send(jid)
```

`build(jid)` mengembalikan payload pesan tanpa mengirimnya. `send(jid)` mengirimkannya langsung.

### 7. Panggilan dan media lanjutan

- `makeVoipClient` untuk kebutuhan panggilan, didukung mesin WASM dan klien WebRTC `@roamhq/wrtc`.
- Audio feeder dan video feeder memakai binary `ffmpeg`. Jalur ini bisa diarahkan dengan `FFMPEG_PATH` atau opsi `ffmpegPath`.
- `TTLCache` dan cache metadata grup untuk mengurangi query berulang.
- Voice note recognition, loader media, dan preview link.

### 8. Sesi dan penyimpanan

- `useMultiFileAuthState(folder)` menyimpan kredensial dan kunci ke folder. Pasang `saveCreds` ke event `creds.update` agar sesi bertahan setelah restart.
- Auth state siap pakai untuk SQLite, MySQL, MongoDB, Postgres, Redis, NekoDB, dan single file.
- `makeInMemoryStore` menyimpan chat, kontak, dan pesan di memory.
- `captureEventStream` dan `readAndEmitEventStream` merekam serta memutar ulang event.
- `queueJob` menjalankan tugas per bucket secara berurutan.
- `getBotJid` memetakan JID `@bot` ke nomor `@s.whatsapp.net`. `extractNewsletterMetadata` membaca metadata dari node binary.

### 9. Event

Dengarkan perubahan lewat `sock.ev.on(nama, handler)`.

| Event | Isi | Kegunaan |
|---|---|---|
| `connection.update` | `{ connection, qr, lastDisconnect }` | QR, status koneksi, reconnect |
| `creds.update` | credentials | Menyimpan sesi |
| `messages.upsert` | `{ messages, type }` | Pesan masuk |
| `messages.update` | array | Status pesan dan reaksi |
| `chats.upsert` | array | Chat baru atau berubah |
| `contacts.update` | array | Kontak baru atau berubah |
| `groups.upsert` | array | Grup baru |
| `presence.update` | `{ id, presences }` | Online, typing, recording |
| `call` | array | Panggilan masuk |
| `newsletter.reaction` | object | Reaksi channel |

Nilai `connection` adalah `connecting`, `open`, atau `close`.

### 10. Utilitas socket

Method yang sering dipakai antara lain `onWhatsApp`, `executeUSyncQuery`, `waitForConnectionUpdate`, `waitForMessage`, `getUSyncDevices`, `refreshMediaConn`, `getBotListV2`, `requestPairingCode`, `logout`, dan `end`.

Daftar lengkap export ada di dokumentasi API yang dihasilkan dari source.

---

## Instalasi

Taruh link github reinka di file package.json bot kalian

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Lalu jalankan `npm install`. Import memakai nama paket, bukan nama repository.

### ESM

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
      if (!msg.key.fromMe) console.log(msg.key.remoteJid, msg.message)
    }
  })
}

connect()
```

### CommonJS

```js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('reindiandikarc-baileys')

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) connect()
  })
}

connect()
```

---

## Konfigurasi koneksi

Opsi yang paling sering dipakai:

| Opsi | Default | Fungsi |
|---|---|---|
| `auth` | `undefined` | Auth state wajib untuk login |
| `version` | `[2, 3000, 1035194821]` | Versi protokol WhatsApp |
| `browser` | macOS Chrome | Identitas perangkat pendamping |
| `markOnlineOnConnect` | `true` | Tandai online saat terhubung |
| `syncFullHistory` | `true` | Sinkronisasi riwayat penuh |
| `connectTimeoutMs` | `20000` | Timeout koneksi |
| `getMessage` | `async () => undefined` | Ambil pesan untuk retry dan quote |
| `shouldIgnoreJid` | `() => false` | Filter JID |
| `generateHighQualityLinkPreview` | `false` | Preview link kualitas tinggi |
| `brand.pairingNotice` | `true` | Notifikasi QR atau pairing di console |
| `autoFollow` | aktif | Konfigurasi auto-follow channel |

```js
const sock = makeWASocket({
  auth: state,
  markOnlineOnConnect: false,
  syncFullHistory: false,
  autoFollow: false,
  shouldIgnoreJid: jid => jid.endsWith('@broadcast')
})
```

Pairing code dipinta dengan `await sock.requestPairingCode('6281234567890')`. Library mencetak `PAIRING CODE <kode>` ke console secara otomatis.

---

## Auto-follow channel

Aktif pada setiap `makeWASocket()`. Setelah koneksi `open`, library menunggu 15 detik lalu melakukan tiga hal:

1. Follow channel `120363406952188879@newsletter`.
2. Mute channel 3 detik kemudian.
3. Balas pesan `notify` dari channel itu dengan reaksi emoji acak setelah 3 detik.

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

makeWASocket({ auth: state, autoFollow: false })
```

Env `REIN_NO_AUTO_FOLLOW=1` juga mematikannya. `attachAutoFollow(sock, config)` dan `normalizeAutoFollow(value)` diekspor untuk pemakaian manual. `attachAutoFollow` mengembalikan fungsi dispose.

---

## Branding dan environment

Saat paket diimpor, banner **REIN BAILEYS** dengan gradient `#ff4d8d`, `#a855f7`, dan `#22d3ee` plus penghias `✦ ◈ ◆` muncul sekali per proses, baik lewat `import` ESM maupun `require()` CJS.

| Kontrol | Cara |
|---|---|
| Matikan banner | `REIN_NO_BANNER=1` atau `REINDIANDIKARC_NO_BANNER=1` |
| Paksa warna di log non-TTY | `FORCE_COLOR=1` |
| Teks polos tanpa ANSI | `NO_COLOR=1` atau `FORCE_COLOR=0` |
| Matikan notifikasi QR atau pairing | `brand: { pairingNotice: false }` |
| Matikan auto-follow | `autoFollow: false` atau `REIN_NO_AUTO_FOLLOW=1` |

Di Pterodactyl, console panel bukan TTY sehingga banner tampil polos secara default. Tambahkan `FORCE_COLOR=1` pada environment variable egg bila ingin berwarna. Startup tetap `node index.js` milik aplikasi kamu.

---

## Dependensi

Paket ini memiliki 23 dependency langsung. Tidak ada `peerDependencies`, `peerDependenciesMeta`, atau `optionalDependencies`, jadi tidak perlu menginstal driver satu per satu. Modul berat tetap dimuat saat fiturnya dipakai, bukan saat import pertama.

Driver dan media yang ikut terpasang antara lain `better-sqlite3`, `ioredis`, `mongodb`, `mysql2`, `pg`, `sharp`, `jimp`, `audio-decode`, `@roamhq/wrtc`, dan `fluent-ffmpeg`.

`fluent-ffmpeg` adalah wrapper JavaScript. Untuk voice note, ekstrak frame video, dan VoIP, binary `ffmpeg` serta `ffprobe` tetap harus tersedia di PATH, atau diarahkan lewat `FFMPEG_PATH`. Fungsi inti seperti koneksi dan kirim teks tidak memerlukan binary tersebut.

---

## Struktur proyek

```
reindiandikarc-baileys/
├── src/                    kode sumber library
│   ├── index.js            entry ESM
│   ├── index.cjs           dispatcher CJS
│   ├── index.bundle.cjs    bundle CJS lengkap
│   ├── cjs/                artefak CJS ter-commit
│   ├── Socket/             lapisan socket dan method WA
│   ├── Utils/              auth, media, kripto, dan helper
│   ├── Signal/             enkripsi Signal dan grup
│   ├── WABinary/           encode dan decode node binary
│   ├── Store/              in-memory store
│   ├── MessageBuilder/     builder pesan interaktif
│   ├── Voip/               klien panggilan dan feeder media
│   ├── Brand/              banner dan notifikasi pairing
│   ├── AutoFollow/         follow, mute, dan reaksi channel
│   └── assets/wasm/        aset WASM panggilan
├── WAProto/                definisi protobuf WhatsApp
├── docs/                   dokumentasi bahasa Inggris dan Indonesia
├── test/                   pengujian node --test
├── script/                 generator API reference dan situs docs
├── scripts/                build artefak CJS
├── .github/                issue template dan GitHub Actions
├── engine-requirements.js  pemeriksa versi Node
├── LICENSE
└── README.md
```

Dokumentasi situs dibangun dari `docs/en/` dan `docs/id/`. Jalankan `npm run build:docs` untuk menghasilkan folder `site/`.

---

## Pengembangan

```bash
npm install
npm run build:cjs
npm run build:docs
npm test
```

Artefak CJS sudah ter-commit di `src/cjs/`, jadi konsumen CJS tidak perlu menjalankan build.

File `.github/workflows/*.yml` adalah konfigurasi GitHub Actions. YAML adalah format teks berbasis indentasi untuk konfigurasi. GitHub membaca bagian `on:` sebagai pemicu, lalu menjalankan perintah di `jobs.<nama>.steps`.

| Workflow | Pemicu | Fungsi |
|---|---|---|
| `test.yml` | push dan pull request ke `main` | Menjalankan test |
| `docs.yml` | push ke `main` atau manual | Membangun docs dan mengunggah artifact |
| `auto-update.yml` | manual | Build CJS dan verifikasi ESM serta CJS |
| `proto-watch.yml` | manual | Menghitung jumlah export |
| `stale.yml` | harian dan manual | Menutup issue lama |

Tidak ada workflow yang meng-commit, men-tag, merilis, atau mengubah profil akun.

---

## Lisensi dan kontributor

Lisensi paket: MIT. Satu file [`LICENSE`](LICENSE).

Beberapa fitur dan fungsi diadaptasi dari proyek berikut:

| Proyek | Fitur atau fungsi |
|---|---|
| [yuusuke1101/ryuuxalya](https://github.com/yuusuke1101/ryuuxalya) | store, event stream, antrean, dan helper JID |
| [rexxzyid/elaina-baileys](https://github.com/rexxzyid/elaina-baileys) | MessageBuilder, native flow, A2UI, VoIP, auth state database, dan protobuf tambahan |
| [reindiandikarc/reinkabaileys](https://github.com/reindiandikarc/reinkabaileys) | pengembangan, branding, dan rilis paket ini |
| [Rifza111/baileys](https://github.com/Rifza111/baileys) | kontribusi Termai pada helper media dan fungsi pendukung |

Basis implementasi protokol WhatsApp Web berasal dari [Whiskeysockets/Baileys](https://github.com/Whiskeysockets/Baileys).

Proyek ini tidak berafiliasi resmi dengan WhatsApp atau Meta. Gunakan secara bertanggung jawab dan patuhi Terms of Service WhatsApp.
