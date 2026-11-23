import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const packageRoot = new URL('..', import.meta.url).pathname

test('ESM entry imports without module resolution errors', async () => {
  const mod = await import('../lib/index.js')
  assert.equal(typeof mod.makeWASocket, 'function')
  assert.equal(typeof mod.default, 'function')
  assert.equal(typeof mod.useMultiFileAuthState, 'function')
  assert.equal(typeof mod.DisconnectReason, 'object')
})

test('CommonJS entry exposes core, brand and ported exports', () => {
  const script = `
    const api = require('./lib/index.cjs')
    const required = ['makeWASocket','useMultiFileAuthState','DisconnectReason','BRAND','getBrandLines','gradientText','printBrand','printPairingNotice','makeInMemoryStore','attachPairingNoticeListener','wrapPairingCodeNotice','AUTO_FOLLOW_NEWSLETTER_JID']
    const missing = required.filter(k => !api[k])
    if (missing.length) { console.error('MISSING:' + missing.join(',')); process.exit(1) }
    if (typeof api.default !== 'function') { console.error('NO_DEFAULT'); process.exit(1) }
  `
  execFileSync(process.execPath, ['-e', script], { cwd: packageRoot, stdio: 'pipe' })
})

test('ESM and CJS export name sets agree on required keys', async () => {
  const esm = await import('../lib/index.js')
  const script = `process.stdout.write(JSON.stringify(Object.keys(require('./lib/index.cjs')).sort()))`
  const out = execFileSync(process.execPath, ['-e', script], { cwd: packageRoot, encoding: 'utf8' })
  const keys = new Set(JSON.parse(out))
  for (const key of ['makeWASocket', 'useMultiFileAuthState', 'DisconnectReason', 'BRAND', 'printBrand', 'printPairingNotice', 'makeInMemoryStore', 'queueJob', 'getBotJid', 'AUTO_FOLLOW_NEWSLETTER_JID']) {
    assert.ok(key in esm, `ESM missing ${key}`)
    assert.ok(keys.has(key), `CJS missing ${key}`)
  }
})
