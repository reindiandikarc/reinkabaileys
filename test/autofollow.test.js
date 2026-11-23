import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { attachAutoFollow, normalizeAutoFollow, AUTO_FOLLOW_NEWSLETTER_JID } from '../lib/AutoFollow/index.js'

const JID = '120363406952188879@newsletter'
const wait = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms))

const fakeSock = () => {
  const ev = new EventEmitter()
  return {
    ev,
    newsletterFollow: async () => {},
    newsletterMute: async () => {},
    sendMessage: async () => {}
  }
}

test('auto-follow targets the requested newsletter', () => {
  assert.equal(AUTO_FOLLOW_NEWSLETTER_JID, JID)
  assert.equal(normalizeAutoFollow().jid, JID)
  assert.equal(normalizeAutoFollow('6281234567890@newsletter').jid, '6281234567890@newsletter')
  assert.equal(normalizeAutoFollow({ jid: '1@newsletter', delayMs: 5 }).delayMs, 5)
  assert.equal(normalizeAutoFollow(false).enabled, false)
})

test('autoFollow:false attaches nothing', async () => {
  const sock = fakeSock()
  const calls = []
  sock.newsletterFollow = async jid => calls.push(jid)
  attachAutoFollow(sock, { autoFollow: false })
  sock.ev.emit('connection.update', { connection: 'open' })
  await wait()
  assert.deepEqual(calls, [])
})

test('follows and mutes the channel after open', async () => {
  const sock = fakeSock()
  const calls = []
  sock.newsletterFollow = async jid => calls.push(['follow', jid])
  sock.newsletterMute = async jid => calls.push(['mute', jid])
  const dispose = attachAutoFollow(sock, {
    autoFollow: { jid: JID, delayMs: 0, muteDelayMs: 0, react: false }
  })
  sock.ev.emit('connection.update', { connection: 'connecting' })
  sock.ev.emit('connection.update', { connection: 'open' })
  await wait()
  assert.deepEqual(calls, [['follow', JID], ['mute', JID]])
  dispose()
})

test('reacts only to messages from the followed channel', async () => {
  const sock = fakeSock()
  const calls = []
  sock.sendMessage = async (jid, content) => calls.push([jid, content])
  const dispose = attachAutoFollow(sock, {
    autoFollow: { jid: JID, delayMs: 1000, reactDelayMs: 0 }
  })
  sock.ev.emit('messages.upsert', { type: 'notify', messages: [{ key: { remoteJid: 'other@g.us', id: 'a' } }] })
  sock.ev.emit('messages.upsert', { type: 'append', messages: [{ key: { remoteJid: JID, id: 'b' } }] })
  sock.ev.emit('messages.upsert', { type: 'notify', messages: [{ key: { remoteJid: JID, id: 'c' } }] })
  await wait()
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], JID)
  assert.equal(calls[0][1].react.key.id, 'c')
  assert.match(calls[0][1].react.text, /❤️|🔥|👍|🎉|🤩|✨|💯|🚀/)
  dispose()
})

test('dispose removes listeners and pending timers', async () => {
  const sock = fakeSock()
  const calls = []
  sock.newsletterFollow = async jid => calls.push(jid)
  const dispose = attachAutoFollow(sock, {
    autoFollow: { jid: JID, delayMs: 10, mute: false, react: false }
  })
  sock.ev.emit('connection.update', { connection: 'open' })
  dispose()
  await wait(30)
  assert.deepEqual(calls, [])
  assert.equal(sock.ev.listenerCount('connection.update'), 0)
})

test('real makeWASocket wires auto-follow onto the returned socket', async () => {
  const { WebSocketServer } = await import('ws')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { default: makeWASocket, useMultiFileAuthState } = await import('../lib/index.js')
  const dir = await mkdtemp(join(tmpdir(), 'reindi-follow-'))
  const wss = new WebSocketServer({ port: 0 })
  await new Promise(resolve => wss.once('listening', resolve))
  const port = wss.address().port
  try {
    const { state } = await useMultiFileAuthState(dir)
    const sock = makeWASocket({
      auth: state,
      waWebSocketUrl: `ws://127.0.0.1:${port}`,
      connectTimeoutMs: 1500,
      autoFollow: { jid: JID, delayMs: 0, mute: false, react: false }
    })
    const calls = []
    sock.newsletterFollow = async jid => calls.push(jid)
    sock.ev.emit('connection.update', { connection: 'open' })
    await wait()
    assert.deepEqual(calls, [JID])
    sock.ws?.close?.()
  } finally {
    await new Promise(resolve => wss.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})
