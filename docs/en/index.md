# REIN BAILEYS

REIN BAILEYS is a pure-JavaScript WhatsApp Web Multi-Device API for Node.js. It connects as a companion device over `wss://web.whatsapp.com/ws/chat`, using the Noise handshake and the Signal protocol. There is no Selenium, no Chromium, and no command handler inside the library.

- Package: `reindiandikarc-baileys`
- Repository: `reindiandikarc/reinkabaileys`
- Version: `7.0.0-rc13.1` (rc13 protocol)
- Runtime: Node.js **20 or newer**, ESM and CJS

Importing the package prints the gradient REIN BAILEYS banner once per process. Set `REIN_NO_BANNER=1` to silence it, or `NO_COLOR=1` for plain text.

## What is inside

Everything ships in one install:

- **Transport and crypto** — WebSocket, Noise handshake, Signal protocol, WAProto, app state and history sync.
- **Store and events** — `makeInMemoryStore`, `captureEventStream`, `readAndEmitEventStream`, `queueJob`, `getBotJid` and `extractNewsletterMetadata`.
- **Rich messages** — `MessageBuilder` / `MB`, native flow, A2UI, AIRich, scheduled messages and status helpers.
- **Voice and sessions** — `makeVoipClient`, database auth states, media loaders and link previews.

Nothing needs a second install: the builder, VoIP client and store ship in the same package.

## Architecture in one line

`makeWASocket()` wraps community, business, message receive/send, newsletter, group and chat sockets around a core WebSocket socket. Almost everything arrives through `sock.ev`; calls such as `sock.sendMessage()` go out through the same socket.

## Start here

- [Getting started](./getting-started.html) — install, ESM/CJS, reconnect, configuration
- [Messages](./messages.html) — events, JIDs, text, media, reactions, polls
- [Groups](./groups.html) — groups and communities
- [Newsletter](./newsletter.html) — channels and auto-follow
- [Pairing code](./pairing.html) — link without scanning a QR
- [Sessions](./sessions.html) — file and database auth states
- [MessageBuilder](./builder.html) — buttons, carousels, AIRich, A2UI
- [Examples](./examples.html) — complete bots
- [API reference](./api-reference.html) — exported names generated from the source

## Install

Add the GitHub dependency to your bot's `package.json`:

```json
{
  "dependencies": {
    "reindiandikarc-baileys": "github:reindiandikarc/reinkabaileys"
  }
}
```

Then run `npm install`. Import using the package name, not the repository name.

## The shortest working example

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', ({ connection, qr }) => {
  if (qr) console.log(qr)
})

sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return
  const msg = messages[0]
  if (!msg?.message || msg.key.fromMe) return
  await sock.sendMessage(msg.key.remoteJid, { text: 'Hello from REIN BAILEYS' })
})
```

[Getting started](./getting-started.html) adds the reconnect logic that a long-running bot needs.

## What this library is not

REIN BAILEYS is a transport and API layer, not a bot framework. It has no command router, no scheduler and no plugin system. Those decisions belong in your application code.

## License and credit

The package is MIT licensed and is not affiliated with WhatsApp or Meta. Attribution for adapted features is recorded in the repository README under Licence and contributors.
