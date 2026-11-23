# THIRD_PARTY_NOTICES

`reindiandikarc-baileys` menggabungkan kode dari proyek-proyek berikut. Seluruhnya berlisensi MIT.

| Proyek | Copyright | Peran |
|---|---|---|
| WhiskeySockets / Baileys | 2025 Rajeh Taher/WhiskeySockets | Dasar paket (`reindiandikarcbaileys-main`, rc13), protokol, enkripsi, socket, WAProto |
| Ryuusuke / levvleys | 2026 levvleys | Sumber `Store/*`, event stream, `queue-job`, `getBotJid`, `extractNewsletterMetadata`, inspirasi banner gradient |

Salinan lisensi:

- [`licenses/WhiskeySockets-LICENSE`](licenses/WhiskeySockets-LICENSE)
- [`licenses/Ryuusuke-LICENSE`](licenses/Ryuusuke-LICENSE)

Perubahan yang dilakukan: konversi file port dari CommonJS ke ESM, penyesuaian import ke `lib/Defaults/`, penghapusan dependensi lama yang berstatus *security holding*, penambahan lapisan branding REIN, dan port auto-follow/auto-reaksi ke `lib/AutoFollow/`. Susunan paket mengikuti kedua fork (`lib/`, `WAProto/`, `engine-requirements.js`, `readme.md`); file unik dari masing-masing fork disertakan pada path asalnya. Rincian keputusan port ada di [`PORT_MANIFEST.md`](PORT_MANIFEST.md).
