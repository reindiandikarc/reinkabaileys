# Groups

## Group methods on the socket

`makeWASocket()` includes the group socket layer. All methods are called on `sock`.

- `groupCreate(subject, participants)` — create a group with an array of JIDs.
- `groupLeave(jid)` — leave a group.
- `groupUpdateSubject(jid, subject)` and `groupUpdateDescription(jid, description)` — edit metadata.
- `groupParticipantsUpdate(jid, participants, action)` — `add`, `remove`, `promote` or `demote`.
- `groupRequestParticipantsList(jid)` and `groupRequestParticipantsUpdate(jid, jids, action)` — approval queue, with `approve` or `reject`.
- `groupInviteCode(jid)` and `groupRevokeInvite(jid)` — manage the invite link.
- `groupAcceptInvite(code)` and `groupGetInviteInfo(code)` — join or inspect by invite code.
- `groupToggleEphemeral(jid, expiration)` — disappearing messages.
- `groupSettingUpdate(jid, setting)` — group settings.
- `groupMemberAddMode(jid, mode)` and `groupJoinApprovalMode(jid, value)` — membership rules.

```js
const group = '120363012345678901@g.us'

const { gid } = await sock.groupCreate('REIN users', ['6281234567890@s.whatsapp.net'])
await sock.groupUpdateDescription(gid, 'Built with reindiandikarc-baileys')
await sock.groupParticipantsUpdate(gid, ['6281987654321@s.whatsapp.net'], 'add')
console.log(await sock.groupInviteCode(gid))
```

## Events

- `groups.upsert` — a new group.
- `groups.update` — metadata changed.
- `chats.upsert` — group chat records.

```js
sock.ev.on('groups.update', updates => {
  for (const update of updates) console.log(update.id, update.subject)
})
```

## Communities

The community socket adds:

- `communityCreate` and `communityCreateGroup`
- `communityLinkGroup` and `communityUnlinkGroup`
- `communityFetchLinkedGroups`
- `communityUpdateSubject` and `communityUpdateDescription`
- `communityParticipantsUpdate`
- `communityRequestParticipantsList` and `communityRequestParticipantsUpdate`
- `communityInviteCode`, `communityRevokeInvite` and `communityGetInviteInfo`
- `communityLeave`

Call them with the community JID followed by the same arguments you would use for the corresponding group operation.

## Group metadata cache

`makeWASocket` reads `cachedGroupMetadata` on every group message. Supplying it avoids repeated metadata queries:

```js
const metadata = new Map()

const sock = makeWASocket({
  auth: state,
  cachedGroupMetadata: async jid => metadata.get(jid)
})
```

The exported `isUsableGroupMetadata` helper tells you whether a cached object is complete enough to reuse. Group operations rely on server-side privacy rules even when a participant is in your contact list; handle `permissionDenied` errors instead of assuming an admin action will succeed.
