import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import queueJob from '../lib/Signal/Group/queue-job.js'
import { captureEventStream, readAndEmitEventStream } from '../lib/Utils/levvleys-event-stream.js'
import { getBotJid, extractNewsletterMetadata } from '../lib/Utils/ryuu-compat.js'

test('queueJob serializes async tasks', async () => {
  const order = []
  await Promise.all([
    queueJob(async () => {
      order.push(1)
      await new Promise(resolve => setTimeout(resolve, 5))
    }),
    queueJob(async () => {
      order.push(2)
    })
  ])
  assert.deepEqual(order, [1, 2])
})

test('queueJob accepts named buckets', async () => {
  const results = []
  await Promise.all([
    queueJob('bucket-a', async () => {
      await new Promise(resolve => setTimeout(resolve, 5))
      results.push('a')
    }),
    queueJob('bucket-a', async () => {
      results.push('b')
    })
  ])
  assert.deepEqual(results, ['a', 'b'])
})

test('event stream helpers are functions', () => {
  assert.equal(typeof captureEventStream, 'function')
  assert.equal(typeof readAndEmitEventStream, 'function')
})

test('event stream captures and replays events', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'reindi-stream-'))
  const file = join(dir, 'events.jsonl')
  try {
    const source = new EventEmitter()
    captureEventStream(source, file)
    source.emit('connection.update', { connection: 'open' })
    let text = ''
    for (let i = 0; i < 50 && !text; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 10))
      try {
        text = await readFile(file, 'utf8')
      } catch {}
    }
    assert.match(text, /connection.update/)
    const { ev, task } = readAndEmitEventStream(file, 0)
    const seen = new Promise(resolve => ev.once('connection.update', resolve))
    await task
    assert.deepEqual(await seen, { connection: 'open' })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('getBotJid maps a bot jid and preserves other jids', () => {
  assert.equal(getBotJid('867051314767696@bot'), '13135550002@s.whatsapp.net')
  assert.equal(getBotJid('6281234567890@s.whatsapp.net'), '6281234567890@s.whatsapp.net')
})

test('extractNewsletterMetadata is callable', () => {
  assert.equal(typeof extractNewsletterMetadata, 'function')
})
