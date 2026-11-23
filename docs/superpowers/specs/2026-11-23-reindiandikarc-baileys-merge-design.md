# Design: reindiandikarc-baileys — merge tiga fork Baileys + branding panel/terminal

Tanggal: 2026-11-23
Status: menunggu persetujuan human partner
Pendekatan terpilih: **A — Fork-and-merge penuh** (disetujui user dengan "A")

## 1. Intent & why

User ingin satu paket library bernama **reindiandikarc-baileys** yang menjadi versi terbaik dan paling lengkap dari tiga sumber yang dikirim:

1. `reindiandikarcbaileys-main.zip` — identitas/target fork, Baileys `7.0.0-rc13`, ESM + CJS.
2. `baileys-master.zip` — generasi rc13 yang sama, dipakai sebagai referensi perbaikan struktur.
3. `ryuuxalya-main.zip` — fork lama `2.0.9` (Ryuusuke/levvleys) yang punya banner gradient + ornament, `Store/`, `usync`, retry manager, dan utilitas tambahan.

Paket ini akan dipasang lewat **Pterodactyl panel** atau **terminal biasa** dengan `SC GitHub` (Node.js). Karena itu yang dikirim harus murni **library**, bukan bot: tidak ada command handler, tidak ada starter bot, tidak ada file yang menjalankan WA secara otomatis selain saat konsumen memanggil `makeWASocket`.

Keberhasilan diukur dari: library bisa di-`npm install`, di-import (ESM **dan** CJS), socket bisa dibuat sampai proses pairing (QR / pairing code) muncul, API inti (`sendMessage`, event emitter, auth state) tetap berfungsi, dan identitas merek tampil rapi di log Pterodactyl/terminal tanpa merusak perilaku rc13.

## 2. Temuan kunci dari recon

- `reindiandikarcbaileys-main` dan `baileys-master` nyaris identik (ukuran file dan isi `WAProto/index.js` sama). Beda material: folder target bernama `lib/Default/`, padahal **semua import** memakai `../Defaults/index.js` (dan `lib/index.js` mengekspor `./Defaults/index.js`). Akibatnya import ESM gagal:
  `ERR_MODULE_NOT_FOUND ... lib/Defaults/index.js`.
- `lib/index.cjs` adalah bundle esbuild mandiri berisi seluruh kode rc13 + dependency, tanpa relative import; tidak bergantung pada folder `Defaults` di runtime. Bundle ini layak dipertahankan, bukan digenerasi ulang.
- `ryuuxalya-main/lib/index.js` mencetak banner kotak dengan gradient truecolor buatan sendiri pada saat modul di-import. Itu adalah "tampilan paired" yang dimaksud user.
- Koreksi hasil recon mendalam: `message-retry-manager.js`, `link-preview.js`, `validate-connection.js`, `browser-utils.js` **sudah ada di rc13 dan versinya lebih baik** (retry manager rc13 sudah terhubung ke socket; link-preview rc13 memperbaiki bug retry/header; validate-connection rc13 punya deteksi Android + `lid` + `pushName`). Jadi ini bukan file unik dan tidak di-copy.
- File yang benar-benar hanya ada di ryuuxalya: `lib/Store/{index,make-in-memory-store,make-ordered-dictionary,object-repository}.js`, `lib/Utils/levvleys-event-stream.js`, `lib/Signal/Group/queue-job.js`, `lib/Socket/usync.js`, `engine-requirements.js`, `WAProto/index.d.ts`, `lib/tes.txt`.
- Selain itu ada helper di file bersama yang jadi gap nyata: `getBotJid` (`WABinary/jid-utils.js`) dan `extractNewsletterMetadata` (`Socket/newsletter.js`). Helper media ryuuxalya (`uploadFile`, `vid2jpg`, `prepareStream`, `processLocationThumbnail`) tidak di-port karena menarik `jimp`, `sharp`, `file-type`, `form-data`, `fflate`, `axios`, dan `ffmpeg`.
- ryuuxalya berbasis CommonJS (`require`, `exports.`, helper `__importDefault`); 65 file memakai `require(`, sementara rc13 100% ESM dengan ekstensi `.js` eksplisit. Semua file yang di-port harus dikonversi, termasuk `require()` di dalam function body.
- Dependency kritis: jangan pernah memakai `@levvicode/libsignal-node` atau `levvleys` dari ryuuxalya — keduanya sekarang `0.0.1-security holding package`. Tetap pakai `libsignal` git milik WhiskeySockets. Store butuh `@adiwajshing/keyed-db@^0.2.4` (masih tersedia). rc13 juga perlu mendeklarasikan optional dep yang sudah dipakai dinamis (`link-preview-js`, `audio-decode`, `jimp`, `sharp`, `file-type`, `form-data`, `fflate`).
- Brand baru memakai **ANSI truecolor murni tanpa dependency baru**, agar ringan dan aman di Pterodactyl.

## 3. Goals

1. Satu direktori paket npm-ready `reindiandikarc-baileys` di `/data/workspace/reindiandikarc-baileys`.
2. Seluruh isi tiga sumber hadir di paket final: basis rc13 + file unik baileys-master + file unik ryuuxalya. Tidak ada file yang dibuang tanpa alasan tercatat.
3. Bug path `Default` → `Defaults` diperbaiki; import ESM dan CJS sukses.
4. Branding: `REINDIANDIKARC BAILEYS` dengan ornamen `╭╮╰╯│├┤✦◆`, gradient truecolor per karakter, otomatis tampil **sekali per proses** saat library di-import (terlihat di Pterodactyl maupun terminal), dengan opsi mati via env.
5. Notifikasi pairing berbrand: saat `connection.update` mengirim `qr` atau `pairingCode`, library bisa mencetak header branded ringkas (opt-out via config), tanpa menggambar QR sendiri.
6. Export publik tetap stabil: seluruh export rc13 tetap ada, ditambah export modul brand dan helper hasil port dengan nama yang tidak bentrok.
7. Verifikasi otomatis: syntax check semua `.js`, `npm install`, import ESM + CJS, tes modul brand, tes inisialisasi socket hingga emit QR/pairing code, tes mock `sendMessage` + `messages.upsert`.

## 4. Non-goals

- Membuat bot, command handler, atau kode yang membalas pesan WA otomatis.
- Menyentuh/mengganti panel Pterodactyl, membuat egg, atau membuat UI web.
- Push ke GitHub (tidak ada kredensial; user yang akan pakai SC-nya sendiri).
- Verifikasi login WA sampai `connection === 'open'` tanpa QR/pairing code dari user.
- Mengganti protocol/enkripsi rc13 atau menurunkan versi ke ryuuxalya.

## 5. Anti-goals (yang harus dicegah)

- Import ESM/CJS gagal atau nama export bertabrakan.
- Banner tercetak berulang kali setiap kali modul di-load.
- Inject ANSI ke log yang tidak mendukung warna (harus ada fallback plain tekstur).
- Menghapus atribusi lisensi WhiskeySockets / Ryuusuke.
- Menambah dependency native berat yang membuat `npm install` gagal di Pterodactyl.

## 6. Constraints & keputusan builder (sudah saya tetapkan)

- **Nama paket**: `reindiandikarc-baileys`, versi `7.0.0-rc13.1`, `type: module`, `main: lib/index.cjs`, `module: lib/index.js`.
- **Node minimum**: `>=20.0.0` (selaras dengan `engine-requirements.js` ryuuxalya dan egg Node modern Pterodactyl). Tidak ada `preinstall` yang memaksa `process.exit`, cukup field `engines`.
- **Struktur folder**: `lib/Defaults/` (bukan `Default/`) agar cocok dengan seluruh import rc13. Isi diambil dari `baileys-master` lalu disamakan dengan `reindiandikarc`.
- **Modul brand**: `lib/Brand/index.js`. Export: `BRAND`, `getBrandLines`, `gradientText`, `printBrand`, `printPairingNotice`. Tidak memakai `chalk`/`gradient-string`.
- **Auto-print**: dipanggil sekali dari `lib/index.js` dan dari bagian kompilasi `lib/index.cjs`. Guard: `globalThis.__REINDIANDIKARC_BAILEYS_BANNER__` + env `REINDIANDIKARC_NO_BANNER=1`. Jika `NO_COLOR` atau `FORCE_COLOR=0`, pakai plain text tanpa escape ANSI.
- **Config pairing**: `makeWASocket({ brand: { pairingNotice: false } })` untuk matikan; default `true`. Tidak mencetak QR, hanya header + petunjuk.
- **CJS strategy (diperbarui setelah builder-check)**: bundle rc13 yang sudah terbukti dipertahankan utuh sebagai `lib/index.bundle.cjs`. `lib/index.cjs` yang baru adalah *dispatcher* tipis yang me-re-export bundle tersebut, lalu menggabungkan export brand dan export helper hasil port. Helper port dikompilasi ke CJS kecil dengan `esbuild` (devDependency, eksternalisasi dependency native/git) ke `lib/cjs/`. Ini menghindari regenerasi bundle 7,5 MB yang berisiko, tapi tetap memberi CJS parity untuk export baru.
- **Bentrok path (Q1 reviewer, final)**: file ryuuxalya yang path-nya sudah ada di rc13 (`browser-utils.js`, `link-preview.js`, `message-retry-manager.js`, `validate-connection.js`) **tidak di-copy sama sekali**. Versi rc13 menang karena lebih baru dan sudah terintegrasi; pengecualiannya dicatat di `PORT_MANIFEST.md`. Tidak ada alias `ryuu-*` untuk file ini.
- **Trigger notifikasi pairing (Q2 reviewer)**: `connection.update` di rc13 hanya membawa `{ qr }`, bukan `pairingCode`. Jadi header QR dipicu dari listener internal pada event `connection.update` bila `qr` ada; header pairing code dipicu dengan membungkus `requestPairingCode` secara minimal (print lalu `return code` seperti semula). Tidak ada perubahan nilai kembalian atau semantik event.
- **Cakupan file unik (Q3 reviewer, final)**: empat bucket — **(A)** di-port penuh dan dikonversi ESM: `Store/*` + `@adiwajshing/keyed-db`, `levvleys-event-stream.js`, `queue-job.js`; **(B)** helper selektif tanpa heavy dep: `getBotJid`, `extractNewsletterMetadata`, ditempatkan di `lib/Utils/ryuu-compat.js`; **(C)** `usync.js` tidak di-port karena rc13 sudah punya `executeUSyncQuery`, dicatat; **(D)** sisanya (`Signal/Group/*` selain `queue-job.js`, `WAUSync/Protocols/*`, `Socket/Client/*`, `Defaults/levvleys-version.json`, `engine-requirements.js`, `WAProto/index.d.ts`, artefak `tes`, versi lama `link-preview/retry/validate/browser-utils`) tidak di-port dan dicatat satu per satu di `PORT_MANIFEST.md`. Alasannya seragam: rc13 sudah punya pengganti lebih baru atau port akan menurunkan protokol/enkripsi. Ini memenuhi syarat "semua isi ada atau tercatat alasannya" tanpa downgrade.
- **Dependency & konstanta (dari recon)**: tambah `@adiwajshing/keyed-db@^0.2.4` ke `dependencies`; tambah `link-preview-js`, `audio-decode`, `jimp`, `sharp`, `file-type`, `form-data`, `fflate` ke `optionalDependencies`. **Jangan** menyalin `@levvicode/libsignal-node`, `levvleys`, `chalk`, `gradient-string`, `qrcode-terminal`, atau `libphonenumber-js` (tidak dipakai/berisiko). Pertahankan konstanta versi rc13 (`[2,3000,1035194821]`) dan jangan timpa dengan `[2,3000,1043857760]` milik ryuuxalya.
- **Gate verifikasi (Q5 reviewer)**: gate deterministik = transport/WS tiruan yang menghasilkan event `connecting` dan `qr` tanpa jaringan. Smoke test jaringan nyata (QR sungguhan dari server WA) bersifat best-effort. Status `open` dan balasan WA asli baru diverifikasi setelah user scan QR — bukan blocker untuk menyelesaikan library.
- **Atribusi**: `LICENSE` utama tetap MIT reindiandikarc; tambah `THIRD_PARTY_NOTICES.md` dan salinan lisensi WhiskeySockets serta levvleys/Ryuusuke di `licenses/`.
- **Dokumentasi**: README baru menjelaskan instalasi via GitHub (`npm i github:<owner>/reindiandikarc-baileys`), pemakaian ESM/CJS, env branding, dan catatan Pterodactyl (Node 20). Contoh penggunaan hanya untuk menunjukkan API library, bukan bot siap pakai.

## 7. Approaches yang dipertimbangkan

| Pendekatan | Trade-off | Keputusan |
|---|---|---|
| **A. Fork-and-merge penuh** | Paling lengkap; butuh konversi CJS→ESM dan uji kompatibilitas API | **Dipilih user** |
| B. Minimal patch (path + banner saja) | Cepat, tapi file unik ryuuxalya hilang → melanggar syarat "semua isi ada" | Ditolak |
| C. Bangun ulang dari `baileys-master` | Struktur bersih, tapi identitas reindiandikarc dan beberapa file uniknya hilang | Ditolak |

## 8. Parts of the how

### 8.1 Fondasi
- Copy seluruh `reindiandikarcbaileys-main` sebagai basis paket final.
- Ganti nama `lib/Default/` menjadi `lib/Defaults/`; samakan isi dengan `baileys-master/lib/Defaults/`.
- Perbarui `package.json` (nama, versi, engines, scripts `check`, `test`, `build:cjs`, dependency baru). Bundle lama dipindah ke `lib/index.bundle.cjs`; `lib/index.cjs` jadi dispatcher.

### 8.2 Port ryuuxalya (sesuai bucket di §6)
- Bucket A: salin `Store/*`, `levvleys-event-stream.js`, `queue-job.js` ke path yang sama, lalu konversi CJS→ESM (termasuk `require` di dalam function body untuk `keyed-db` dan `fs`).
- Bucket B: ekstrak bersih `getBotJid` dan `extractNewsletterMetadata` ke `lib/Utils/ryuu-compat.js`; buang `console.log` debug dari `getSenderLid` bila ikut disalin.
- Bucket C/D: tidak disalin; cukup daftar di `PORT_MANIFEST.md` beserta alasan dan padanan rc13-nya.
- Nama export dicek terhadap `lib/index.js` rc13; bentrok diselesaikan dengan alias eksplisit, bukan dengan menimpa export rc13.
- Dependency baru yang benar-benar dipakai: `@adiwajshing/keyed-db`. Dependency berat/berisiko tidak ditambahkan.

### 8.3 Branding
- `gradientText(text, palette)` menghasilkan ANSI `\x1b[38;2;r;g;bm` per karakter diikuti `\x1b[0m`.
- `getBrandLines()` mengembalikan array baris kotak dengan lebar tetap, aman untuk terminal 80 kolom.
- `printBrand()` menulis sekali ke `process.stdout` (atau `process.stderr` bila stdout tidak tersedia).
- `printPairingNotice({ qr, pairingCode })` mencetak satu baris ringkas bertema brand bila ada QR/code.
- Dipanggil dari `lib/index.js`; untuk CJS, diekspor melalui dispatcher `lib/index.cjs` (modul brand dikompilasi terpisah ke `lib/cjs/`).

Sketsa tampilan yang akan dihasilkan (warna dinyatakan dengan `░` di sini, aslinya gradient truecolor per karakter):

```text
╭────────────────────────────────────────────────────────────╮
│  ░▒▓ R E I N D I A N D I K A R C   B A I L E Y S ▓▒░      │
├────────────────────────────────────────────────────────────┤
│  ✦  Fork rc13 · ESM + CJS · Multi-Device                  │
│  ✦  v7.0.0-rc13.1   ·   WhiskeySockets × Ryuuxalya       │
╰────────────────────────────────────────────────────────────╯
```

Contoh notifikasi pairing (tanpa menggambar QR):

```text
  ◆ REINDIANDIKARC • PAIRING CODE  A1B2-C3D4  ◆
    Masukkan kode di WhatsApp → Linked Devices → Link with phone number
```

### 8.4 Perilaku pairing
- Tidak mengubah logika `requestPairingCode`, `buildPairingQRData`, atau event `connection.update`.
- Menambah listener internal ringan hanya untuk mencetak header branded; tidak memblokir event konsumen.
- Tetap menghormati `printQRInTerminal` deprecated warning bawaan rc13.

### 8.5 Verifikasi
- `node --check` untuk semua file `.js` kecuali bundle besar yang sudah teruji.
- `npm install` di paket final.
- Script tes lokal (tanpa framework berat): import ESM, `require` CJS, cek export kunci (`makeWASocket`, `useMultiFileAuthState`, `DisconnectReason`, brand exports), cek banner sekali, cek fallback `NO_COLOR`, cek `printPairingNotice`.
- Socket smoke test: buat `makeWASocket` dengan auth state sementara, dengarkan `connection.update`, pastikan event pertama (QR atau connecting) terjadi tanpa exception. Tidak menyimpan kredensial.
- Mock test: panggil `sock.sendMessage` dengan socket tiruan untuk memastikan API mengirim payload tanpa jaringan; validasi event `messages.upsert` bisa didengarkan.

### 8.6 Hal yang masih jadi keputusan saya saat implementasi
- Palette gradient final (4 pilihan acak seperti ryuuxalya, atau satu palette konsisten merah→ungu→cyan). Saya pakai **satu palette konsisten** `#ff4d8d → #a855f7 → #22d3ee` agar identitas merek stabil.
- Lebar kotak banner: 60 karakter.
- Nama env: `REINDIANDIKARC_NO_BANNER=1` (primary), `NO_COLOR` untuk fallback.
- `usync.js` ryuuxalya tidak diekspor lagi: rc13 sudah punya `executeUSyncQuery` yang setara. Keputusan ini masuk bucket C di `PORT_MANIFEST.md`.

## 9. Definition of done

- [ ] `npm install` sukses di paket final.
- [ ] `import` ESM dan `require` CJS sukses, export inti + brand ada.
- [ ] Seluruh file unik dari 3 zip hadir (atau tercatat kenapa tidak dipakai) di paket final.
- [ ] Banner branded muncul sekali di stdout saat import, dengan gradient dan ornamen, dan bisa dimatikan.
- [ ] `makeWASocket` bisa dibuat dan menghasilkan event QR/pairing tanpa exception.
- [ ] Tes mock `sendMessage` / `messages.upsert` lulus.
- [ ] README + THIRD_PARTY_NOTICES + PORT_MANIFEST ada.
- [ ] Dependency aman terpasang; tidak ada `@levvicode/libsignal-node` / `levvleys` di paket final.
- [ ] Tidak ada file bot/command handler di paket final.

## 10. Yang diserahkan ke perencana (tidak perlu tanya user lagi)

Susunan task implementasi, urutan port file, dan perintah verifikasi menjadi tanggung jawab `writing-plans`. Semua keputusan yang bisa saya ambil sendiri sudah saya tandai di bagian 6 dan 8.6. Satu-satunya yang baru bisa diverifikasi dengan user adalah scan QR nyata untuk mencapai status `open`; itu bukan blocker untuk menyelesaikan library.
