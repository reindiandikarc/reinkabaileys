# MessageBuilder

`MessageBuilder` (also exported as `MB`) comes from Elaina Baileys. It builds interactive messages that a plain `sendMessage` payload cannot express: native-flow buttons, lists, carousels and AI-rich responses.

## Buttons

Builders take the socket as their first argument, chain setters, then call `send(jid)`:

```js
import { MB } from 'reindiandikarc-baileys'

const jid = '6281234567890@s.whatsapp.net'

await new MB.Button(sock)
  .setTitle('REIN BAILEYS')
  .setBody('Choose an option')
  .setFooter('Powered by reindiandikarc-baileys')
  .addReply('Yes', 'yes')
  .addReply('No', 'no')
  .send(jid)
```

`addButton(name, params)`, `addSelection(title, options)`, `makeSection(title)`, `makeRow(header, title, description, id)`, `addCall`, `addReminder` and `addLocation` cover the native-flow button types. `setImage`, `setVideo`, `setDocument` and `setMedia` add an attachment. `build(jid)` returns the message without sending it.

`ButtonV2` is the second button builder, and `Carousel` arranges several cards into a swipeable message.

## AIRich

```js
import { AIRich } from 'reindiandikarc-baileys'

await new AIRich(sock)
  .addText('Answer from REIN')
  .addText('Built with MessageBuilder')
  .send(jid)
```

`AIRich` supports unified responses with sections; `AI_RICH_LAYOUTS`, `AI_RICH_PRIMITIVES` and the `*Section` helpers in the exports describe the available shapes. `Toolkit` collects lower-level construction helpers.

## Native flow and A2UI

- `NATIVE_FLOW_NAMES` lists the supported native flow button names.
- `checkNativeFlowButtons` validates a button list before sending.
- `a2uiCard`, `a2uiColumn`, `a2uiRow`, `a2uiText`, `a2uiImage` and `a2uiSurface` build A2UI components.
- `sendA2UI(sock, jid, components, options)` sends them.

```js
import { a2uiCard, a2uiColumn, a2uiText, sendA2UI } from 'reindiandikarc-baileys'

await sendA2UI(sock, jid, [
  a2uiText('text-1', 'Hello from REIN'),
  a2uiColumn('column-1', ['text-1']),
  a2uiCard('card-1', 'column-1')
])
```

## HTML apps and rich helpers

`checkHtmlApp` and `withHtmlMultiplayer` help with HTML app messages. `sendHtmlApp`, `sendHtmlDocument` and `sendA2UI` are exported ready-to-call helpers that take a socket as their first argument.

Other advanced message builders:

- `makeEventInviteMessage`, `makePollAddOptionMessage` and `makeQuestionMessage`
- `makeStatusMentionMessage` and `makeNewsletterFollowerInviteMessage`
- `makeScheduledCallCreationMessage`
- `buildPaymentReminder`, `buildSplitPayment`, `buildMusicMessage` and `readMusicMessage`
- `validateUsername`, `displayUsername` and `getBotListV2`
- `encodeScheduledMessage` and `decodeScheduledMessage`
- `buildSocialPreview` for link preview metadata
- `bindVoiceRecognition`, `hasOptionalMedia`, `loadFfmpeg` and `loadSharp`

## Errors

`AIRichError`, `ItemNotFoundError`, `DuplicateIdError`, `InvalidTargetError` and `ContentValidationError` are exported so you can distinguish a bad builder payload from a network failure.

## VoIP

`makeVoipClient(sock, config)` creates the call client; `VoipClient`, `ActiveCall`, `CallState`, `VideoFeeder`, `AudioFeeder`, `TTLCache` and `isUsableGroupMetadata` come with it. The WASM assets are bundled under `lib/assets/wasm/`.

```js
import { makeVoipClient } from 'reindiandikarc-baileys'

const voip = await makeVoipClient(sock)
```
