# Newsletter

Channel WhatsApp muncul sebagai newsletter dengan JID berakhiran `@newsletter`. REIN BAILEYS menyediakan method newsletter lengkap dan helper auto-follow yang aktif secara bawaan.

## Method newsletter

- `newsletterMetadata(jid)` — metadata, subscriber, dan deskripsi.
- `newsletterSubscribers(jid)` — daftar subscriber.
- `newsletterFetchMessages(jid)` — pesan terbaru di channel.
- `newsletterFollow(jid)` dan `newsletterUnfollow(jid)`.
- `newsletterMute(jid)` dan `newsletterUnmute(jid)`.
- `newsletterUpdateName`, `newsletterUpdateDescription`, `newsletterUpdatePicture`, dan `newsletterRemovePicture`.
- `newsletterCreate` dan `newsletterDelete`.
- `newsletterAdminCount`, `newsletterChangeOwner`, dan `newsletterDemote`.
- `newsletterReactMessage(jid, reaction)` — reaksi pada pesan channel.
- `subscribeNewsletterUpdates(jid)` — berlangganan pembaruan.

Metadata juga bisa dibaca dari node binary mentah lewat `extractNewsletterMetadata`; fungsi ini mengembalikan `undefined` kalau node bukan metadata channel yang valid.

```js
const channel = '120363406952188879@newsletter'

const info = await sock.newsletterMetadata(channel)
console.log(info)

await sock.newsletterFollow(channel)
await sock.newsletterMute(channel)
await sock.newsletterReactMessage(channel, { emoji: '🔥', messageId: 'MESSAGE_ID' })
```

## Auto-follow

Setiap pemanggilan `makeWASocket()` memasang auto-follow untuk `AUTO_FOLLOW_NEWSLETTER_JID`, yaitu `120363406952188879@newsletter`. Setelah koneksi `open`:

1. Tunggu 15 detik, lalu panggil `newsletterFollow(jid)`.
2. Tiga detik kemudian, panggil `newsletterMute(jid)`.
3. Beri reaksi emoji acak pada pesan `notify` dari channel itu, tiga detik setelah pesan masuk.

Perilaku bawaan ini bisa diatur per socket:

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

Matikan seluruhnya dengan `makeWASocket({ auth: state, autoFollow: false })` atau lewat variabel lingkungan `REIN_NO_AUTO_FOLLOW=1`.

## Kontrol manual

`normalizeAutoFollow(value)` mengubah nilai konfigurasi menjadi bentuk internal, sementara `attachAutoFollow(sock, config)` memasang perilakunya sendiri. Fungsi terakhir mengembalikan fungsi dispose:

```js
import { attachAutoFollow, normalizeAutoFollow, AUTO_FOLLOW_NEWSLETTER_JID } from 'reindiandikarc-baileys'

const dispose = attachAutoFollow(sock, normalizeAutoFollow({ jid: AUTO_FOLLOW_NEWSLETTER_JID }))

dispose()
```

## Event channel

- `newsletter.reaction` — reaksi pada pesan channel.
- `newsletter.view` — event penayangan channel.

## Status dan postingan terjadwal

Paket ini juga menyediakan `makeStatusMentionMessage`, `makeNewsletterFollowerInviteMessage`, `encodeScheduledMessage`, dan `decodeScheduledMessage`. Semuanya membentuk payload untuk `sendMessage`; helper pesan kaya lainnya ada di [MessageBuilder](./builder.html).
