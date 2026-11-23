# Kode pairing

Kode pairing menyambungkan perangkat pendamping hanya dengan nomor telepon, tanpa memindai QR. Method-nya adalah `sock.requestPairingCode()`, bawaan dari socket rc13.

## Minta kode

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

if (!state.creds.registered) {
  const code = await sock.requestPairingCode('6281234567890')
  console.log('Kode pairing:', code)
}
```

Gunakan nomor internasional tanpa tanda `+`, spasi, atau tanda hubung. Nilai yang dikembalikan sama persis seperti rc13. Di WhatsApp, buka **Perangkat Tertaut**, pilih **Taut dengan nomor telepon**, lalu masukkan kodenya.

## QR atau pairing

Kalau tidak meminta kode, event `connection.update` memberikan string `qr` yang bisa dicetak:

```js
sock.ev.on('connection.update', ({ connection, qr }) => {
  if (qr) console.log(qr)
  if (connection === 'open') console.log('Tersambung')
})
```

REIN BAILEYS otomatis mencetak `PAIRING CODE <kode>` ke konsol. Notifikasi QR hanya dicetak sekali per nilai QR supaya log tidak membanjir.

## Notifikasi dan warna

- `makeWASocket({ auth, brand: { pairingNotice: false } })` — matikan notifikasi QR dan pairing.
- `NO_COLOR=1` atau `FORCE_COLOR=0` — teks polos tanpa escape ANSI.
- `FORCE_COLOR=1` — paksa warna pada log non-TTY.
- `REIN_NO_BANNER=1` — sembunyikan banner saat start tanpa mematikan notifikasi.

Untuk konsol kustom, tersedia ekspor `BRAND`, `printPairingNotice`, `attachPairingNoticeListener`, dan `wrapPairingCodeNotice`.

## Setelah pairing

Kredensial yang ditulis `saveCreds` berisi status registrasi. Pada start berikutnya, lewati permintaan kode dan biarkan socket memulihkan sesi:

```js
import { DisconnectReason } from 'reindiandikarc-baileys'

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
  if (connection === 'close') {
    const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
    if (!loggedOut) connect()
  }
})
```

Status `401` berarti sesi sudah logout: hapus folder auth lalu pasangkan ulang. Opsi penyimpanan lainnya ada di [Sesi](./sessions.html).
