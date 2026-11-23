const PALETTE_HEX = ['#ff4d8d', '#a855f7', '#22d3ee']

export const BRAND = Object.freeze({
  name: 'REINDIANDIKARC BAILEYS',
  version: '7.0.0-rc13.1',
  palette: PALETTE_HEX,
  boxWidth: 60
})

const hexToRgb = (hex) => {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ]
}

const noColor = () => process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === '0'

export function gradientText (text, palette = PALETTE_HEX) {
  if (noColor()) return text
  const stops = palette.map(hexToRgb)
  const chars = Array.from(text)
  return chars.map((char, i) => {
    const t = i / Math.max(1, chars.length - 1)
    const scaled = t * (stops.length - 1)
    const index = Math.min(stops.length - 2, Math.floor(scaled))
    const local = scaled - index
    const from = stops[index]
    const to = stops[index + 1]
    const [r, g, b] = from.map((channel, k) => Math.round(channel + (to[k] - channel) * local))
    return `\x1b[38;2;${r};${g};${b}m${char}`
  }).join('') + '\x1b[0m'
}

const innerWidth = BRAND.boxWidth - 2
const border = (left, right) => left + '─'.repeat(innerWidth) + right
const row = (content) => '│' + content.padEnd(innerWidth).slice(0, innerWidth) + '│'

export function getBrandLines () {
  const title = 'R E I N D I A N D I K A R C   B A I L E Y S'
  return [
    border('╭', '╮'),
    row('  ' + title),
    border('├', '┤'),
    row('  ✦  Fork rc13 · ESM + CJS · Multi-Device'),
    row('  ✦  v7.0.0-rc13.1 · WhiskeySockets × Ryuuxalya'),
    border('╰', '╯')
  ]
}

const write = (stream, text) => {
  const target = stream || process.stdout
  if (target && typeof target.write === 'function') target.write(text + '\n')
}

export function printBrand (options = {}) {
  const guard = '__REINDIANDIKARC_BAILEYS_BANNER__'
  if (globalThis[guard]) return false
  globalThis[guard] = true
  if (process.env.REINDIANDIKARC_NO_BANNER === '1') return false
  const lines = getBrandLines(options)
  write(options.stream, lines.map(line => gradientText(line)).join('\n'))
  return true
}

export function printPairingNotice (input = {}) {
  const { qr, pairingCode, stream } = input
  let text
  if (pairingCode) {
    text = `  ◆ REINDIANDIKARC • PAIRING CODE  ${pairingCode}  ◆`
  } else if (qr) {
    text = '  ◆ REINDIANDIKARC • QR READY  ◆'
  } else {
    return
  }
  write(stream, gradientText(text))
}
