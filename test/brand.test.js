import test from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { BRAND, gradientText, getBrandLines, printBrand, printPairingNotice } from '../lib/Brand/index.js'

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, '')

test('brand constants match spec', () => {
  assert.equal(BRAND.name, 'REINDIANDIKARC BAILEYS')
  assert.equal(BRAND.version, '7.0.0-rc13.1')
  assert.equal(BRAND.boxWidth, 60)
})

test('gradientText emits truecolor ANSI per character', () => {
  const out = gradientText('AB')
  assert.match(out, /\x1b\[38;2;\d+;\d+;\d+m/)
  assert.match(out, /\x1b\[0m$/)
})

test('getBrandLines has fixed width and brand text', () => {
  const lines = getBrandLines()
  assert.equal(lines.length, 6)
  assert.ok(lines[1].includes('R E I N D I A N D I K A R C'))
  assert.ok(lines.every(line => line.length >= 50))
})

test('NO_COLOR disables ANSI', () => {
  const prev = process.env.NO_COLOR
  process.env.NO_COLOR = '1'
  try {
    assert.equal(gradientText('AB'), 'AB')
  } finally {
    if (prev === undefined) delete process.env.NO_COLOR
    else process.env.NO_COLOR = prev
  }
})

test('printBrand writes once per process', () => {
  const stream = new PassThrough()
  let output = ''
  stream.on('data', chunk => { output += chunk })
  assert.equal(printBrand({ stream }), true)
  assert.equal(printBrand({ stream }), false)
  assert.match(stripAnsi(output), /R E I N D I A N D I K A R C/)
})

test('printPairingNotice shows pairing code', () => {
  const stream = new PassThrough()
  let output = ''
  stream.on('data', chunk => { output += chunk })
  printPairingNotice({ pairingCode: 'A1B2-C3D4', stream })
  assert.match(stripAnsi(output), /PAIRING CODE/)
  assert.match(stripAnsi(output), /A1B2-C3D4/)
})
