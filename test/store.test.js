import test from 'node:test'
import assert from 'node:assert/strict'
import makeInMemoryStore, { waChatKey, waMessageID } from '../lib/Store/index.js'
import makeOrderedDictionary from '../lib/Store/make-ordered-dictionary.js'
import { ObjectRepository } from '../lib/Store/object-repository.js'

test('store exposes expected methods', () => {
  const store = makeInMemoryStore()
  for (const key of ['chats', 'contacts', 'messages', 'groupMetadata', 'presences', 'labels', 'labelAssociations', 'state']) {
    assert.ok(store[key], `missing ${key}`)
  }
  for (const key of ['bind', 'loadMessage', 'toJSON', 'fromJSON', 'writeToFile', 'readFromFile', 'loadMessages', 'fetchImageUrl', 'fetchGroupMetadata']) {
    assert.equal(typeof store[key], 'function', `missing ${key}`)
  }
})

test('ordered dictionary stores and retrieves', () => {
  const dict = makeOrderedDictionary(item => item.id)
  dict.upsert({ id: 'a' })
  assert.equal(dict.get('a').id, 'a')
})

test('object repository basic operations', () => {
  const repo = new ObjectRepository()
  repo.upsertById('a', { id: 'a' })
  assert.equal(repo.count(), 1)
})

test('store key helpers exist', () => {
  assert.equal(typeof waChatKey, 'function')
  assert.equal(typeof waMessageID, 'function')
})
