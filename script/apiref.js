import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const exported = new Set()
const visited = new Set()
const cache = new Map()

const readSource = path => {
  if (!cache.has(path)) cache.set(path, existsSync(path) ? readFileSync(path, 'utf8') : '')
  return cache.get(path)
}

const collect = (path, depth = 0) => {
  if (depth > 12 || visited.has(path)) return
  visited.add(path)
  const source = readSource(path)
  if (!source) return
  const base = dirname(path)

  for (const match of source.matchAll(/export\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]\s*;?/g)) {
    exported.add(match[1])
    const target = resolve(base, match[2])
    if (target.startsWith(root)) collect(target, depth + 1)
  }

  for (const match of source.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]\s*;?/g)) {
    const target = resolve(base, match[1])
    if (target.startsWith(root)) collect(target, depth + 1)
  }

  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}\s*(?:from\s+['"]([^'"]+)['"]\s*)?;?/g)) {
    if (match[2]) {
      const target = resolve(base, match[2])
      if (target.startsWith(root)) collect(target, depth + 1)
    }
    for (const part of match[1].split(',')) {
      const clause = part.trim().replace(/^type\s+/, '')
      if (!clause) continue
      const pieces = clause.split(/\s+as\s+/)
      const name = (pieces.length > 1 ? pieces[1] : pieces[0]).trim()
      if (name) exported.add(name)
    }
  }

  for (const match of source.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    exported.add(match[1])
  }

  for (const match of source.matchAll(/export\s+default\s+(?!function\s+[A-Za-z_$]|class\s+[A-Za-z_$])/g)) {
    exported.add('default')
  }
}

collect(join(root, 'src', 'index.js'))

const CATEGORIES = [
  { id: 'socket', en: 'Socket & factories', idText: 'Socket & factory', match: /^(default|makeWASocket|makeVoipClient|VoipClient|ActiveCall|CallState|VideoFeeder|AudioFeeder|VIDEO_FORMAT_I420|makeMutex|waitForSocketOpen|waitForConnectionUpdate|waitForMessage|requestPairingCode|logout|end)$/ },
  { id: 'auth', en: 'Auth state & sessions', idText: 'Auth state & sesi', match: /^(use|CREDS_KEY|encodeAuthValue|decodeAuthValue|makeAuthStateFromStore|loadOptionalModule)/ },
  { id: 'auto-follow', en: 'Newsletter & auto-follow', idText: 'Newsletter & auto-follow', match: /^(newsletter|AUTO_FOLLOW|attachAutoFollow|normalizeAutoFollow|extractNewsletterMetadata|subscribeNewsletterUpdates)/i },
  { id: 'groups', en: 'Groups & communities', idText: 'Grup & komunitas', match: /^(group|community|isUsableGroupMetadata)/i },
  { id: 'builder', en: 'MessageBuilder & rich messages', idText: 'MessageBuilder & pesan kaya', match: /^(MessageBuilder|MB$|Button|Carousel|AIRich|Toolkit|makeEventInviteMessage|makePollAddOptionMessage|makeQuestionMessage|makeScheduledCallCreationMessage|makeStatusMentionMessage|makeNewsletterFollowerInviteMessage|encodeScheduledMessage|decodeScheduledMessage|NATIVE_FLOW_NAMES|checkNativeFlowButtons|a2ui|checkHtmlApp|withHtmlMultiplayer|sendA2UI|sendHtml|validateUsername|displayUsername|prepareFileArtifact)/ },
  { id: 'store', en: 'Store, events & queues', idText: 'Store, event & antrean', match: /^(makeInMemoryStore|waChatKey|waMessageID|waLabelAssociationKey|makeOrderedDictionary|ObjectRepository|captureEventStream|readAndEmitEventStream|queueJob|TTLCache|makeEventBuffer)/ },
  { id: 'brand', en: 'Branding & notices', idText: 'Branding & notifikasi', match: /^(BRAND|printBrand|getBrandLines|gradientText|printPairingNotice|attachPairingNoticeListener|wrapPairingCodeNotice|getBotJid)/ },
  { id: 'media', en: 'Media, voice & link preview', idText: 'Media, suara & preview tautan', match: /^(hasOptionalMedia|loadFfmpeg|loadSharp|bindVoiceRecognition|buildSocialPreview|buildPaymentReminder|buildSplitPayment|buildMusicMessage|readMusicMessage|downloadMediaMessage)/ },
  { id: 'constants', en: 'Constants & generated types', idText: 'Konstanta & tipe bangkitan', match: /^([A-Z][A-Z0-9_]*|\$)/ },
  { id: 'other', en: 'Other exports', idText: 'Ekspor lainnya', match: /./ }
]

const grouped = CATEGORIES.map(category => ({ ...category, names: [] }))
const sorted = Array.from(exported).sort((a, b) => a.localeCompare(b))
for (const name of sorted) {
  const target = grouped.find(category => category.match.test(name))
  target.names.push(name)
}

const version = pkg.version || 'unknown'
const total = sorted.length
const categoryCount = grouped.filter(category => category.names.length).length

const render = (language, heading, intro) => {
  const lines = [heading, '', intro.replace('{total}', String(total)).replace('{categories}', String(categoryCount)).replace('{package}', pkg.name).replace('{version}', version), '']
  for (const category of grouped) {
    if (!category.names.length) continue
    lines.push(`## ${language === 'en' ? category.en : category.idText}`, '')
    for (const name of category.names) lines.push(`- \`${name}\``)
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}

const en = render('en', '# API reference', 'Generated from `src/index.js` for `{package}` v{version}. {total} exported names in {categories} categories. Socket methods such as `sendMessage` and `requestPairingCode` live on the socket returned by `makeWASocket`; this page lists module exports only.')
const id = render('id', '# Referensi API', 'Dibangkitkan dari `src/index.js` untuk paket `{package}` v{version}. {total} nama ekspor dalam {categories} kategori. Method socket seperti `sendMessage` dan `requestPairingCode` tersedia pada objek yang dikembalikan `makeWASocket`; halaman ini hanya mencantumkan ekspor modul.')

mkdirSync(join(root, 'docs', 'en'), { recursive: true })
mkdirSync(join(root, 'docs', 'id'), { recursive: true })
writeFileSync(join(root, 'docs', 'en', 'api-reference.md'), en)
writeFileSync(join(root, 'docs', 'id', 'api-reference.md'), id)
console.log(`Wrote API reference: ${total} exports in ${categoryCount} categories`)
