# Contoh

Semua contoh di bawah memakai nama paket `reindiandikarc-baileys` dan Node.js 20 ke atas.

## Bot auto-reply dengan reconnect

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'reindiandikarc-baileys'

async function connect () {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) console.log(qr)
    if (connection === 'open') console.log('REIN BAILEYS sudah online')

    if (connection === 'close') {
      const loggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
      if (!loggedOut) connect()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue
      const teks = msg.message.conversation || msg.message.extendedTextMessage?.text
      if (!teks) continue
      await sock.sendMessage(msg.key.remoteJid, { text: `Echo: ${teks}` }, { quoted: msg })
    }
  })
}

connect()
```

## Pasangkan dengan nomor telepon

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state, brand: { pairingNotice: false } })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', ({ connection }) => {
  if (connection === 'open') console.log('Berhasil dipasangkan')
})

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(process.env.PHONE_NUMBER)
  console.log('Masukkan kode ini di WhatsApp:', code)
}
```

## Siaran ke grup dengan store dan antrean

```js
import makeWASocket, { useMultiFileAuthState, makeInMemoryStore, queueJob } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state, syncFullHistory: false })
const store = makeInMemoryStore({})

store.bind(sock.ev)
sock.ev.on('creds.update', saveCreds)

const grup = [...store.chats.keys()].filter(jid => jid.endsWith('@g.us'))

for (const jid of grup) {
  await queueJob(`siaran:${jid}`, async () => {
    await sock.sendMessage(jid, { text: 'Pembaruan terjadwal dari REIN BAILEYS' })
  })
}
```

## Auto-follow channel dengan pengaturan eksplisit

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

## Versi CommonJS

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

## Rekam dan putar ulang event

```js
import { captureEventStream, readAndEmitEventStream, makeInMemoryStore } from 'reindiandikarc-baileys'

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
const store = makeInMemoryStore({})

store.bind(replay.ev)
await replay.task
console.log(store.chats.all().length)
```
