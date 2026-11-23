# THIRD_PARTY_NOTICES

`reindiandikarc-baileys` menggabungkan kode dari proyek-proyek berikut. Seluruhnya berlisensi MIT.

| Proyek | Copyright | Peran |
|---|---|---|
| WhiskeySockets / Baileys | 2025 Rajeh Taher/WhiskeySockets | Dasar paket (`reindiandikarcbaileys-main`, rc13), protokol, enkripsi, socket, WAProto |
| Ryuusuke / levvleys | 2026 levvleys | Sumber `Store/*`, event stream, `queue-job`, `getBotJid`, `extractNewsletterMetadata`, inspirasi banner gradient |

Salinan lisensi:

- [`licenses/WhiskeySockets-LICENSE`](licenses/WhiskeySockets-LICENSE)
- [`licenses/Ryuusuke-LICENSE`](licenses/Ryuusuke-LICENSE)

Perubahan yang dilakukan: konversi file port dari CommonJS ke ESM, penyesuaian import ke `lib/Defaults/`, penghapusan dependensi lama yang berstatus *security holding*, dan penambahan lapisan branding REIN. Rincian keputusan port ada di [`PORT_MANIFEST.md`](PORT_MANIFEST.md).
