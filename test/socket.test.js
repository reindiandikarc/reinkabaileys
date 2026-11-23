import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { attachPairingNoticeListener, wrapPairingCodeNotice } from '../lib/Brand/hooks.js'

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, '')

const collect = (stream) => {
  let output = ''
  stream.on('data', chunk => { output += chunk })
  return () => output
}

test('QR event prints branded notice once', () => {
  const ev = new EventEmitter()
  const stream = new PassThrough()
  const output = collect(stream)
  const dispose = attachPairingNoticeListener(ev, { brand: {} }, stream)
  ev.emit('connection.update', { qr: '2@ABCDEFG' })
  ev.emit('connection.update', { qr: '2@ABCDEFG' })
  dispose()
  assert.match(stripAnsi(output()), /QR READY/)
  assert.equal(stripAnsi(output()).split('QR READY').length - 1, 1)
})

test('config opt-out disables notice', () => {
  const ev = new EventEmitter()
  const stream = new PassThrough()
  const output = collect(stream)
  attachPairingNoticeListener(ev, { brand: { pairingNotice: false } }, stream)
  ev.emit('connection.update', { qr: 'x' })
  assert.equal(output(), '')
})

test('wrapPairingCodeNotice preserves return value', async () => {
  const stream = new PassThrough()
  const output = collect(stream)
  const original = async () => 'A1B2-C3D4'
  const wrapped = wrapPairingCodeNotice(original, { brand: {} }, stream)
  assert.equal(await wrapped('6281234567890'), 'A1B2-C3D4')
  assert.match(stripAnsi(output()), /A1B2-C3D4/)
})

test('real socket emits one branded QR notice and wraps pairing code', async () => {
  const { WebSocketServer } = await import('ws')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { default: makeWASocket, useMultiFileAuthState } = await import('../lib/index.js')
  const dir = await mkdtemp(join(tmpdir(), 'reindi-brand-'))
  const wss = new WebSocketServer({ port: 0 })
  await new Promise(resolve => wss.once('listening', resolve))
  const port = wss.address().port
  const writes = []
  const originalWrite = process.stdout.write
  process.stdout.write = (chunk, ...args) => {
    writes.push(String(chunk))
    return true
  }
  try {
    const { state } = await useMultiFileAuthState(dir)
    const sock = makeWASocket({
      auth: state,
      waWebSocketUrl: `ws://127.0.0.1:${port}`,
      connectTimeoutMs: 1500
    })
    assert.equal(sock.requestPairingCode.name, 'brandedRequestPairingCode')
    sock.ev.emit('connection.update', { qr: '2@LIVEQR' })
    sock.ev.emit('connection.update', { qr: '2@LIVEQR' })
    const output = writes.join('')
    assert.equal(stripAnsi(output).split('QR READY').length - 1, 1)
    sock.ws?.close?.()
  } finally {
    process.stdout.write = originalWrite
    await new Promise(resolve => wss.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})

test('makeWASocket constructs and emits connecting without exception', async () => {
  const { WebSocketServer } = await import('ws')
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { default: makeWASocket, useMultiFileAuthState } = await import('../lib/index.js')
  const dir = await mkdtemp(join(tmpdir(), 'reindi-auth-'))
  const wss = new WebSocketServer({ port: 0 })
  await new Promise(resolve => wss.once('listening', resolve))
  const port = wss.address().port
  try {
    const { state, saveCreds } = await useMultiFileAuthState(dir)
    const sock = makeWASocket({
      auth: state,
      waWebSocketUrl: `ws://127.0.0.1:${port}`,
      connectTimeoutMs: 1500,
      brand: { pairingNotice: false }
    })
    sock.ev.on('creds.update', saveCreds)
    const connected = await new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 1200)
      sock.ev.on('connection.update', update => {
        if (update.connection === 'connecting') {
          clearTimeout(timer)
          resolve(true)
        }
      })
    })
    assert.equal(connected, true)
    sock.ws?.close?.()
  } finally {
    await new Promise(resolve => wss.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
})
