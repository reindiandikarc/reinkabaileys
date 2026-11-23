# Grup

## Method grup pada socket

`makeWASocket()` sudah menyertakan lapisan socket grup. Semua method dipanggil dari `sock`.

- `groupCreate(subject, participants)` — buat grup dengan array JID.
- `groupLeave(jid)` — keluar dari grup.
- `groupUpdateSubject(jid, subject)` dan `groupUpdateDescription(jid, description)` — ubah metadata.
- `groupParticipantsUpdate(jid, participants, action)` — `add`, `remove`, `promote`, atau `demote`.
- `groupRequestParticipantsList(jid)` dan `groupRequestParticipantsUpdate(jid, jids, action)` — antrean persetujuan, dengan `approve` atau `reject`.
- `groupInviteCode(jid)` dan `groupRevokeInvite(jid)` — kelola tautan undangan.
- `groupAcceptInvite(code)` dan `groupGetInviteInfo(code)` — gabung atau lihat info lewat kode undangan.
- `groupToggleEphemeral(jid, expiration)` — pesan yang hilang dengan sendirinya.
- `groupSettingUpdate(jid, setting)` — pengaturan grup.
- `groupMemberAddMode(jid, mode)` dan `groupJoinApprovalMode(jid, value)` — aturan keanggotaan.

```js
const group = '120363012345678901@g.us'

const { gid } = await sock.groupCreate('Pengguna REIN', ['6281234567890@s.whatsapp.net'])
await sock.groupUpdateDescription(gid, 'Dibuat dengan reindiandikarc-baileys')
await sock.groupParticipantsUpdate(gid, ['6281987654321@s.whatsapp.net'], 'add')
console.log(await sock.groupInviteCode(gid))
```

## Event

- `groups.upsert` — grup baru.
- `groups.update` — metadata berubah.
- `chats.upsert` — catatan chat grup.

```js
sock.ev.on('groups.update', updates => {
  for (const update of updates) console.log(update.id, update.subject)
})
```

## Komunitas

Lapisan komunitas menyediakan:

- `communityCreate` dan `communityCreateGroup`
- `communityLinkGroup` dan `communityUnlinkGroup`
- `communityFetchLinkedGroups`
- `communityUpdateSubject` dan `communityUpdateDescription`
- `communityParticipantsUpdate`
- `communityRequestParticipantsList` dan `communityRequestParticipantsUpdate`
- `communityInviteCode`, `communityRevokeInvite`, dan `communityGetInviteInfo`
- `communityLeave`

Caranya dipanggil sama seperti method grup, dengan JID komunitas sebagai argumen pertama.

## Cache metadata grup

`makeWASocket()` membaca `cachedGroupMetadata` setiap kali ada pesan grup. Mengisinya menghindari query metadata berulang:

```js
const metadata = new Map()

const sock = makeWASocket({
  auth: state,
  cachedGroupMetadata: async jid => metadata.get(jid)
})
```

Helper `isUsableGroupMetadata` mengecek apakah objek hasil cache cukup lengkap untuk dipakai ulang. Operasi grup tetap tunduk pada aturan privasi server, meskipun pesertanya ada di daftar kontak; siapkan penanganan untuk error `permissionDenied` dan jangan menganggap aksi admin pasti berhasil.
