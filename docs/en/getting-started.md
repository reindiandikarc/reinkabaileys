# Getting started

## Requirements

- Node.js **20 or newer**
- npm, yarn or pnpm
- A WhatsApp account to pair as a companion device

Python, ffmpeg and a browser are not needed for the core API.

## Installation

Put the GitHub reference in your bot's `package.json`:

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Run `npm install`. The package name stays `reindiandikarc-baileys` even though the repository is `reinkabaileys`.

## ESM quick start

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
      if (msg.key.fromMe) continue
      console.log(msg.key.remoteJid, msg.message)
    }
  })

  return sock
}

connect()
```

Two lines matter most: `saveCreds` on `creds.update` keeps the session, and the `loggedOut` check stops reconnecting when the credentials are no longer valid. Delete the auth folder and pair again after a real logout.

## CommonJS

The package ships ESM and CJS entry points. With `require()`, use the `default` property for the socket factory:

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

The CJS artifacts are committed in the package, so consumers do not need to run a build step.

## Connection options

`makeWASocket(config)` uses the defaults from `src/Defaults/index.js`. The options you will reach for first:

- `auth` — the auth state; required to log in.
- `browser` — companion device identity, for example `Browsers.ubuntu('Chrome')`.
- `markOnlineOnConnect` — set to `false` to stay invisible on connect.
- `syncFullHistory` — `true` by default; set to `false` to skip a large first sync.
- `logger` — a pino-compatible logger.
- `shouldIgnoreJid` — filter incoming JIDs, for example `jid => jid.endsWith('@broadcast')`.
- `cachedGroupMetadata` — supply group metadata from your own cache.
- `getMessage` — fetch a message for retries and quotes.
- `generateHighQualityLinkPreview` — opt into high-quality previews.
- `autoFollow` — channel auto-follow configuration; see [Newsletter](./newsletter.html).
- `brand.pairingNotice` — set to `false` to silence QR and pairing notices.

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

The protocol version is `[2, 3000, 1035194821]` and the WebSocket endpoint is `wss://web.whatsapp.com/ws/chat`. Both are package defaults; you do not normally change them.

## Events you will use immediately

- `connection.update` — `{ connection, qr, lastDisconnect, isNewLogin }`; `connection` is `connecting`, `open` or `close`.
- `creds.update` — save the credentials here.
- `messages.upsert` — `{ messages, type }` with `notify` for live messages.

See [Messages](./messages.html) for the full event list.

## Branding and environment

- `REIN_NO_BANNER=1` (alias `REINDIANDIKARC_NO_BANNER=1`) — no startup banner.
- `NO_COLOR=1` or `FORCE_COLOR=0` — plain text without ANSI colour.
- `FORCE_COLOR=1` — keep the gradient in non-TTY logs such as Pterodactyl.
- `REIN_NO_AUTO_FOLLOW=1` — disable channel auto-follow.

`BRAND`, `getBrandLines`, `gradientText` and `printBrand` are exported if you want to print the identity yourself.

## Pterodactyl note

Use a Node.js 20 egg and keep the application startup command as `node index.js`. The panel console is not a TTY, so output is plain by default; add `FORCE_COLOR=1` to the egg's environment variables if you want the gradient.
