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

Library WhatsApp Web API **murni JavaScript** (ESM + CJS), hasil gabungan tiga fork Baileys dalam satu paket. Berjalan lewat WebSocket langsung — tanpa Selenium, tanpa Chromium, tanpa command handler. Auto-follow channel sudah aktif dan bisa dimatikan.

Saat paket diimpor, banner **REIN BAILEYS** berwarna gradient (`#ff4d8d → #a855f7 → #22d3ee`) dengan penghias `✦ ◈ ◆` otomatis muncul di terminal maupun console Pterodactyl.

> Repo: `reindiandikarc/reinkabaileys` · Nama paket: `reindiandikarc-baileys` · Protokol: `7.0.0-rc13.1`

---

## Daftar isi

1. [Apa itu Baileys dan cara kerjanya](#apa-itu-baileys-dan-cara-kerjanya)
2. [Fitur lengkap](#fitur-lengkap)
3. [Arsitektur paket](#arsitektur-paket)
4. [Hasil gabungan fork](#hasil-gabungan-fork)
5. [Persyaratan](#persyaratan)
6. [Instalasi](#instalasi)
7. [Quick start](#quick-start)
8. [Autentikasi dan sesi](#autentikasi-dan-sesi)
9. [Konfigurasi koneksi](#konfigurasi-koneksi)
10. [Event reference](#event-reference)
11. [API socket](#api-socket)
12. [Contoh pesan dan media](#contoh-pesan-dan-media)
13. [Pairing code](#pairing-code)
14. [Auto-follow channel](#auto-follow-channel)
15. [Branding dan environment](#branding-dan-environment)
16. [Penyimpanan dan utilitas tambahan](#penyimpanan-dan-utilitas-tambahan)
17. [Catatan Pterodactyl](#catatan-pterodactyl)
18. [Struktur repo](#struktur-repo)
19. [Build](#build)
20. [Atribusi dan disclaimer](#atribusi-dan-disclaimer)

---

## Apa itu Baileys dan cara kerjanya

Baileys adalah implementasi JavaScript untuk protokol WhatsApp Web **Multi-Device**. Aplikasi kamu terhubung sebagai perangkat pendamping (*companion device*) langsung ke server WhatsApp melalui WebSocket `wss://web.whatsapp.com/ws/chat`.

Alur singkatnya:

```
useMultiFileAuthState()  →  auth state (creds + keys)
        ↓
makeWASocket({ auth })   →  socket WebSocket + Noise protocol
        ↓
QR / pairing code        →  pendaftaran companion device
        ↓
connection.update        →  connection = 'open'
        ↓
sock.ev.on('messages.upsert', …)  →  pesan masuk
sock.sendMessage(jid, …)          →  pesan keluar
```

Yang terjadi di balik layar:

- **WebSocket + Noise** — frame WA dienkripsi dengan `Noise_XX_25519_AESGCM_SHA256`; koneksi bukan HTTP polling dan bukan browser.
- **Signal Protocol** — enkripsi end-to-end untuk pesan, dengan repository kunci dari `src/Signal/`.
- **WAProto** — definisi protobuf WhatsApp ada di `WAProto/index.js`; semua payload pesan diserialisasi lewat sini.
- **App state & history sync** — kontak, chat, dan riwayat disinkronkan saat login pertama (`syncFullHistory: true`).
- **Event driven** — hampir semua perubahan (koneksi, pesan, grup, kontak) masuk lewat `sock.ev`, bukan lewat return value.

Library ini **bukan bot**: tidak ada command handler, tidak ada starter, tidak ada scheduler. Semua keputusan aplikasi ada di kode konsumen.

---

## Fitur lengkap

### Koneksi dan login

- Koneksi langsung via **WebSocket** ke WhatsApp Web Multi-Device, tanpa browser otomatis.
- Dua metode login: **QR code** atau **pairing code** (cukup nomor telepon, tanpa scan).
- Sesi tersimpan lewat `useMultiFileAuthState` atau auth state kustom (database).
- Reconnect lewat event `connection.update`; `DisconnectReason` membedakan logout, timeout, dan connection lost.
- Enkripsi **Signal Protocol** bawaan + handshake Noise.
- App state, privacy settings, dan history sync otomatis.

### Pesan dan media

- Teks, reply/quote, mention, forward, dan pesan dengan konteks.
- Media: gambar, video, GIF, audio/voice note, dokumen, stiker, dan *view once*.
- Lokasi, kontak vCard, reaksi emoji, pin pesan, dan polling/voting.
- Link preview otomatis (dengan opsi kualitas tinggi).
- Download media masuk dan re-upload media.
- Hapus pesan untuk semua, edit pesan, baca pesan, dan retry pesan.
- Label, bintang, dan quick reply.

### Chat, kontak, dan privasi

- Arsip, mute/unmute, tandai dibaca/belum dibaca, hapus chat.
- Presence: online, typing, recording.
- Profil: nama, foto, status, about, dan foto profil URL.
- Blocklist, daftar perangkat, dan pengaturan privasi (last seen, read receipt, group add, dll.).
- Kontak: tambah/edit/hapus.
- Business profile untuk akun WhatsApp Business.

### Grup dan komunitas

- Buat grup, ubah subjek/deskripsi, invite code, dan revoka invite.
- Tambah/kick member, ubah admin, approval mode, member add mode.
- Toggle ephemeral messages, pengaturan grup, dan metadata lengkap.
- Buat komunitas, hubungkan/hapus grup, request participant update.

### Newsletter / Channel

- Metadata, subscriber, dan daftar pesan channel.
- Follow/unfollow, mute/unmute, update nama/deskripsi/foto.
- Buat dan hapus channel, admin count, change owner, demote.
- Reaksi channel dan auto-follow dengan JID yang sudah ditentukan.

### Builder pesan, status, dan fitur lanjutan (Elaina)

- `MessageBuilder` / `MB` untuk menyusun tombol, carousel, AI rich message, dan pesan interaktif lain dalam satu rantai.
- Native flow, A2UI, HTML app, template status/sticker status, newsletter status, scheduled message, dan username lookup.
- Voice note recognition, optional media/ffmpeg loader, dan link preview metadata.
- `makeVoipClient` + `TTLCache` + group metadata cache untuk kebutuhan panggilan dan cache.
- Auth state siap pakai untuk SQLite, MySQL, MongoDB, Postgres, Redis, NekoDB, dan single file.

### Event dan API lain

- `sock.ev` untuk pesan, koneksi, grup, kontak, chat, presence, panggilan, dan blokir.
- `executeUSyncQuery`, `onWhatsApp`, `fetchAccountReachoutTimelock`, `fetchNewChatMessageCap`.
- `waitForConnectionUpdate`, `waitForMessage`, `getBotListV2`.
- `makeInMemoryStore`, `captureEventStream`, `queueJob` hasil port.

---

## Arsitektur paket

Socket dibangun berlapis; setiap layer menambah method lalu meneruskan `config` ke layer berikutnya:

```
makeWASocket()                 src/Socket/index.js
   └─ makeCommunitiesSocket()  src/Socket/communities.js
        └─ makeBusinessSocket()   src/Socket/business.js
             └─ makeMessagesRecvSocket()  src/Socket/messages-recv.js
                  └─ makeMessagesSocket()   src/Socket/messages-send.js
                       └─ makeNewsletterSocket()  src/Socket/newsletter.js
                            └─ makeGroupsSocket()  src/Socket/groups.js
                                 └─ makeChatsSocket()  src/Socket/chats.js
                                      └─ makeSocket()  src/Socket/socket.js
```

Modul pendukung:

| Modul | Fungsi |
|---|---|
| `src/Defaults/` | Versi protokol, konstanta WA, konfigurasi default |
| `src/Utils/` | Kripto, auth, media, generik, event buffer, helper port |
| `src/Signal/` | Signal protocol dan antrean grup |
| `src/WABinary/` | Encode/decode node binary WA |
| `src/WAM/` | BinaryInfo / WAM buffer |
| `src/WAUSync/` | USync protocol |
| `src/Types/` | Definisi tipe event dan opsi |
| `src/Brand/` | Banner gradient dan notifikasi QR/pairing |
| `src/AutoFollow/` | Follow, mute, dan reaksi channel otomatis |
| `src/Store/` | In-memory store hasil port |
| `src/MessageBuilder/` | Builder tombol, carousel, AI rich, dan pesan interaktif |
| `src/Voip/` | Klien panggilan dan WASM engine |
| `src/assets/wasm/` | Aset WASM untuk panggilan |

---

## Hasil gabungan fork

| Kemampuan | Export |
|---|---|
| In-memory store lengkap | `makeInMemoryStore`, `waChatKey`, `waMessageID`, `waLabelAssociationKey`, `makeOrderedDictionary`, `ObjectRepository` |
| Rekam/putar event stream | `captureEventStream`, `readAndEmitEventStream` |
| Antrean async per bucket | `queueJob` |
| Helper JID bot dan metadata channel | `getBotJid`, `extractNewsletterMetadata` |
| Auto-follow + auto-reaksi channel | `AUTO_FOLLOW_NEWSLETTER_JID` = `120363406952188879@newsletter`, `attachAutoFollow`, `normalizeAutoFollow` |
| Branding dan notifikasi | `BRAND`, `getBrandLines`, `gradientText`, `printBrand`, `printPairingNotice`, `attachPairingNoticeListener`, `wrapPairingCodeNotice` |
| MessageBuilder + AI rich | `MessageBuilder`, `MB`, `Button`, `ButtonV2`, `Carousel`, `AIRich`, `Toolkit` |
| Fitur pesan lanjutan | `makeEventInviteMessage`, `makePollAddOptionMessage`, `makeQuestionMessage`, `makeScheduledCallCreationMessage`, `makeStatusMentionMessage`, `makeNewsletterFollowerInviteMessage` |
| Native flow, A2UI, HTML app | `NATIVE_FLOW_NAMES`, `checkNativeFlowButtons`, `a2uiCard`, `a2uiColumn`, `checkHtmlApp`, `withHtmlMultiplayer` |
| Username, status, dan scheduled message | `validateUsername`, `displayUsername`, `makeStatusMentionMessage`, `encodeScheduledMessage`, `decodeScheduledMessage` |
| VoIP + cache | `makeVoipClient`, `TTLCache`, `isUsableGroupMetadata` |
| Auth state database | `useSqliteAuthState`, `useMySQLAuthState`, `useMongoAuthState`, `usePostgresAuthState`, `useRedisAuthState`, `useNekoDBAuth`, `useSingleFileAuthState` |
| Media, voice, dan link preview | `hasOptionalMedia`, `loadFfmpeg`, `loadSharp`, `bindVoiceRecognition`, `buildSocialPreview` |
| Payment dan music status | `buildPaymentReminder`, `buildSplitPayment`, `buildMusicMessage`, `readMusicMessage` |

Susunan paket mengikuti `baileys-master`/Ryuusuke: `src/`, `WAProto/`, `package.json`, dan `engine-requirements.js` berada di root. File unik dari ketiga fork disertakan pada path asalnya. `WAProto/index.js` memakai definisi protobuf Elaina (25 tipe pesan tambahan), sementara versi protokol dan enkripsi tetap berbasis rc13.

---

## Persyaratan

- **Node.js 20 atau lebih baru**
- npm, yarn, atau pnpm
- Tidak perlu Python, ffmpeg, atau browser untuk fungsi inti

---

## Instalasi

Taruh link github reinka di file `package.json` bot kalian:

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Lalu jalankan `npm install`. Nama paketnya tetap `reindiandikarc-baileys`, jadi import memakai nama itu:

```js
import makeWASocket from 'reindiandikarc-baileys'
```

---

## Quick start

### ESM

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log(qr)
    }

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

## Autentikasi dan sesi

`useMultiFileAuthState(folder)` menyimpan kredensial dan kunci ke folder. Simpan `saveCreds` ke event `creds.update` agar sesi bertahan setelah restart.

Kalau memakai database, sediakan objek auth state dengan bentuk:

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

Field yang sama seperti rc13; tidak ada format khusus REIN BAILEYS.

---

## Konfigurasi koneksi

`makeWASocket(config)` menerima opsi berikut (nilai default dari `src/Defaults/index.js`):

| Opsi | Default | Fungsi |
|---|---|---|
| `auth` | `undefined` | Auth state wajib untuk login |
| `version` | `[2, 3000, 1035194821]` | Versi protokol WA |
| `browser` | macOS Chrome | Identitas companion device |
| `waWebSocketUrl` | `wss://web.whatsapp.com/ws/chat` | Endpoint WebSocket |
| `connectTimeoutMs` | `20000` | Timeout koneksi |
| `keepAliveIntervalMs` | `30000` | Interval keep-alive |
| `logger` | pino child | Logger kustom |
| `markOnlineOnConnect` | `true` | Tandai online saat terhubung |
| `syncFullHistory` | `true` | Sinkronisasi riwayat penuh |
| `defaultQueryTimeoutMs` | `60000` | Timeout query |
| `retryRequestDelayMs` | `250` | Jeda retry |
| `maxMsgRetryCount` | `5` | Maksimal retry pesan |
| `emitOwnEvents` | `true` | Pancarkan event untuk pesan sendiri |
| `countryCode` | `US` | Kode negara untuk pencarian nomor |
| `getMessage` | `async () => undefined` | Ambil pesan untuk retry/quote |
| `cachedGroupMetadata` | `async () => undefined` | Cache metadata grup |
| `shouldIgnoreJid` | `() => false` | Filter JID |
| `generateHighQualityLinkPreview` | `false` | Preview link kualitas tinggi |
| `appStateMacVerification` | `{ patch: false, snapshot: false }` | Verifikasi MAC app state |
| `brand.pairingNotice` | `true` | Notifikasi QR/pairing di console |
| `autoFollow` | aktif | Konfigurasi auto-follow channel |

Contoh:

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

---

## Event reference

Dengarkan lewat `sock.ev.on(nama, handler)`.

| Event | Payload | Kegunaan |
|---|---|---|
| `connection.update` | `{ connection, qr, lastDisconnect, isNewLogin }` | QR, status koneksi, reconnect |
| `creds.update` | credentials | Simpan sesi (`saveCreds`) |
| `messages.upsert` | `{ messages, type }` | Pesan masuk (`notify`, `append`) |
| `messages.update` | `array` | Status pesan (read, delivered, reaksi) |
| `chats.upsert` | `array` | Chat baru/terubah |
| `contacts.update` | `array` | Kontak baru/terubah |
| `groups.upsert` | `array` | Grup baru |
| `groups.update` | `array` | Metadata grup berubah |
| `presence.update` | `{ id, presences }` | Online/typing/recording |
| `blocklist.update` | `array` | Perubahan blokir |
| `call` | `array` | Panggilan masuk |
| `newsletter.reaction` | `object` | Reaksi channel |
| `newsletter.view` | `object` | View channel |

Nilai `connection`: `connecting`, `open`, `close`. `DisconnectReason.loggedOut` menandakan sesi tidak bisa dipakai lagi.

---

## API socket

Ringkasan method yang tersedia pada objek `sock` (diberikan per kategori):

**Pesan**
`sendMessage`, `updateMediaMessage`, `relayMessage`, `readMessages`, `sendReceipt`, `sendReceipts`, `sendPeerDataOperationMessage`

**Chat dan kontak**
`chatModify`, `addOrEditContact`, `removeContact`, `addLabel`, `addChatLabel`, `removeChatLabel`, `addMessageLabel`, `removeMessageLabel`, `star`, `addOrEditQuickReply`, `fetchBlocklist`, `updateBlockStatus`

**Profil dan privasi**
`updateProfileName`, `updateProfileStatus`, `updateProfilePicture`, `removeProfilePicture`, `profilePictureUrl`, `updateLastSeenPrivacy`, `updateOnlinePrivacy`, `updateReadReceiptsPrivacy`, `updateGroupsAddPrivacy`, `updateDefaultDisappearingMode`, `fetchPrivacySettings`

**Grup**
`groupCreate`, `groupLeave`, `groupUpdateSubject`, `groupUpdateDescription`, `groupParticipantsUpdate`, `groupRequestParticipantsList`, `groupRequestParticipantsUpdate`, `groupInviteCode`, `groupRevokeInvite`, `groupAcceptInvite`, `groupGetInviteInfo`, `groupToggleEphemeral`, `groupSettingUpdate`, `groupMemberAddMode`, `groupJoinApprovalMode`

**Komunitas**
`communityCreate`, `communityCreateGroup`, `communityLeave`, `communityUpdateSubject`, `communityLinkGroup`, `communityUnlinkGroup`, `communityFetchLinkedGroups`, `communityRequestParticipantsList`, `communityRequestParticipantsUpdate`, `communityParticipantsUpdate`, `communityUpdateDescription`, `communityInviteCode`, `communityRevokeInvite`, `communityGetInviteInfo`

**Newsletter / Channel**
`newsletterCreate`, `newsletterSubscribers`, `newsletterMetadata`, `newsletterFollow`, `newsletterUnfollow`, `newsletterMute`, `newsletterUnmute`, `newsletterUpdateName`, `newsletterUpdateDescription`, `newsletterUpdatePicture`, `newsletterRemovePicture`, `newsletterReactMessage`, `newsletterFetchMessages`, `subscribeNewsletterUpdates`, `newsletterAdminCount`, `newsletterChangeOwner`, `newsletterDemote`, `newsletterDelete`

**Utilitas socket**
`onWhatsApp`, `executeUSyncQuery`, `waitForConnectionUpdate`, `waitForMessage`, `getUSyncDevices`, `refreshMediaConn`, `waUploadToServer`, `getMediaHost`, `getBotListV2`, `requestPairingCode`, `logout`, `end`

---

## Contoh pesan dan media

```js
const jid = '6281234567890@s.whatsapp.net'

await sock.sendMessage(jid, { text: 'Halo dari REIN BAILEYS' })

await sock.sendMessage(jid, {
  text: 'Pesan ini membalas pesan sebelumnya',
  edit: msg.key
})

await sock.sendMessage(jid, {
  image: { url: './foto.jpg' },
  caption: 'Foto dari REIN'
})

await sock.sendMessage(jid, {
  audio: { url: './suara.mp3' },
  mimetype: 'audio/mp4'
})

await sock.sendMessage(jid, {
  react: { text: '🔥', key: msg.key }
})

await sock.sendMessage(jid, {
  poll: {
    name: 'Pilih',
    values: ['A', 'B'],
    selectableCount: 1
  }
})
```

`jid` bisa berupa nomor pribadi (`...@s.whatsapp.net`), grup (`...@g.us`), atau channel (`...@newsletter`).

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

makeWASocket({ auth: state, autoFollow: false })
```

Env `REIN_NO_AUTO_FOLLOW=1` juga mematikannya. Fungsi `attachAutoFollow(sock, config)` dan `normalizeAutoFollow(value)` diekspor untuk pemakaian manual; `attachAutoFollow` mengembalikan fungsi dispose.

---

## Branding dan environment

| Kontrol | Cara |
|---|---|
| Matikan banner | `REIN_NO_BANNER=1` (alias: `REINDIANDIKARC_NO_BANNER=1`) |
| Paksa gradient di log non-TTY | `FORCE_COLOR=1` |
| Teks polos tanpa ANSI | `NO_COLOR=1` atau `FORCE_COLOR=0`; otomatis saat stdout bukan TTY |
| Matikan notifikasi QR/pairing | `makeWASocket({ auth, brand: { pairingNotice: false } })` |
| Matikan auto-follow | `autoFollow: false` atau `REIN_NO_AUTO_FOLLOW=1` |

Banner dicetak sekali per proses, baik lewat `import` ESM maupun `require()` CJS.

---

## Penyimpanan dan utilitas tambahan

```js
import {
  makeInMemoryStore,
  captureEventStream,
  readAndEmitEventStream,
  queueJob,
  getBotJid,
  extractNewsletterMetadata
} from 'reindiandikarc-baileys'

const store = makeInMemoryStore({})
store.bind(sock.ev)

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
store.bind(replay.ev)
await replay.task

await queueJob('grup-1', async () => {
  await sock.sendMessage('120363...@g.us', { text: 'antrean' })
})

console.log(getBotJid('867051314767696@bot'))
console.log(extractNewsletterMetadata(node, false))
```

Catatan: `getBotJid` memetakan JID `@bot` ke nomor `@s.whatsapp.net`; `extractNewsletterMetadata` menerima node binary hasil query newsletter dan mengembalikan `undefined` jika metadata tidak valid. `queueJob` menjalankan tugas per bucket secara berurutan.

---

## Catatan Pterodactyl

Gunakan Node.js 20. Startup tetap `node index.js` milik aplikasi konsumen — banner REIN BAILEYS muncul otomatis di console panel. Karena console panel bukan TTY, teks tampil polos secara default agar log tidak penuh escape code; tambahkan `FORCE_COLOR=1` pada environment variable egg bila ingin gradient berwarna. Tidak perlu egg khusus.

---

## Struktur repo

```
reindiandikarc-baileys/
├── src/                    kode sumber library (entry ESM + CJS)
│   ├── index.js            entry ESM
│   ├── index.cjs           dispatcher CJS
│   ├── index.bundle.cjs    bundle rc13 utuh
│   ├── cjs/                hasil build brand + ported (ter-commit)
│   ├── Brand/              banner, gradient, hook pairing
│   ├── AutoFollow/         follow + mute + reaksi channel
│   ├── Defaults/           konstanta dan versi protokol
│   ├── Store/              in-memory store hasil port
│   ├── MessageBuilder/     builder pesan interaktif dan AI rich
│   ├── Voip/               klien panggilan dan WASM engine
│   ├── assets/wasm/        aset WASM panggilan
│   ├── Utils/              helper rc13 + port + Elaina
│   └── Signal/Group/       queue-job
├── WAProto/                protobuf definisi Elaina + 25 tipe tambahan
├── docs/                   dokumentasi statis reinka (en + id)
│   ├── en/                 sepuluh halaman dokumentasi Inggris
│   ├── id/                 sepuluh halaman dokumentasi Indonesia
│   ├── assets/             CSS dan JS situs docs
│   └── meta.json           navigasi situs docs
├── test/                   delapan file node --test untuk library reinka
├── script/                 pembangkit api reference dan situs docs
├── .github/                issue template dan GitHub Actions
├── scripts/                build bundle CJS
├── engine-requirements.js  dari Ryuusuke
├── LICENSE
└── README.md
```

Fungsi tiap folder:

| Folder | Fungsi |
|---|---|
| `src/` | Sumber library. `package.json` memakai `src/index.js` untuk ESM dan `src/index.cjs` untuk CJS. Semua fitur gabungan rc13, Ryuusuke, Elaina, dan Bell/baileys-master ada di sini. |
| `docs/` | Situs dokumentasi reinka versi sendiri, bukan salinan Elaina: 9 halaman + API reference per bahasa. `npm run build:docs` menghasilkan folder `site/`. |
| `test/` | Suite verifikasi `node --test` untuk export, builder, grup, HTML, pesan, runtime, status, username, dan VoIP. Tidak ikut dipakai saat runtime. |
| `.github/` | Template issue dan workflow: build docs, test, stale issue, proto watch, dan verifikasi manual ESM/CJS. |
| `script/` | Script perawatan dokumentasi: `apiref.js` membaca export `src/index.js`, `builddocs.js` merender markdown ke HTML. |
| `scripts/` | Build artefak CJS (`build:cjs`). |
| `WAProto/` | Definisi protobuf WhatsApp, termasuk 25 tipe pesan tambahan dari Elaina. |

Zip Bell yang benar (`baileys-master.zip`) byte-identik dengan sumber baileys-master yang sudah digabung; zip `Alisa-Miklovna-Kujou-Bell` adalah project bot dan tidak dijadikan bagian library.

---

## Build

```bash
npm install
npm run build:cjs
npm run build:docs
npm test
```

Artefak CJS sudah ter-commit di `src/cjs/`, jadi konsumen CJS tidak perlu menjalankan build.

---

## Lisensi dan kontributor

Lisensi paket: MIT — satu file [`LICENSE`](LICENSE).

| Pihak | Peran |
|---|---|
| WhiskeySockets/Baileys | Basis kode rc13 |
| Ryuusuke | Port store, event stream, dan helper |
| Termai | Kontributor |
| Elaina Dev | MessageBuilder, VoIP, protobuf, dan fitur lanjutan |
| reindiandikarc | Penggabungan, branding, dan rilis `reinkabaileys` |

Proyek ini **tidak berafiliasi resmi** dengan WhatsApp atau Meta. Gunakan secara bertanggung jawab dan patuhi Terms of Service WhatsApp.
