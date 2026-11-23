# MessageBuilder

`MessageBuilder` — juga diekspor sebagai `MB` — berasal dari Elaina Baileys. Pustaka ini menyusun pesan interaktif yang tidak bisa dibuat hanya dengan payload `sendMessage` biasa: tombol native flow, list, carousel, dan respons AI kaya.

## Tombol

Setiap builder menerima socket sebagai argumen pertama, dirangkai dengan method setter, lalu ditutup dengan `send(jid)`:

```js
import { MB } from 'reindiandikarc-baileys'

const jid = '6281234567890@s.whatsapp.net'

await new MB.Button(sock)
  .setTitle('REIN BAILEYS')
  .setBody('Pilih salah satu')
  .setFooter('Ditenagai reindiandikarc-baileys')
  .addReply('Ya', 'ya')
  .addReply('Tidak', 'tidak')
  .send(jid)
```

`addButton(name, params)`, `addSelection(title, options)`, `makeSection(title)`, `makeRow(header, title, description, id)`, `addCall`, `addReminder`, dan `addLocation` mencakup jenis tombol native flow. `setImage`, `setVideo`, `setDocument`, dan `setMedia` menambahkan lampiran. `build(jid)` mengembalikan pesan tanpa mengirimkannya.

`ButtonV2` adalah builder tombol kedua, sedangkan `Carousel` menyusun beberapa kartu menjadi pesan yang bisa digeser.

## AIRich

```js
import { AIRich } from 'reindiandikarc-baileys'

await new AIRich(sock)
  .addText('Jawaban dari REIN')
  .addText('Disusun dengan MessageBuilder')
  .send(jid)
```

`AIRich` mendukung unified response bersekesi. Ekspor `AI_RICH_LAYOUTS`, `AI_RICH_PRIMITIVES`, dan helper `*Section` menggambarkan bentuk yang tersedia. `Toolkit` mengumpulkan helper konstruksi tingkat rendah.

## Native flow dan A2UI

- `NATIVE_FLOW_NAMES` berisi daftar nama tombol native flow yang didukung.
- `checkNativeFlowButtons` memeriksa daftar tombol sebelum dikirim.
- `a2uiCard`, `a2uiColumn`, `a2uiRow`, `a2uiText`, `a2uiImage`, dan `a2uiSurface` menyusun komponen A2UI.
- `sendA2UI(sock, jid, components, options)` mengirimkannya.

```js
import { a2uiCard, a2uiColumn, a2uiText, sendA2UI } from 'reindiandikarc-baileys'

await sendA2UI(sock, jid, [
  a2uiText('text-1', 'Halo dari REIN'),
  a2uiColumn('column-1', ['text-1']),
  a2uiCard('card-1', 'column-1')
])
```

## HTML app dan helper lain

`checkHtmlApp` dan `withHtmlMultiplayer` membantu pesan HTML app. `sendHtmlApp`, `sendHtmlDocument`, dan `sendA2UI` adalah helper siap pakai yang menerima socket sebagai argumen pertama.

Builder lanjutan lainnya:

- `makeEventInviteMessage`, `makePollAddOptionMessage`, dan `makeQuestionMessage`
- `makeStatusMentionMessage` dan `makeNewsletterFollowerInviteMessage`
- `makeScheduledCallCreationMessage`
- `buildPaymentReminder`, `buildSplitPayment`, `buildMusicMessage`, dan `readMusicMessage`
- `validateUsername`, `displayUsername`, dan `getBotListV2`
- `encodeScheduledMessage` dan `decodeScheduledMessage`
- `buildSocialPreview` untuk metadata preview tautan
- `bindVoiceRecognition`, `hasOptionalMedia`, `loadFfmpeg`, dan `loadSharp`

## Error

`AIRichError`, `ItemNotFoundError`, `DuplicateIdError`, `InvalidTargetError`, dan `ContentValidationError` diekspor supaya kamu bisa membedakan payload builder yang salah dari kegagalan jaringan.

## VoIP

`makeVoipClient(sock, config)` membuat klien panggilan. Bersamanya ada `VoipClient`, `ActiveCall`, `CallState`, `VideoFeeder`, `AudioFeeder`, `TTLCache`, dan `isUsableGroupMetadata`. Aset WASM sudah ikut di `src/assets/wasm/`.

```js
import { makeVoipClient } from 'reindiandikarc-baileys'

const voip = await makeVoipClient(sock)
```
