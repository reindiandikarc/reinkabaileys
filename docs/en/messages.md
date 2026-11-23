# Messages

## Receiving messages

Everything inbound arrives on `sock.ev`. The `messages.upsert` event carries batches of messages:

```js
sock.ev.on('messages.upsert', ({ messages, type }) => {
  if (type !== 'notify') return
  for (const msg of messages) {
    if (msg.key.fromMe) continue
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
    if (!text) continue
    console.log(msg.key.remoteJid, text)
  }
})
```

`type` is `notify` for new messages and `append` for history or sync additions. `emitOwnEvents` is `true` by default, so messages you send can also appear in this event; filter on `msg.key.fromMe` when you only want user input.

## Events related to chat activity

- `messages.update` — status changes such as read, delivered and reactions.
- `chats.upsert` — new or updated chats.
- `contacts.update` — new or updated contacts.
- `presence.update` — `{ id, presences }` with online, typing or recording state.
- `blocklist.update` — blocklist changes.
- `call` — incoming calls.

## JIDs

`jid` is the address of a chat:

- `6281234567890@s.whatsapp.net` — an individual phone number.
- `120363...@g.us` — a group.
- `120363406952188879@newsletter` — a channel.

`getBotJid` maps an `@bot` JID to its `@s.whatsapp.net` number.

## Sending text and replies

```js
const jid = '6281234567890@s.whatsapp.net'

await sock.sendMessage(jid, { text: 'Hello from REIN BAILEYS' })

await sock.sendMessage(jid, {
  text: 'This answers your message',
  edit: msg.key
})

await sock.sendMessage(jid, {
  text: 'Quoted reply',
  quoted: msg
})

await sock.sendMessage(jid, {
  text: '@6281234567890 please check',
  mentions: ['6281234567890@s.whatsapp.net']
})
```

## Media and other content

```js
await sock.sendMessage(jid, { image: { url: './photo.jpg' }, caption: 'Photo from REIN' })
await sock.sendMessage(jid, { video: { url: './clip.mp4' }, caption: 'Clip' })
await sock.sendMessage(jid, { audio: { url: './voice.mp3' }, mimetype: 'audio/mp4' })
await sock.sendMessage(jid, { document: { url: './report.pdf' }, mimetype: 'application/pdf' })
await sock.sendMessage(jid, { location: { degreesLatitude: -6.2, degreesLongitude: 106.8 } })
await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } })
```

Other helpers cover polls, view-once media, stickers, contacts, scheduled messages and status mentions:

```js
await sock.sendMessage(jid, {
  poll: { name: 'Pick one', values: ['A', 'B'], selectableCount: 1 }
})

import { makePollAddOptionMessage, makeEventInviteMessage } from 'reindiandikarc-baileys'
```

`sendMessage` accepts a path or a buffer for media. Uploads go through `waUploadToServer`, and the media connection can be refreshed with `refreshMediaConn`.

## Presence and receipts

```js
await sock.sendPresenceUpdate('composing', jid)
await sock.sendMessage(jid, { text: 'Done' })
await sock.readMessages([msg.key])
```

## Recording and replaying events

`captureEventStream` writes events to a JSONL file, and `readAndEmitEventStream` builds an emitter you can bind a store to:

```js
import { captureEventStream, readAndEmitEventStream, makeInMemoryStore } from 'reindiandikarc-baileys'

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
const store = makeInMemoryStore({})
store.bind(replay.ev)
await replay.task
```

## Serialising work with queueJob

`queueJob` runs tasks in a bucket one after another. It is useful when several handlers want to write to the same chat:

```js
import { queueJob } from 'reindiandikarc-baileys'

await queueJob(jid, async () => {
  await sock.sendMessage(jid, { text: 'This message will not overtake the previous one' })
})
```

## Sending from builders

For buttons, carousels and rich AI responses, build the message with [MessageBuilder](./builder.html) and send it with `send(jid)` or pass the built content to `sock.relayMessage`.
