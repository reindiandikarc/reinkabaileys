# reindiandikarc-baileys Merge & Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghasilkan satu paket library Baileys `reindiandikarc-baileys` yang menggabungkan seluruh kemampuan tiga fork sumber, bebas bug import ESM/CJS, dengan identitas visual "REINDIANDIKARC BAILEYS" yang tampil di Pterodactyl/terminal, serta API pairing dan messaging yang tetap kompatibel dengan rc13.

**Architecture:** Paket dibangun di atas `reindiandikarcbaileys-main` (rc13, ESM). Folder `Default` diperbaiki menjadi `Defaults` memakai referensi `baileys-master`. File unik `ryuuxalya` yang aman di-port dikonversi CJS→ESM; file yang lebih rendah mutunya tidak disalin dan dicatat di `PORT_MANIFEST.md`. Bundle CJS lama dipertahankan utuh sebagai `index.bundle.cjs`, dengan dispatcher baru yang menggabungkan export lama, brand, dan helper port.

**Tech Stack:** Node.js `>=20.0.0`, ESM + CJS, `node:test` (tanpa framework), `esbuild` (devDependency, hanya untuk CJS potongan baru), `ws`, `@adiwajshing/keyed-db`.

**Spec:** `docs/superpowers/specs/2026-11-23-reindiandikarc-baileys-merge-design.md`

## Global Constraints

- Nama paket: `reindiandikarc-baileys`, versi `7.0.0-rc13.1`, `"type": "module"`, `"main": "lib/index.cjs"`, `"module": "lib/index.js"`.
- Node minimum: `>=20.0.0`. Tidak ada `preinstall` yang memanggil `process.exit`.
- Path konfigurasi harus `lib/Defaults/` (plural) di semua import; dilarang kembali ke `lib/Default/`.
- Brand exports tetap: `BRAND`, `getBrandLines`, `gradientText`, `printBrand`, `printPairingNotice`.
- Brand hooks: `attachPairingNoticeListener`, `wrapPairingCodeNotice`.
- Auto-print sekali per proses; env mati: `REINDIANDIKARC_NO_BANNER=1`; fallback plain: `NO_COLOR` atau `FORCE_COLOR=0`.
- Config socket: `brand.pairingNotice` default `true`; `false` mematikan notifikasi.
- Palette gradient: `#ff4d8d → #a855f7 → #22d3ee`; lebar kotak 60 karakter.
- Dilarang menambah `@levvicode/libsignal-node`, `levvleys`, `chalk`, `gradient-string`, `qrcode-terminal`, `libphonenumber-js`.
- `libsignal` tetap `git+https://github.com/whiskeysockets/libsignal-node`.
- Dilarang membuat bot, command handler, starter bot, atau file yang membalas pesan otomatis.
- Semua perilaku rc13 (nilai kembalian `requestPairingCode`, event `connection.update`, enkripsi/protokol) harus tetap sama.

## Review Focus

- **`Default` vs `Defaults` pada import ESM** — pengguna mengharapkan `import 'reindiandikarc-baileys'` langsung sukses; diuji Task 1 dengan import ESM nyata.
- **ANSI pada Pterodactyl non-TTY / `NO_COLOR`** — pengguna mengharapkan teks terbaca tanpa escape code berantakan; diuji Task 2 dengan stdout capture.
- **`require()` CJS kehilangan export baru / mismatch dengan ESM** — pengguna CommonJS mengharapkan API yang sama; diuji Task 6 dengan perbandingan nama export.
- **`requestPairingCode` berubah nilai kembalian atau banner ganda** — pengguna mengharapkan kode sama persis seperti rc13; diuji Task 5 dengan wrapper test.
- **Dependency lama ryuuxalya merusak install/protokol** — pengguna mengharapkan `npm install` bersih dan enkripsi rc13; diuji Task 4 + Task 7 dengan dependency audit dan port manifest.

---

## File Structure

```text
reindiandikarc-baileys/
├── docs/superpowers/specs/...design.md        (sudah ada)
├── docs/superpowers/plans/...merge.md          (file ini)
├── lib/
│   ├── index.js                               ESM entry (modifikasi)
│   ├── index.cjs                              CJS dispatcher baru
│   ├── index.bundle.cjs                       bundle rc13 utuh (dipindahkan)
│   ├── ported-exports.js                      agregator export hasil port
│   ├── Brand/
│   │   ├── index.js                           brand + gradient + banner
│   │   └── hooks.js                           pairing notice hooks
│   ├── cjs/
│   │   ├── brand.cjs                          hasil build esbuild
│   │   └── ported.cjs                         hasil build esbuild
│   ├── Store/                                 port dari ryuuxalya (ESM)
│   ├── Utils/
│   │   ├── levvleys-event-stream.js           port (ESM)
│   │   └── ryuu-compat.js                     helper selektif
│   ├── Signal/Group/queue-job.js              port (ESM)
│   └── Defaults/                              hasil rename dari Default/
├── test/
│   ├── brand.test.js
│   ├── store.test.js
│   ├── ported.test.js
│   ├── socket.test.js
│   └── api.test.js
├── licenses/                                  salinan lisensi pihak ketiga
├── PORT_MANIFEST.md
├── THIRD_PARTY_NOTICES.md
├── README.md
└── package.json
```

---

### Task 1: Fondasi paket & perbaikan import ESM

**Files:**
- Create: `/data/workspace/reindiandikarc-baileys/` (dari copy sumber)
- Modify: `lib/Default/` → `lib/Defaults/`, `package.json`
- Create: `PORT_MANIFEST.md` (skeleton), `.gitignore`
- Test: `test/api.test.js` (bagian ESM import)

**Interfaces:**
- Produces: direktori paket dengan ESM import yang sukses; `PORT_MANIFEST.md` berisi tabel `file | keputusan | alasan | padanan rc13`.

- [ ] **Step 1: Salin basis dan inisialisasi git**

```bash
cd /data/workspace/reindiandikarc-baileys
cp -a /data/workspace/reindiandikarc-analysis/reindiandikarcbaileys-main/. .
mv lib/Default lib/Defaults
git init -q
```

Buat juga `PORT_MANIFEST.md` berisi header tabel dan `.gitignore` berisi `node_modules/`, `auth_info*/`, `*.log`. Hasil build `lib/cjs/*.cjs` **tetap di-commit** agar instalasi dari GitHub langsung bisa `require()` tanpa menjalankan build.

Expected: `lib/Defaults/index.js` dan `lib/Defaults/baileys-version.json` ada; tidak ada `lib/Default/`; kedua file skeleton ada.

- [ ] **Step 2: Tulis `package.json`**

Gunakan nilai persis:

```json
{
  "name": "reindiandikarc-baileys",
  "version": "7.0.0-rc13.1",
  "description": "Lightweight pure JavaScript WhatsApp Web API library — reindiandikarc edition",
  "type": "module",
  "main": "lib/index.cjs",
  "module": "lib/index.js",
  "exports": {
    ".": { "import": "./lib/index.js", "require": "./lib/index.cjs" },
    "./*": "./*"
  },
  "engines": { "node": ">=20.0.0" },
  "license": "MIT",
  "scripts": {
    "check": "node --test test/*.test.js",
    "test": "npm run check",
    "build:cjs": "node scripts/build-cjs.mjs"
  },
  "dependencies": {
    "@adiwajshing/keyed-db": "^0.2.4",
    "@cacheable/node-cache": "^1.4.0",
    "@hapi/boom": "^9.1.3",
    "async-mutex": "^0.5.0",
    "dotenv": "^17.2.3",
    "libsignal": "git+https://github.com/whiskeysockets/libsignal-node",
    "lru-cache": "^11.1.0",
    "music-metadata": "^11.12.3",
    "p-queue": "^9.0.0",
    "pino": "^9.6",
    "protobufjs": "^7.5.6",
    "whatsapp-rust-bridge": "0.5.4",
    "ws": "^8.13.0"
  },
  "optionalDependencies": {
    "audio-decode": "^2.1.3",
    "fflate": "^0.8.3",
    "file-type": "^22.3.0",
    "form-data": "^4.0.6",
    "jimp": "^0.22.12",
    "link-preview-js": "^3.0.0",
    "sharp": "^0.34.1"
  },
  "devDependencies": {
    "esbuild": "^0.25.0"
  }
}
```

Expected: tidak ada `@levvicode/*` maupun `levvleys`.

- [ ] **Step 3: Tulis test import ESM**

`test/api.test.js` (bagian pertama):

```js
import test from 'node:test'
import assert from 'node:assert/strict'

test('ESM entry imports without module resolution errors', async () => {
  const mod = await import('../lib/index.js')
  assert.equal(typeof mod.makeWASocket, 'function')
  assert.equal(typeof mod.default, 'function')
  assert.equal(typeof mod.useMultiFileAuthState, 'function')
  assert.equal(typeof mod.DisconnectReason, 'object')
})
```

- [ ] **Step 4: Jalankan test dan pastikan lolos**

Run: `node --test test/api.test.js`
Expected: PASS (sebelum perbaikan akan `ERR_MODULE_NOT_FOUND`).

- [ ] **Step 5: Install dependency**

Run: `npm install`
Expected: sukses; `npm ls @levvicode/libsignal-node levvleys` mengembalikan Kosong `(empty)`.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: bootstrap reindiandikarc-baileys and fix Defaults import path"
```

---

### Task 2: Modul brand — gradient, banner, fallback warna

**Files:**
- Create: `lib/Brand/index.js`, `test/brand.test.js`

**Interfaces:**
- Consumes: tidak ada.
- Produces:
  - `BRAND` — objek `{ name, version, palette, boxWidth }`.
  - `gradientText(text: string, palette?: string[]): string`
  - `getBrandLines(options?: { compact?: boolean }): string[]`
  - `printBrand(options?: { stream?: NodeJS.WritableStream }): boolean`
  - `printPairingNotice(input: { qr?: string; pairingCode?: string; stream?: NodeJS.WritableStream }): void`

- [ ] **Step 1: Tulis test brand (failing)**

`test/brand.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { BRAND, gradientText, getBrandLines, printBrand, printPairingNotice } from '../lib/Brand/index.js'

test('brand constants match spec', () => {
  assert.equal(BRAND.name, 'REINDIANDIKARC BAILEYS')
  assert.equal(BRAND.version, '7.0.0-rc13.1')
  assert.equal(BRAND.boxWidth, 60)
})

test('gradientText emits truecolor ANSI per character', () => {
  const out = gradientText('AB')
  assert.match(out, /\x1b\[38;2;\d+;\d+;\d+m/)
  assert.match(out, /\x1b\[0m$/)
})

test('getBrandLines has fixed width and brand text', () => {
  const lines = getBrandLines()
  assert.equal(lines.length, 6)
  assert.ok(lines[1].includes('R E I N D I A N D I K A R C'))
  assert.ok(lines.every(line => line.length >= 50))
})

test('NO_COLOR disables ANSI', () => {
  const prev = process.env.NO_COLOR
  process.env.NO_COLOR = '1'
  try {
    assert.equal(gradientText('AB'), 'AB')
  } finally {
    if (prev === undefined) delete process.env.NO_COLOR
    else process.env.NO_COLOR = prev
  }
})

test('printBrand writes once per process', () => {
  const stream = new PassThrough()
  let output = ''
  stream.on('data', chunk => { output += chunk })
  assert.equal(printBrand({ stream }), true)
  assert.equal(printBrand({ stream }), false)
  assert.match(output, /REINDIANDIKARC/)
})

test('printPairingNotice shows pairing code', () => {
  const stream = new PassThrough()
  let output = ''
  stream.on('data', chunk => { output += chunk })
  printPairingNotice({ pairingCode: 'A1B2-C3D4', stream })
  assert.match(output, /PAIRING CODE/)
  assert.match(output, /A1B2-C3D4/)
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal karena modul belum ada**

Run: `node --test test/brand.test.js`
Expected: FAIL `ERR_MODULE_NOT_FOUND .../lib/Brand/index.js`.

- [ ] **Step 3: Implementasi `lib/Brand/index.js`**

Syarat implementasi:
- `palette` = `['#ff4d8d', '#a855f7', '#22d3ee']` dikonversi ke RGB `[255,77,141] → [168,85,247] → [34,211,238]`.
- Interpolasi linear antar stop warna, dibulatkan, untuk tiap karakter; bangun `\x1b[38;2;r;g;bm<char>`, akhiri `\x1b[0m`.
- Jika `NO_COLOR` ter-set atau `FORCE_COLOR === '0'`, kembalikan teks apa adanya tanpa ANSI.
- `getBrandLines()` menghasilkan tepat 6 baris dengan lebar `BRAND.boxWidth`: top border `╭...╮`, judul `REINDIANDIKARC BAILEYS` dengan spasi antar huruf, separator `├...┤`, dua baris tagline (`Fork rc13 · ESM + CJS · Multi-Device` dan `v7.0.0-rc13.1 · WhiskeySockets × Ryuuxalya`), bottom border `╰...╯`.
- `printBrand` memakai guard `globalThis.__REINDIANDIKARC_BAILEYS_BANNER__`; kembalikan `true` hanya pada pemanggilan pertama; kembalikan `false` jika env `REINDIANDIKARC_NO_BANNER=1` (dan tetap menandai guard agar tidak dicetak nanti).
- `printPairingNotice` mencetak satu baris `◆ REINDIANDIKARC • PAIRING CODE  <code>  ◆` bila `pairingCode` ada, atau `◆ REINDIANDIKARC • QR READY  ◆` bila hanya `qr` ada; tidak mencetak isi QR.

- [ ] **Step 4: Jalankan test, pastikan lolos**

Run: `node --test test/brand.test.js`
Expected: PASS (6/6).

- [ ] **Step 5: Ekspor brand dari entry ESM dan aktifkan auto-print**

Di `lib/index.js`, setelah `import makeWASocket from './Socket/index.js';`, tambahkan:

```js
import { printBrand } from './Brand/index.js';
printBrand();
export * from './Brand/index.js';
```

Expected: mengimpor paket mencetak banner tepat sekali; `import` tetap sukses.

- [ ] **Step 6: Commit**

```bash
git add lib/Brand lib/index.js test/brand.test.js && git commit -m "feat: add reindiandikarc brand banner and gradient utilities"
```

---

### Task 3: Port Store subsystem dari ryuuxalya

**Files:**
- Create: `lib/Store/index.js`, `lib/Store/make-in-memory-store.js`, `lib/Store/make-ordered-dictionary.js`, `lib/Store/object-repository.js`, `lib/ported-exports.js`, `test/store.test.js`
- Modify: `lib/index.js`

**Interfaces:**
- Consumes: `makeWASocket` rc13 (tidak diubah), `proto` dari `WAProto/index.js`, `Defaults`, `WABinary`, `Utils`.
- Produces:
  - `makeInMemoryStore(config?) => Store`
  - `waChatKey`, `waMessageID`, `waLabelAssociationKey`
  - `makeOrderedDictionary(...)` (default export)
  - `ObjectRepository`
  - `lib/ported-exports.js` mengekspor ulang semuanya.

- [ ] **Step 1: Tulis test store (failing)**

`test/store.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import makeInMemoryStore, { waChatKey, waMessageID } from '../lib/Store/index.js'
import makeOrderedDictionary from '../lib/Store/make-ordered-dictionary.js'
import { ObjectRepository } from '../lib/Store/object-repository.js'

test('store exposes expected methods', () => {
  const store = makeInMemoryStore()
  for (const key of ['chats','contacts','messages','groupMetadata','presences','bind','loadMessage','toJSON','fromJSON','writeToFile','readFromFile']) {
    assert.equal(typeof store[key], 'function', `missing ${key}`)
  }
})

test('ordered dictionary stores and retrieves', () => {
  const dict = makeOrderedDictionary()
  dict.set('a', { id: 'a' })
  assert.equal(dict.get('a').id, 'a')
})

test('object repository basic operations', () => {
  const repo = new ObjectRepository()
  assert.ok(repo)
})

test('store key helpers exist', () => {
  assert.equal(typeof waChatKey, 'function')
  assert.equal(typeof waMessageID, 'function')
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `node --test test/store.test.js`
Expected: FAIL `ERR_MODULE_NOT_FOUND .../lib/Store/index.js`.

- [ ] **Step 3: Konversi file Store ke ESM**

Sumber: `/data/workspace/reindiandikarc-analysis/ryuuxalya-main/lib/Store/*.js`.

Aturan konversi:
- Hapus shim `__importDefault`, `__createBinding`, `__exportStar`; ganti dengan `import`/`export` ESM.
- Tambahkan ekstensi `.js` pada semua relative import.
- `require('../../WAProto')` → `import { proto } from '../../WAProto/index.js'`.
- `require('../Defaults')` → `import { ... } from '../Defaults/index.js'`.
- `require('@adiwajshing/keyed-db').default` di dalam function → `import KeyedDB from '@adiwajshing/keyed-db'` di top-level; bila bentuk ekspor paket berbeda, gunakan `createRequire(import.meta.url)` hanya untuk paket ini.
- `require('fs')` di dalam function → `import fs from 'node:fs'` di top-level.
- Pertahankan API dan perilaku `makeInMemoryStore` (method list sesuai test), jangan mengubah logika penyimpanan.

- [ ] **Step 4: Buat `lib/ported-exports.js` dan update `lib/index.js`**

`lib/ported-exports.js`:

```js
export * from './Store/index.js'
export { waChatKey, waMessageID, waLabelAssociationKey } from './Store/make-in-memory-store.js'
export { default as makeOrderedDictionary } from './Store/make-ordered-dictionary.js'
export { ObjectRepository } from './Store/object-repository.js'
```

Tambahkan di `lib/index.js` sebelum export default:

```js
export * from './ported-exports.js'
```

- [ ] **Step 5: Jalankan test, pastikan lolos**

Run: `node --test test/store.test.js`
Expected: PASS (4/4).

- [ ] **Step 6: Commit**

```bash
git add lib/Store lib/ported-exports.js lib/index.js test/store.test.js && git commit -m "feat: port ryuuxalya in-memory store as ESM"
```

---

### Task 4: Port event stream, queue job, helper selektif, dan manifest

**Files:**
- Create: `lib/Utils/levvleys-event-stream.js`, `lib/Signal/Group/queue-job.js`, `lib/Utils/ryuu-compat.js`, `test/ported.test.js`
- Modify: `lib/ported-exports.js`, `PORT_MANIFEST.md`

**Interfaces:**
- Consumes: `delay`/`makeMutex` dari `lib/Utils/generics.js` dan `lib/Utils/make-mutex.js` jika ada; `getBinaryNodeChild` dari `WABinary`.
- Produces:
  - `captureEventStream(...)`, `readAndEmitEventStream(...)`
  - `queueJob(task: () => Promise<T>): Promise<T>` (default export)
  - `getBotJid(id: string): string | undefined`
  - `extractNewsletterMetadata(node): object | undefined`

- [ ] **Step 1: Tulis test (failing)**

`test/ported.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import queueJob from '../lib/Signal/Group/queue-job.js'
import { captureEventStream, readAndEmitEventStream } from '../lib/Utils/levvleys-event-stream.js'
import { getBotJid, extractNewsletterMetadata } from '../lib/Utils/ryuu-compat.js'

test('queueJob serializes async tasks', async () => {
  const order = []
  await Promise.all([
    queueJob(async () => { order.push(1) }),
    queueJob(async () => { order.push(2) })
  ])
  assert.deepEqual(order.sort(), [1, 2])
})

test('event stream helpers are functions', () => {
  assert.equal(typeof captureEventStream, 'function')
  assert.equal(typeof readAndEmitEventStream, 'function')
})

test('getBotJid returns a JID for a known bot id', () => {
  assert.match(getBotJid('3935629188') || '', /@/)
})

test('extractNewsletterMetadata is callable', () => {
  assert.equal(typeof extractNewsletterMetadata, 'function')
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `node --test test/ported.test.js`
Expected: FAIL `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementasi file port**

Aturan:
- `queue-job.js`: konversi CJS→ESM, ekspor default `queueJob`, tanpa dependency tambahan. Pastikan antrean benar-benar serial (satu task berjalan setelah previous selesai).
- `levvleys-event-stream.js`: konversi CJS→ESM; `require('events')`, `fs`, `fs/promises`, `readline` → `node:` specifier; ganti import `./generics` dan `./make-mutex` ke path rc13 yang setara; hapus shim CJS.
- `ryuu-compat.js`: salin hanya `getBotJid` dari `WABinary/jid-utils.js` dan `extractNewsletterMetadata` dari `Socket/newsletter.js` ryuuxalya; buang `console.log` debug; sesuaikan import ke rc13; jangan menarik `axios`, `jimp`, `sharp`, atau `ffmpeg`.

- [ ] **Step 4: Update `lib/ported-exports.js`**

Tambahkan:

```js
export { captureEventStream, readAndEmitEventStream } from './Utils/levvleys-event-stream.js'
export { default as queueJob } from './Signal/Group/queue-job.js'
export { getBotJid, extractNewsletterMetadata } from './Utils/ryuu-compat.js'
```

- [ ] **Step 5: Lengkapi `PORT_MANIFEST.md`**

Buat tabel dengan satu baris untuk setiap item yang **tidak** di-port: `lib/Utils/link-preview.js`, `lib/Utils/message-retry-manager.js`, `lib/Utils/validate-connection.js`, `lib/Utils/browser-utils.js`, `lib/Socket/usync.js`, `lib/Signal/Group/*` selain `queue-job.js`, `lib/WAUSync/Protocols/*`, `lib/Socket/Client/*`, `lib/Defaults/levvleys-version.json`, `engine-requirements.js`, `WAProto/index.d.ts`, `lib/tes.txt`, artefak `Tes`/`tes`. Kolom: `file sumber | keputusan | alasan | padanan rc13`. Contoh alasan: "rc13 lebih baru & sudah terintegrasi", "berisiko menurunkan protokol", "arikon kosong", "dependency security holding".

- [ ] **Step 6: Jalankan test, pastikan lolos**

Run: `node --test test/ported.test.js`
Expected: PASS (4/4).

- [ ] **Step 7: Commit**

```bash
git add lib test/ported.test.js PORT_MANIFEST.md && git commit -m "feat: port safe ryuuxalya helpers and document exclusions"
```

---

### Task 5: Pasang branding pada alur pairing socket

**Files:**
- Create: `lib/Brand/hooks.js`, `test/socket.test.js`
- Modify: `lib/Socket/socket.js`

**Interfaces:**
- Consumes: `printPairingNotice` dari Task 2.
- Produces:
  - `attachPairingNoticeListener(ev: EventEmitter, config?: object, stream?: NodeJS.WritableStream): () => void`
  - `wrapPairingCodeNotice(fn: Function, config?: object, stream?: NodeJS.WritableStream): Function`

- [ ] **Step 1: Tulis test hooks (failing)**

`test/socket.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { attachPairingNoticeListener, wrapPairingCodeNotice } from '../lib/Brand/hooks.js'

test('QR event prints branded notice once', () => {
  const ev = new EventEmitter()
  const stream = new PassThrough()
  let output = ''
  stream.on('data', c => { output += c })
  const dispose = attachPairingNoticeListener(ev, { brand: {} }, stream)
  ev.emit('connection.update', { qr: '2@ABCDEFG' })
  ev.emit('connection.update', { qr: '2@ABCDEFG' })
  dispose()
  assert.match(output, /QR READY/)
  assert.equal(output.split('QR READY').length - 1, 1)
})

test('config opt-out disables notice', () => {
  const ev = new EventEmitter()
  const stream = new PassThrough()
  let output = ''
  stream.on('data', c => { output += c })
  attachPairingNoticeListener(ev, { brand: { pairingNotice: false } }, stream)
  ev.emit('connection.update', { qr: 'x' })
  assert.equal(output, '')
})

test('wrapPairingCodeNotice preserves return value', async () => {
  const stream = new PassThrough()
  let output = ''
  stream.on('data', c => { output += c })
  const original = async () => 'A1B2-C3D4'
  const wrapped = wrapPairingCodeNotice(original, { brand: {} }, stream)
  assert.equal(await wrapped('6281234567890'), 'A1B2-C3D4')
  assert.match(output, /A1B2-C3D4/)
})
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `node --test test/socket.test.js`
Expected: FAIL `ERR_MODULE_NOT_FOUND .../lib/Brand/hooks.js`.

- [ ] **Step 3: Implementasi `lib/Brand/hooks.js`**

Syarat:
- `attachPairingNoticeListener(ev, config, stream)` mendengarkan `connection.update`; hanya bereaksi bila `update.qr` truthy; memanggil `printPairingNotice({ qr: update.qr, stream })`; mengembalikan fungsi `dispose` yang menghapus listener.
- `config.brand?.pairingNotice === false` → tidak memasang listener sama sekali.
- `wrapPairingCodeNotice(fn, config, stream)` mengembalikan async function yang memanggil `fn(...args)`, lalu `printPairingNotice({ pairingCode: code, stream })` bila diizinkan, lalu `return code` apa adanya. Jangan mengubah argumen atau melempar error baru.
- Tambahkan `export * from './hooks.js';` ke `lib/Brand/index.js` agar hook ikut tersedia sebagai export paket.

- [ ] **Step 4: Hubungkan ke `lib/Socket/socket.js`**

- Import `{ attachPairingNoticeListener, wrapPairingCodeNotice }` dari `../Brand/hooks.js`.
- Setelah `requestPairingCode` didefinisikan, pasang:
  - `const disposeBranding = attachPairingNoticeListener(ev, config)`
  - `const brandedRequestPairingCode = wrapPairingCodeNotice(requestPairingCode, config)`
- Pada object yang di-return (baris yang memuat `requestPairingCode,`), ganti menjadi `requestPairingCode: brandedRequestPairingCode,` — jangan mengubah nama property lain.
- Simpan `disposeBranding` pada closure `end`/close handler agar listener dilepas saat socket ditutup; jika analisis menunjukkan risiko, cukup biarkan listener mengikuti lifetime socket (tidak boleh menyebabkan duplikat banner).

- [ ] **Step 5: Jalankan test hooks**

Run: `node --test test/socket.test.js`
Expected: PASS (3/3).

- [ ] **Step 6: Smoke test socket dengan WS lokal**

Tambahkan test ke `test/socket.test.js`:

```js
test('makeWASocket constructs and emits connecting without exception', async () => {
  const { WebSocketServer } = await import('ws')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const makeWASocket = (await import('../lib/index.js')).default
  const { useMultiFileAuthState } = await import('../lib/index.js')
  const dir = await mkdtemp(join(tmpdir(), 'reindi-auth-'))
  const wss = new WebSocketServer({ port: 0 })
  await new Promise(resolve => wss.once('listening', resolve))
  const port = wss.address().port
  try {
    const { state, saveCreds } = await useMultiFileAuthState(dir)
    const sock = makeWASocket({
      auth: state,
      waWebSocketUrl: `ws://127.0.0.1:${port}`,
      connectTimeoutMs: 1500,
      brand: { pairingNotice: false }
    })
    sock.ev.on('creds.update', saveCreds)
    const connected = await new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 1200)
      sock.ev.on('connection.update', u => {
        if (u.connection === 'connecting') { clearTimeout(timer); resolve(true) }
      })
    })
    assert.equal(connected, true)
    sock.ws?.close?.()
  } finally {
    await new Promise(resolve => wss.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})
```

Run: `node --test test/socket.test.js`
Expected: PASS (4/4). Tidak ada kredensial tersimpan setelah test.

- [ ] **Step 7: Commit**

```bash
git add lib/Brand/hooks.js lib/Socket/socket.js test/socket.test.js && git commit -m "feat: wire branded QR and pairing-code notices into socket"
```

---

### Task 6: CJS dispatcher dan parity export

**Files:**
- Create: `scripts/build-cjs.mjs`, `lib/index.cjs` (baru), `lib/cjs/` (hasil build), `test/api.test.js` (bagian CJS)
- Modify: `lib/index.cjs` lama → `lib/index.bundle.cjs`

**Interfaces:**
- Consumes: `lib/ported-exports.js`, `lib/Brand/index.js`, bundle lama.
- Produces: `require('reindiandikarc-baileys')` mengembalikan gabungan export ESM + brand + ported; `default` tetap `makeWASocket`.

- [ ] **Step 1: Pindahkan bundle lama**

```bash
mv lib/index.cjs lib/index.bundle.cjs
```

Expected: file `lib/index.bundle.cjs` berukuran ~7.5 MB dan tidak diubah isinya.

- [ ] **Step 2: Tulis `scripts/build-cjs.mjs`**

Syarat:
- Memakai `esbuild.build` dua kali:
  - entry `lib/Brand/index.js` → `lib/cjs/brand.cjs`
  - entry `lib/ported-exports.js` → `lib/cjs/ported.cjs`
- Keduanya: `bundle: true`, `platform: 'node'`, `format: 'cjs'`, `packages: 'external'`, `target: 'node20'`.
- Script harus mkdir `lib/cjs` bila belum ada dan mencetak ringkasan ke stdout.

- [ ] **Step 3: Tulis dispatcher `lib/index.cjs`**

```js
'use strict'

const core = require('./index.bundle.cjs')
const brand = require('./cjs/brand.cjs')
const ported = require('./cjs/ported.cjs')

const api = { ...core, ...ported, ...brand }
api.default = core.default || core.makeWASocket

module.exports = api
```

Expected: tidak ada `require` relative lain selain tiga di atas.

- [ ] **Step 4: Build dan jalankan test CJS**

Tambahkan ke `test/api.test.js`:

```js
import { execFileSync } from 'node:child_process'

test('CommonJS entry exposes core, brand and ported exports', () => {
  const script = `
    const api = require('./lib/index.cjs')
    const required = ['makeWASocket','useMultiFileAuthState','DisconnectReason','BRAND','getBrandLines','gradientText','printBrand','printPairingNotice','makeInMemoryStore','attachPairingNoticeListener','wrapPairingCodeNotice']
    const missing = required.filter(k => !api[k])
    if (missing.length) { console.error('MISSING:' + missing.join(',')); process.exit(1) }
    if (typeof api.default !== 'function') { console.error('NO_DEFAULT'); process.exit(1) }
  `
  execFileSync(process.execPath, ['-e', script], { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe' })
})
```

Run: `npm run build:cjs && node --test test/api.test.js`
Expected: PASS (2/2), tidak ada `MISSING`/`NO_DEFAULT`.

- [ ] **Step 5: Bandingkan nama export ESM vs CJS**

Tambahkan test:

```js
test('ESM and CJS export name sets agree on required keys', async () => {
  const esm = await import('../lib/index.js')
  const script = `process.stdout.write(JSON.stringify(Object.keys(require('./lib/index.cjs')).sort()))`
  const out = execFileSync(process.execPath, ['-e', script], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' })
  const keys = new Set(JSON.parse(out))
  for (const key of ['makeWASocket','useMultiFileAuthState','DisconnectReason','BRAND','printBrand','printPairingNotice','makeInMemoryStore','queueJob','getBotJid']) {
    assert.ok(key in esm, `ESM missing ${key}`)
    assert.ok(keys.has(key), `CJS missing ${key}`)
  }
})
```

Run: `node --test test/api.test.js`
Expected: PASS (3/3).

- [ ] **Step 6: Commit**

```bash
git add scripts lib/index.cjs lib/index.bundle.cjs lib/cjs test/api.test.js package.json && git commit -m "feat: add CJS dispatcher with brand and ported exports"
```

---

### Task 7: Dokumentasi, atribusi, dan verifikasi akhir

**Files:**
- Create/Modify: `README.md`, `THIRD_PARTY_NOTICES.md`, `licenses/WhiskeySockets-LICENSE`, `licenses/Ryuusuke-LICENSE`, `.gitignore`, `PORT_MANIFEST.md` (final review)

**Interfaces:**
- Consumes: semua task sebelumnya.
- Produces: paket siap di-install via GitHub; tidak ada file bot.

- [ ] **Step 1: Tulis README**

Isi wajib:
- Judul `reindiandikarc-baileys` + badge versi `7.0.0-rc13.1`.
- Instalasi: `npm i github:<owner>/reindiandikarc-baileys` dan `npm i ./reindiandikarc-baileys`.
- Contoh **library API** ESM dan CJS ( membuat `makeWASocket` + `useMultiFileAuthState` + `creds.update` + `connection.update`), tanpa command handler/bot.
- Cara pairing: QR via `connection.update`, `requestPairingCode('62...')`.
- Branding: env `REINDIANDIKARC_NO_BANNER=1`, `NO_COLOR`, config `brand: { pairingNotice: false }`.
- Catatan Pterodactyl: pakai Node 20, startup `node index.js` milik konsumen, banner otomatis muncul di console.
- Daftar fitur hasil port dan tautan ke `PORT_MANIFEST.md`.
- Disclaimer bukan afiliasi resmi WhatsApp.

- [ ] **Step 2: Tulis atribusi**

- `THIRD_PARTY_NOTICES.md`: sebutkan WhiskeySockets (MIT, 2025) dan Ryuusuke/levvleys (MIT, 2026), serta bahwa kode rc13 adalah dasar dan file port berasal dari ryuuxalya.
- Salin file LICENSE sumber ke `licenses/WhiskeySockets-LICENSE` dan `licenses/Ryuusuke-LICENSE`.
- Pastikan `LICENSE` utama tetap MIT reindiandikarc 2026.

- [ ] **Step 3: Audit dependency dan struktur**

Run:

```bash
npm ls --depth=0
grep -R "@levvicode\|levvleys" package.json lib --include='*.js' --include='*.json' || true
find . -path ./node_modules -prune -o -type f \( -iname '*bot*' -o -iname '*command*' \) -print
```

Expected:
- Tidak ada baris `@levvicode` atau `levvleys` di `package.json`/`lib`.
- Perintah `find` tidak menampilkan file bot/command.
- `npm ls --depth=0` tidak melaporkan `invalid`/`missing`.

- [ ] **Step 4: Verifikasi penuh sebelum klaim selesai**

Run:

```bash
npm run build:cjs
npm test
node -e "import('./lib/index.js').then(m=>console.log('ESM',typeof m.makeWASocket))"
node -e "console.log('CJS',typeof require('./lib/index.cjs').makeWASocket)"
node --check lib/index.js && node --check lib/index.cjs
```

Expected:
- `npm test` PASS semua test.
- ESM dan CJS mencetak `function`.
- `node --check` tanpa output error.

- [ ] **Step 5: Commit terakhir**

```bash
git add README.md THIRD_PARTY_NOTICES.md licenses PORT_MANIFEST.md .gitignore && git commit -m "docs: add installation, branding, attribution and port manifest"
```

Expected: `git status --short` bersih.

---

## Self-Review Checklist (diisi saat perencanaan)

- **Spec coverage:** semua bagian spec tercakup — fondasi/ESM (T1), branding (T2/T5), merge file (T3/T4), CJS (T6), docs & verifikasi (T7). Tidak ada gap.
- **Step scan:** setiap step memiliki satu hasil yang bisa dicek; tidak ada instruksi "handle edge cases" tanpa kriteria.
- **Type consistency:** `printPairingNotice`, `attachPairingNoticeListener`, `wrapPairingCodeNotice`, `makeInMemoryStore`, `queueJob`, `getBotJid`, `extractNewsletterMetadata` memakai nama yang sama di semua task.
- **Review Focus:** kelima input berisiko memiliki test owner masing-masing (T1, T2, T6, T5, T4/T7).
- **Proportion:** plan lebih panjang dari spec karena mencantumkan test dan perintah pasti, tetapi tidak berisi implementasi penuh kecuali kontrak/dispatcher yang memang harus eksak.
