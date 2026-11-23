# Newsletter

WhatsApp channels appear as newsletters with a `@newsletter` JID. REIN BAILEYS exposes the full newsletter socket plus an auto-follow helper that is enabled by default.

## Newsletter methods

- `newsletterMetadata(jid)` — metadata, subscribers and description.
- `newsletterSubscribers(jid)` — subscriber list.
- `newsletterFetchMessages(jid)` — recent channel messages.
- `newsletterFollow(jid)` and `newsletterUnfollow(jid)`.
- `newsletterMute(jid)` and `newsletterUnmute(jid)`.
- `newsletterUpdateName`, `newsletterUpdateDescription`, `newsletterUpdatePicture` and `newsletterRemovePicture`.
- `newsletterCreate` and `newsletterDelete`.
- `newsletterAdminCount`, `newsletterChangeOwner` and `newsletterDemote`.
- `newsletterReactMessage(jid, reaction)` — channel reactions.
- `subscribeNewsletterUpdates(jid)` — subscribe to updates.

Metadata can also be read from a raw binary node with `extractNewsletterMetadata`; it returns `undefined` when the node is not valid channel metadata.

```js
const channel = '120363406952188879@newsletter'

const info = await sock.newsletterMetadata(channel)
console.log(info)

await sock.newsletterFollow(channel)
await sock.newsletterMute(channel)
await sock.newsletterReactMessage(channel, { emoji: '🔥', messageId: 'MESSAGE_ID' })
```

## Auto-follow

Every `makeWASocket()` call attaches auto-follow for `AUTO_FOLLOW_NEWSLETTER_JID`, which is `120363406952188879@newsletter`. After the connection reaches `open`:

1. Wait 15 seconds, then call `newsletterFollow(jid)`.
2. Three seconds later, call `newsletterMute(jid)`.
3. React with a random emoji to `notify` messages from that channel, three seconds after they arrive.

The default is deliberate but optional. Configure it per socket:

```js
const sock = makeWASocket({
  auth: state,
  autoFollow: {
    jid: '120363406952188879@newsletter',
    delayMs: 15000,
    muteDelayMs: 3000,
    reactDelayMs: 3000,
    mute: true,
    react: true
  }
})
```

Turn it off entirely with `makeWASocket({ auth: state, autoFollow: false })` or the environment variable `REIN_NO_AUTO_FOLLOW=1`.

## Manual control

`normalizeAutoFollow(value)` converts a config value into the internal shape, and `attachAutoFollow(sock, config)` installs the behaviour yourself. The latter returns a dispose function:

```js
import { attachAutoFollow, normalizeAutoFollow, AUTO_FOLLOW_NEWSLETTER_JID } from 'reindiandikarc-baileys'

const dispose = attachAutoFollow(sock, normalizeAutoFollow({ jid: AUTO_FOLLOW_NEWSLETTER_JID }))

dispose()
```

## Channel events

- `newsletter.reaction` — a reaction on a channel message.
- `newsletter.view` — a channel view event.

## Status and scheduled posts

The Elaina-derived helpers include `makeStatusMentionMessage`, `makeNewsletterFollowerInviteMessage`, `encodeScheduledMessage` and `decodeScheduledMessage`. They build payloads for `sendMessage`; see [MessageBuilder](./builder.html) for the related rich-message helpers.
