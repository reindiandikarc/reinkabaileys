# Examples

Each example below uses the package name `reindiandikarc-baileys` and Node.js 20 or newer.

## Auto-reply bot with reconnect

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) console.log(qr)
    if (connection === 'open') console.log('REIN BAILEYS is online')

    if (connection === 'close') {
      const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
      if (!loggedOut) connect()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text
      if (!text) continue
      await sock.sendMessage(msg.key.remoteJid, { text: `Echo: ${text}` }, { quoted: msg })
    }
  })
}

connect()
```

## Pair with a phone number

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state, brand: { pairingNotice: false } })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', ({ connection }) => {
  if (connection === 'open') console.log('Paired')
})

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(process.env.PHONE_NUMBER)
  console.log('Enter this code in WhatsApp:', code)
}
```

## Group broadcast with a store and a queue

```js
import makeWASocket, { useMultiFileAuthState, makeInMemoryStore, queueJob } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state, syncFullHistory: false })
const store = makeInMemoryStore({})

store.bind(sock.ev)
sock.ev.on('creds.update', saveCreds)

const groups = [...store.chats.keys()].filter(jid => jid.endsWith('@g.us'))

for (const jid of groups) {
  await queueJob(`broadcast:${jid}`, async () => {
    await sock.sendMessage(jid, { text: 'Scheduled update from REIN BAILEYS' })
  })
}
```

## Channel auto-follow with explicit settings

```js
import makeWASocket, {
  useMultiFileAuthState,
  AUTO_FOLLOW_NEWSLETTER_JID
} from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({
  auth: state,
  autoFollow: {
    jid: AUTO_FOLLOW_NEWSLETTER_JID,
    delayMs: 15000,
    muteDelayMs: 3000,
    reactDelayMs: 3000,
    mute: true,
    react: true
  }
})

sock.ev.on('creds.update', saveCreds)
```

## CommonJS version

```js
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('reindiandikarc-baileys')

async function main () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      main()
    }
  })

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type === 'notify') console.log(messages[0]?.message)
  })
}

main()
```

## Recording and replaying events

```js
import { captureEventStream, readAndEmitEventStream, makeInMemoryStore } from 'reindiandikarc-baileys'

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
const store = makeInMemoryStore({})

store.bind(replay.ev)
await replay.task
console.log(store.chats.all().length)
```
