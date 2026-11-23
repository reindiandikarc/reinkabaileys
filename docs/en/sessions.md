# Sessions

A session is the pair of credentials and keys that lets a socket reconnect without pairing again. REIN BAILEYS keeps the rc13 auth shape, so any adapter that follows it works.

## Multi-file auth state

`useMultiFileAuthState(folder)` writes credentials and keys into a directory:

```js
import makeWASocket, { useMultiFileAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

`saveCreds` must be attached to `creds.update`. Without it, every restart asks for a new pairing. Keep the directory out of version control and give it write access on your host.

## Custom auth state shape

For a database, provide the same object rc13 expects:

```js
const auth = {
  creds: {
    me: undefined,
    signedPreKey: undefined,
    noiseKey: undefined
  },
  keys: {
    get: async (type, ids) => ({}),
    set: async data => {},
    has: async (type, ids) => ({}),
    delete: async (type, ids) => {}
  }
}
```

`get` and `has` return a map keyed by each requested id; `set` and `delete` receive key data grouped by type.

## Database auth states

The Elaina-derived exports cover the common stores:

- `useSqliteAuthState`
- `useMySQLAuthState`
- `useMongoAuthState`
- `usePostgresAuthState`
- `useRedisAuthState`
- `useNekoDBAuth`
- `useSingleFileAuthState`

They return the `{ state, saveCreds }` pair used by `useMultiFileAuthState`; the underlying drivers are optional and loaded only when needed.

```js
import { useSqliteAuthState } from 'reindiandikarc-baileys'

const { state, saveCreds } = await useSqliteAuthState({ filePath: './session.db' })
const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)
```

For a custom store, `makeAuthStateFromStore(store)` turns a key-value adapter into an auth state. `CREDS_KEY`, `encodeAuthValue` and `decodeAuthValue` are exported for the same purpose.

## In-memory store

`makeInMemoryStore` keeps chats, contacts and messages in process memory. It does not replace credentials: still pass an auth state to `makeWASocket`.

```js
import { makeInMemoryStore } from 'reindiandikarc-baileys'

const store = makeInMemoryStore({})
store.bind(sock.ev)

console.log(store.chats.get('6281234567890@s.whatsapp.net'))
```

Related exports: `waChatKey`, `waMessageID`, `waLabelAssociationKey`, `makeOrderedDictionary` and `ObjectRepository`.

## Replaying a recorded session

`captureEventStream` appends events to a JSONL file. `readAndEmitEventStream` reads them back into an emitter:

```js
import { captureEventStream, readAndEmitEventStream } from 'reindiandikarc-baileys'

captureEventStream(sock.ev, './events.jsonl')

const replay = readAndEmitEventStream('./events.jsonl', 100)
const store = makeInMemoryStore({})
store.bind(replay.ev)
await replay.task
```

## Security notes

Credentials contain private keys. Treat the auth folder or database as a secret, back it up, and remove it immediately after a logout. `DisconnectReason.loggedOut` means the session cannot be reused; reconnect loops will not help.
