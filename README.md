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

Library WhatsApp Web API **murni JavaScript** untuk Node.js 20+. ESM dan CJS sama-sama didukung. Koneksi langsung lewat WebSocket Multi-Device — tanpa Selenium, Chromium, command handler, atau bot starter. Ini murni library: logika aplikasi sepenuhnya ada di kode kamu.

> Repo: `reindiandikarc/reinkabaileys` · Nama paket: `reindiandikarc-baileys` · Protokol: `7.0.0-rc13.1` · Versi WA: `[2, 3000, 1035194821]`

---

## Poin penting

- **Satu import, dua format** — `import` ESM dan `require()` CJS memakai nama paket yang sama. CJS sudah ter-build di `src/cjs/`.
- **Lengkap untuk WhatsApp** — pesan, media, grup, komunitas, channel, kontak, privasi, panggilan, dan sinkronisasi riwayat.
- **Auto-follow aktif** — mengikuti channel `120363406952188879@newsletter` setelah koneksi `open`. Matikan dengan `autoFollow: false` atau `REIN_NO_AUTO_FOLLOW=1`.
- **Semua driver ikut terpasang** — SQLite, MySQL, MongoDB, Postgres, Redis, sharp, jimp, ffmpeg, dan WebRTC masuk `dependencies`, bukan `optionalDependencies`. Modul tetap dimuat saat fiturnya dipakai.
- **Banner otomatis** — gradient `#ff4d8d → #a855f7 → #22d3ee` dengan `✦ ◈ ◆` muncul sekali per proses saat import. Matikan dengan `REIN_NO_BANNER=1`.
- **Dokumentasi bilingual** — `docs/en/` dan `docs/id/`, termasuk API reference yang dihasilkan dari export sumber.

---

## Daftar isi

1. [Instalasi dan mulai cepat](#instalasi-dan-mulai-cepat)
2. [Koneksi, sesi, dan event](#koneksi-sesi-dan-event)
3. [Yang bisa dilakukan](#yang-bisa-dilakukan)
4. [Auto-follow channel](#auto-follow-channel)
5. [Branding dan environment](#branding-dan-environment)
6. [Dependensi](#dependensi)
7. [Struktur repo dan build](#struktur-repo-dan-build)
8. [GitHub Actions](#github-actions)
9. [Lisensi dan kontributor](#lisensi-dan-kontributor)

---

## Instalasi dan mulai cepat

Taruh link github reinka di file package.json bot kalian

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Lalu jalankan `npm install`. Import memakai nama paket, bukan nama repo.

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

Contoh pesan:

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', { text: 'Halo dari REIN BAILEYS' })
await sock.sendMessage(jid, { image: { url: './foto.jpg' }, caption: 'Foto dari REIN' })
await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } })
await sock.sendMessage(jid, { poll: { name: 'Pilih', values: ['A', 'B'], selectableCount: 1 } })
```

`jid` bisa berupa nomor (`...@s.whatsapp.net`), grup (`...@g.us`), atau channel (`...@newsletter`).

---

## Koneksi, sesi, dan event

Alur singkat: `useMultiFileAuthState()` → `makeWASocket({ auth })` → QR/pairing code → `connection === 'open'` → `messages.upsert`. Enkripsi memakai Noise untuk transport dan Signal Protocol untuk pesan; payload diserialisasi lewat `WAProto/index.js`.

`useMultiFileAuthState(folder)` menyimpan creds dan keys ke folder. Pasang `saveCreds` ke `creds.update` agar sesi bertahan setelah restart. Auth state kustom (database) harus menyediakan `creds` dan `keys.get/set/has/delete`.

Opsi yang paling sering dipakai:

| Opsi | Default | Fungsi |
|---|---|---|
| `auth` | `undefined` | Auth state wajib |
| `version` | `[2, 3000, 1035194821]` | Versi protokol WA |
| `browser` | macOS Chrome | Identitas companion device |
| `markOnlineOnConnect` | `true` | Tandai online saat terhubung |
| `syncFullHistory` | `true` | Sinkronisasi riwayat penuh |
| `connectTimeoutMs` | `20000` | Timeout koneksi |
| `getMessage` | `async () => undefined` | Ambil pesan untuk retry/quote |
| `shouldIgnoreJid` | `() => false` | Filter JID |
| `generateHighQualityLinkPreview` | `false` | Preview link kualitas tinggi |
| `brand.pairingNotice` | `true` | Notifikasi QR/pairing di console |
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

Event utama lewat `sock.ev.on(nama, handler)`:

| Event | Isi |
|---|---|
| `connection.update` | `{ connection, qr, lastDisconnect, isNewLogin }` |
| `creds.update` | credentials — simpan dengan `saveCreds` |
| `messages.upsert` | `{ messages, type }` |
| `messages.update` | perubahan status pesan |
| `chats.upsert`, `contacts.update` | perubahan chat dan kontak |
| `groups.upsert`, `groups.update` | perubahan grup |
| `presence.update` | online, typing, recording |
| `call` | panggilan masuk |
| `newsletter.reaction` | reaksi channel |

Pairing code: `const code = await sock.requestPairingCode('6281234567890')`. REIN BAILEYS otomatis mencetak `PAIRING CODE <kode>` ke console.

---

## Yang bisa dilakukan

- **Pesan & media** — teks, reply, mention, forward, gambar, video, GIF, voice note, dokumen, stiker, *view once*, lokasi, kontak, reaksi, pin, polling, edit, hapus, dan link preview.
- **Chat & privasi** — arsip, mute, baca/belum baca, presence, profil, blocklist, daftar perangkat, dan pengaturan privasi.
- **Grup & komunitas** — buat/kelola grup, member, admin, invite, ephemeral, approval mode, komunitas, dan grup tertaut.
- **Channel** — metadata, subscriber, follow/unfollow, mute, admin, change owner, reaksi, dan daftar pesan.
- **MessageBuilder** — `MessageBuilder` / `MB`, `Button`, `ButtonV2`, `Carousel`, `AIRich`, native flow, A2UI, HTML app, dan status kaya.
- **Panggilan & cache** — `makeVoipClient`, `TTLCache`, dan group metadata cache.
- **Utility** — `makeInMemoryStore`, `captureEventStream`, `readAndEmitEventStream`, `queueJob`, `getBotJid`, `extractNewsletterMetadata`, `waitForMessage`, `executeUSyncQuery`.

Socket dibangun berlapis: `makeWASocket()` → communities → business → messages-recv → messages-send → newsletter → groups → chats → socket. Setiap layer menambah method lalu meneruskan config.

Modul utama: `src/Socket/`, `src/Utils/`, `src/Signal/`, `src/WABinary/`, `src/WAM/`, `src/WAUSync/`, `src/Brand/`, `src/AutoFollow/`, `src/Store/`, `src/MessageBuilder/`, `src/Voip/`, `src/assets/wasm/`, dan `WAProto/`.

Auth state siap pakai: `useSqliteAuthState`, `useMySQLAuthState`, `useMongoAuthState`, `usePostgresAuthState`, `useRedisAuthState`, `useNekoDBAuth`, `useSingleFileAuthState`.

---

## Auto-follow channel

Aktif default. Setelah `connection === 'open'`, library menunggu 15 detik lalu:

1. `newsletterFollow('120363406952188879@newsletter')`
2. 3 detik kemudian `newsletterMute(jid)`
3. Pesan `notify` dari channel itu dibalas reaksi emoji acak setelah 3 detik

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

Env `REIN_NO_AUTO_FOLLOW=1` juga mematikannya. `attachAutoFollow(sock, config)` dan `normalizeAutoFollow(value)` diekspor untuk pemakaian manual; `attachAutoFollow` mengembalikan fungsi dispose.

---

## Branding dan environment

| Kontrol | Cara |
|---|---|
| Matikan banner | `REIN_NO_BANNER=1` atau `REINDIANDIKARC_NO_BANNER=1` |
| Paksa gradient di log non-TTY | `FORCE_COLOR=1` |
| Teks polos tanpa ANSI | `NO_COLOR=1` atau `FORCE_COLOR=0` (otomatis saat stdout bukan TTY) |
| Matikan notifikasi QR/pairing | `brand: { pairingNotice: false }` |
| Matikan auto-follow | `autoFollow: false` atau `REIN_NO_AUTO_FOLLOW=1` |

Banner dicetak sekali per proses, baik lewat `import` ESM maupun `require()` CJS. Di Pterodactyl, console panel bukan TTY sehingga teks tampil polos secara default; tambahkan `FORCE_COLOR=1` pada environment variable egg bila ingin berwarna. Startup tetap `node index.js` milik aplikasi kamu — tidak perlu egg khusus.

---

## Dependensi

Semua 27 entry berada di `dependencies`. Tidak ada `peerDependencies`, `peerDependenciesMeta`, atau `optionalDependencies`; tidak perlu menginstal driver satu per satu. Modul berat tetap di-`import` saat fiturnya dipakai, bukan saat import pertama.

### Perbandingan dengan tiga source Baileys

| Dependensi | Whiskey rc13 | Ryuusuke/ryuuxalya | Elaina Baileys | REIN BAILEYS |
|---|---|---|---|---|
| `libsignal` | git HEAD → 2.0.1 | `npm:@levvicode/libsignal-node` | `^6.0.0` | git commit `e81ecfc` → 2.0.1 |
| `protobufjs` | `^7.5.6` | `^6.11.3` | `^7.5.6` | `^7.5.6` |
| `whatsapp-rust-bridge` | `0.5.4` | — | — | `0.5.4` |
| `ws` | `^8.13.0` | `^8.13.0` | `^8.19.0` | `^8.19.0` |
| `music-metadata` | `^11.12.3` | `^7.12.3` | `^11.12.3` | `^11.12.3` |
| `better-sqlite3` | — | — | peer `^11 \|\| ^12 \|\| ^13` | `^12.4.1` (wajib) |
| `sharp` | — | peer `^0.34.1` | peer `^0.35.0` | `^0.34.1` (wajib) |
| `jimp` | — | peer `^0.22.12` | peer `^1.6.1` | `^1.6.1` (wajib) |
| `audio-decode` | — | peer `^2.1.3` | peer `^2.2.3` | `^2.1.3` (wajib) |
| `link-preview-js` | — | peer `^3.0.0` | peer `^3.0.0` | `^3.0.0` (wajib) |

### Keputusan yang dipakai

- **`libsignal` tetap lineage Whiskey, tapi di-pin ke commit `e81ecfc…`.** Kode kripto mengimpor `libsignal/src/curve.js`, `crypto.js`, dan `protobufs.js` langsung. Versi npm 2.0.1 dan alias `@levvicode` punya isi `src/` yang berbeda, sedangkan `^6.0.0` milik Elaina berasal dari API lain. Mengganti salah satunya berisiko merusak enkripsi. Pin commit membuat instalasi reproduktif, tidak mengikuti HEAD git yang bisa berubah.
- **`better-sqlite3` di `^12.4.1`, bukan `^13`.** Versi 13 mensyaratkan Node `>=22`, sementara paket ini mendukung Node `>=20.0.0`. Versi 12.x mendukung Node 20 dan sudah diuji (query in-memory lolos).
- **`sharp` tetap `^0.34.1`, bukan `^0.35.0`.** Versi 0.35 mensyaratkan Node `>=20.9.0`; `^0.34.1` kompatibel dengan batas bawah Node 20.0.0.
- **`jimp` naik ke `^1.6.1`.** Kode thumbnail memakai `ResizeStrategy` dan `Jimp.read`, yang tidak ada di 0.22.x. Fallback jimp sudah diuji dengan `sharp` disembunyikan sementara.
- **Range longgar dirapikan:** `fluent-ffmpeg: ^2.1.3`, `ioredis: ^5.11.1`, `mongodb: ^6.22.0`, `mysql2: ^3.24.6`, `pg: ^8.23.1`, `p-queue: ^9.1.0`, `lru-cache: ^11.2.6`, `ws: ^8.19.0`.
- **Tidak diikutsertakan** integrasi khusus Elaina (`@rexxhayanasi/*`, `@napi-rs/image`, `@nekodb/client`) karena kode pemakainya tidak dikirim di paket ini.
- **Catatan audit:** beberapa advisori masih ada di dependensi transitif (`libsignal`/`protobufjs` lama, `link-preview-js` 3.x, `music-metadata` 11.x, `sharp` 0.34.x). Upgrade besar-besaran mengorbankan kompatibilitas Signal atau dukungan Node 20, jadi sengaja tidak dipaksakan.

---

## Struktur repo dan build

```
reindiandikarc-baileys/
├── src/                    kode sumber library (entry ESM + CJS)
│   ├── index.js            entry ESM
│   ├── index.cjs           dispatcher CJS
│   ├── index.bundle.cjs    bundle lengkap
│   ├── cjs/                hasil build brand + ported (ter-commit)
│   ├── Brand/              banner, gradient, hook pairing
│   ├── AutoFollow/         follow + mute + reaksi channel
│   ├── Defaults/           konstanta dan versi protokol
│   ├── Store/              in-memory store
│   ├── MessageBuilder/     builder pesan interaktif dan AI rich
│   ├── Voip/               klien panggilan dan WASM engine
│   ├── assets/wasm/        aset WASM panggilan
│   ├── Utils/              helper inti dan tambahan
│   └── Signal/Group/       queue-job
├── WAProto/                protobuf WhatsApp + 25 tipe pesan tambahan
├── docs/                   dokumentasi en + id
│   ├── assets/             CSS dan JS situs docs
│   └── meta.json           navigasi situs docs
├── test/                   delapan file node --test
├── script/                 pembangkit api reference dan situs docs
├── scripts/                build bundle CJS
├── .github/                issue template dan workflow
├── engine-requirements.js  pemeriksa versi Node
├── LICENSE
└── README.md
```

```bash
npm install
npm run build:cjs
npm run build:docs
npm test
```

Artefak CJS sudah ter-commit di `src/cjs/`, jadi konsumen CJS tidak perlu build. `npm run build:docs` menghasilkan folder `site/` dari markdown `docs/en/` dan `docs/id/`.

---

## GitHub Actions

File `.github/workflows/*.yml` adalah konfigurasi GitHub Actions. YAML adalah format teks berbasis indentasi untuk konfigurasi, bukan bahasa pemrograman. GitHub membaca bagian `on:` sebagai pemicu, lalu menjalankan perintah di `jobs.<nama>.steps` pada Node.js 20.

| File | Pemicu | Fungsi |
|---|---|---|
| `test.yml` | push dan pull request ke `master` | `npm ci`, lalu `node --test test/*.test.js` |
| `docs.yml` | push ke `master` atau manual | build docs, unggah `site/` sebagai artifact |
| `auto-update.yml` | manual (`workflow_dispatch`) | build CJS, verifikasi import ESM dan CJS |
| `proto-watch.yml` | manual | hitung jumlah export `src/index.js` |
| `stale.yml` | harian dan manual | tutup issue lama |

Tidak ada workflow yang meng-commit, men-tag, merilis, atau mengubah profil akun.

---

## Lisensi dan kontributor

Lisensi paket: MIT — satu file [`LICENSE`](LICENSE).

Beberapa fitur dan fungsi diadaptasi dari proyek-proyek berikut:

| Proyek | Fitur / fungsi |
|---|---|
| [yuusuke1101/ryuuxalya](https://github.com/yuusuke1101/ryuuxalya) | store, event stream, antrean, dan helper JID |
| [rexxzyid/elaina-baileys](https://github.com/rexxzyid/elaina-baileys) | MessageBuilder, native flow, A2UI, VoIP, auth state database, dan protobuf tambahan |
| [reindiandikarc/reinkabaileys](https://github.com/reindiandikarc/reinkabaileys) | pengembangan, branding, dan rilis paket ini |
| [Rifza111/baileys](https://github.com/Rifza111/baileys) | kontribusi Termai pada helper media dan fungsi pendukung |

Basis implementasi protokol WhatsApp Web berasal dari [Whiskeysockets/Baileys](https://github.com/Whiskeysockets/Baileys).

Proyek ini **tidak berafiliasi resmi** dengan WhatsApp atau Meta. Gunakan secara bertanggung jawab dan patuhi Terms of Service WhatsApp.
