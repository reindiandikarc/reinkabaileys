import test from 'node:test'
import assert from 'node:assert/strict'

test('ESM entry imports without module resolution errors', async () => {
  const mod = await import('../lib/index.js')
  assert.equal(typeof mod.makeWASocket, 'function')
  assert.equal(typeof mod.default, 'function')
  assert.equal(typeof mod.useMultiFileAuthState, 'function')
  assert.equal(typeof mod.DisconnectReason, 'object')
})
