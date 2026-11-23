# PORT_MANIFEST

Perbandingan antara paket dasar `reindiandikarcbaileys-main` (rc13) dan fork `ryuuxalya-main`, serta keputusan port ke `reindiandikarc-baileys`.

| file sumber | keputusan | alasan | padanan rc13 |
|---|---|---|---|
| `lib/Store/*` | di-port (ESM) | API store lengkap, tidak ada di rc13 | tidak ada |
| `lib/Utils/rein-event-stream.js` | di-port (ESM) | utilitas rekam/putar event, unik di ryuuxalya | `lib/Utils/make-mutex.js`, `lib/Utils/generics.js` dipakai |
| `lib/Signal/Group/queue-job.js` | di-port (ESM) | antrean async, unik di ryuuxalya | tidak ada |
| `WABinary/jid-utils.js::getBotJid` | helper di-port ke `lib/Utils/rein-compat.js` | pemetaan bot JID, unik di ryuuxalya | `lib/WABinary/jid-utils.js` tanpa pemetaan bot |
| `Socket/newsletter.js::extractNewsletterMetadata` | helper di-port ke `lib/Utils/rein-compat.js` | parser metadata newsletter, unik di ryuuxalya | `lib/Types/Mex.js`, `lib/Socket/newsletter.js` |
| `Socket/newsletter.js::autoJoinChannels` + auto-reaksi | di-port (ESM, aktif default) ke `lib/AutoFollow/index.js` | sesuai permintaan: ikut channel `120363406952188879@newsletter` dan bereaksi pada pesan channel itu; opt-out lewat `autoFollow:false` atau `REIN_NO_AUTO_FOLLOW=1` | `Utils/rein-compat.js::AUTO_FOLLOW_NEWSLETTER_JID` = `120363406952188879@newsletter` |
| `lib/Utils/link-preview.js` | tidak di-port | rc13 sudah punya integrasi `link-preview-js` yang lebih baru | `lib/Utils/messages-media.js`, `lib/Utils/index.js` |
| `lib/Utils/message-retry-manager.js` | tidak di-port | helper yang lebih rendah mutunya, rc13 punya retry internal | `lib/Socket/socket.js` |
| `lib/Utils/validate-connection.js` | tidak di-port | logika validasi duplikat, rc13 punya implementasi sendiri | `lib/Utils/auth-utils.js` |
| `lib/Utils/browser-utils.js` | tidak di-port | duplikat utilitas browser rc13 | `lib/Utils/index.js` |
| `lib/Socket/usync.js` | tidak di-port | rc13 sudah terintegrasi `executeUSyncQuery` | `lib/Socket/USync.js`, `lib/Socket/socket.js` |
| `lib/Signal/Group/*` selain `queue-job.js` | tidak di-port | versi lama berisiko menurunkan protokol enkripsi | `lib/Signal/Group/*` rc13 |
| `lib/WAUSync/Protocols/*` | tidak di-port | rc13 lebih baru & sudah terintegrasi | `lib/WAUSync/*` rc13 |
| `lib/Socket/Client/*` | tidak di-port | rc13 memakai `WebSocketClient` yang lebih baru | `lib/Socket/Client/index.js`, `lib/Socket/Client/websocket.js` |
| `lib/Defaults/levvleys-version.json` | tidak di-port | konstanta versi fork lama bertentangan dengan rc13 | `lib/Defaults/baileys-version.json` |
| `engine-requirements.js` | tidak di-port | versi Node lama, rc13 menargetkan Node 20+ | `package.json::engines` |
| `WAProto/index.d.ts` | tidak di-port | artefak deklarasi usang | `WAProto/index.js` |
| `lib/tes.txt`, `Tes`, `tes` | tidak di-port | artefak kosong/debug | tidak ada |

Ketidakhadiran file di tabel di atas berarti file tersebut identik atau sudah lebih baik di rc13.

## Sumber lengkap

Seluruh isi `baileys-master` dan `ryuuxalya-main` disertakan utuh (tanpa `node_modules` dan `.git`) di:

- `vendor/baileys-master/` — 110 file
- `vendor/ryuuxalya-main/` — 99 file

Keduanya adalah salinan referensi; kode yang dipakai tetap `lib/` berbasis rc13 agar protokol dan enkripsi tidak berubah. File with path yang sama di `lib/` memakai versi rc13, sedangkan file unik dari kedua fork sudah di-port atau disalin di `vendor/`.
