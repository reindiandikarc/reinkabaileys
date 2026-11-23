# Pairing code

A pairing code links a companion device with a phone number instead of a QR scan. The method is `sock.requestPairingCode()`, provided by the socket.

## Request a code

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

if (!state.creds.registered) {
  const code = await sock.requestPairingCode('6281234567890')
  console.log('Pairing code:', code)
}
```

Use the international number without `+`, spaces or dashes. The returned value follows the package protocol format. In the WhatsApp app, open **Linked devices**, choose **Link with phone number**, then enter the code.

## QR or pairing

If you do not request a code, `connection.update` supplies a `qr` string you can print:

```js
sock.ev.on('connection.update', ({ connection, qr }) => {
  if (qr) console.log(qr)
  if (connection === 'open') console.log('Linked')
})
```

REIN BAILEYS prints `PAIRING CODE <code>` to the console automatically, and prints a QR notice only once per QR value so logs stay readable.

## Notices and colours

- `makeWASocket({ auth, brand: { pairingNotice: false } })` — silence QR and pairing notices.
- `NO_COLOR=1` or `FORCE_COLOR=0` — plain text, no ANSI escapes.
- `FORCE_COLOR=1` — force colour in non-TTY logs.
- `REIN_NO_BANNER=1` — hide the startup banner without touching the notices.

`BRAND`, `printPairingNotice`, `attachPairingNoticeListener` and `wrapPairingCodeNotice` are exported for custom consoles.

## After pairing

The credentials written by `saveCreds` contain the registration. On the next start, skip the pairing request and let the socket restore the session:

```js
import { DisconnectReason } from 'reindiandikarc-baileys'

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
  if (connection === 'close') {
    const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
    if (!loggedOut) connect()
  }
})
```

Status `401` means logged out: delete the auth folder and pair again. See [Sessions](./sessions.html) for storage options.
