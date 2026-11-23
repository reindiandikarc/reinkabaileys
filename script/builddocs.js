import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(root, 'docs')
const out = process.argv[2] ? resolve(root, process.argv[2]) : join(root, 'site')
const meta = JSON.parse(readFileSync(join(docs, 'meta.json'), 'utf8'))

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

const slugify = value => String(value)
  .replace(/`/g, '')
  .replace(/\*\*/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || 'section'

const inline = (text, strings) => {
  let value = escapeHtml(text)
  const spans = []
  value = value.replace(/`([^`]+)`/g, (_, code) => {
    spans.push(`<code>${code}</code>`)
    return `\u0000${spans.length - 1}\u0000`
  })
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>')
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  value = value.replace(/\u0000(\d+)\u0000/g, (_, index) => spans[Number(index)] || '')
  return value
}

const isBlockStart = line => /^(#{1,4})\s+/.test(line)
  || /^\s*(?:[-*]|\d+\.)\s+/.test(line)
  || /^>/.test(line)
  || /^---+\s*$/.test(line)
  || line.startsWith('```')

const renderMarkdown = (source, strings) => {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const html = []
  const headings = []
  let index = 0
  let fenceLanguage = ''
  let code = []

  const flushCode = () => {
    const language = escapeHtml(fenceLanguage || 'text')
    html.push(`<div class="code-block"><div class="code-head"><span>${language}</span><button type="button" data-copy data-copied="${escapeHtml(strings.copied)}">${escapeHtml(strings.copy)}</button></div><pre><code class="language-${language}">${escapeHtml(code.join('\n'))}</code></pre></div>`)
    code = []
    fenceLanguage = ''
  }

  while (index < lines.length) {
    const line = lines[index]

    if (line.startsWith('```')) {
      fenceLanguage = line.slice(3).trim().split(/\s+/)[0] || ''
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      flushCode()
      continue
    }

    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const id = slugify(heading[2])
      if (level <= 3) headings.push({ level, text: escapeHtml(heading[2].replace(/`/g, '').replace(/\*\*/g, '')), id })
      html.push(`<h${level} id="${id}">${inline(heading[2], strings)}<a class="anchor" href="#${id}" aria-hidden="true">#</a></h${level}>`)
      index += 1
      continue
    }

    if (/^---+\s*$/.test(line)) {
      html.push('<hr>')
      index += 1
      continue
    }

    const listItem = /^\s*([-*]|\d+\.)\s+(.+)$/.exec(line)
    if (listItem) {
      const ordered = /\d/.test(listItem[1])
      const items = []
      while (index < lines.length) {
        const current = /^\s*([-*]|\d+\.)\s+(.+)$/.exec(lines[index])
        if (!current || /\d/.test(current[1]) !== ordered) break
        items.push(`<li>${inline(current[2].trim(), strings)}</li>`)
        index += 1
      }
      const tag = ordered ? 'ol' : 'ul'
      html.push(`<${tag} class="doc-list">${items.join('')}</${tag}>`)
      continue
    }

    if (line.startsWith('>')) {
      const parts = []
      while (index < lines.length && lines[index].startsWith('>')) {
        parts.push(lines[index].replace(/^>\s?/, ''))
        index += 1
      }
      html.push(`<blockquote class="callout">${inline(parts.join(' '), strings)}</blockquote>`)
      continue
    }

    const paragraph = []
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(' '), strings)}</p>`)
    else index += 1
  }

  if (code.length || fenceLanguage) flushCode()
  return { html: html.join('\n'), headings }
}

const layout = ({ language, page, body, headings }) => {
  const strings = meta.strings[language]
  const other = language === 'en' ? 'id' : 'en'
  const nav = meta.pages.map(entry => {
    const active = entry.id === page.id ? ' class="active"' : ''
    const badge = entry.generated ? ' <span class="nav-badge">gen</span>' : ''
    return `<a href="./${entry.id}.html"${active}>${escapeHtml(entry.title[language])}${badge}</a>`
  }).join('')

  const isHome = page.id === 'index'
  let article = body
  if (isHome) article = article.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '')
  const toc = headings.length && !isHome
    ? `<nav class="toc" aria-label="${escapeHtml(strings.onThisPage)}"><span class="toc-title">${escapeHtml(strings.onThisPage)}</span>${headings.filter(heading => heading.level === 2).map(heading => `<a href="#${heading.id}">${heading.text}</a>`).join('')}</nav>`
    : ''

  const hero = isHome
    ? `<section class="hero">
  <div class="hero-banner" aria-hidden="true">╭──────────────────────────────────╮<br>│  ✦  R E I N   B A I L E Y S     │<br>╰──────────────────────────────────╯</div>
  <p class="eyebrow">v${escapeHtml(meta.site.version)} · ${escapeHtml(strings.heroTag)}</p>
  <h1>${escapeHtml(meta.site.name)}</h1>
  <p class="lead">${escapeHtml(strings.heroLead)}</p>
  <div class="hero-actions">
    <a class="btn btn-primary" href="./getting-started.html">${escapeHtml(strings.heroStart)}</a>
    <a class="btn btn-quiet" href="./api-reference.html">${escapeHtml(strings.heroApi)}</a>
  </div>
</section>`
    : ''

  return `<!doctype html>
<html lang="${language}" data-page="${page.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title[language])} — ${escapeHtml(meta.site.name)}</title>
<meta name="description" content="${escapeHtml(page.description[language])}">
<meta property="og:title" content="${escapeHtml(page.title[language])} — ${escapeHtml(meta.site.name)}">
<meta property="og:description" content="${escapeHtml(page.description[language])}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230d1020'/%3E%3Ctext x='50%25' y='.72em' text-anchor='middle' font-size='38' fill='%23ff4d8d'%3E%E2%9C%A6%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<a class="skip" href="#content">${escapeHtml(strings.skip)}</a>
<header class="topbar">
  <button class="menu-toggle" type="button" data-menu aria-label="${escapeHtml(strings.menu)}">☰</button>
  <a class="brand" href="./index.html"><span class="brand-mark">✦</span><span>${escapeHtml(meta.site.name)}</span></a>
  <span class="version">v${escapeHtml(meta.site.version)}</span>
  <div class="topbar-actions">
    <a class="lang" href="../${other}/${page.id}.html">${other === 'en' ? 'EN' : 'ID'}</a>
    <button class="theme" type="button" data-theme-toggle aria-label="${escapeHtml(strings.theme)}">◐</button>
    <a class="ghlink" href="${escapeHtml(meta.site.repository)}" rel="noreferrer">GitHub</a>
  </div>
</header>
<div class="shell">
  <aside class="sidebar" data-sidebar>
    <nav class="side-nav" aria-label="${escapeHtml(meta.site.name)}">${nav}</nav>
    <div class="sidebar-foot"><code>${escapeHtml(meta.site.package)}</code></div>
  </aside>
  <main id="content">
    ${toc}
    ${hero}
    <article class="prose">${article}</article>
    <footer class="page-foot"><p>${strings.footer.replace('{repo}', `<a href="${escapeHtml(meta.site.repository)}" rel="noreferrer">GitHub</a>`)}</p></footer>
  </main>
</div>
<script src="../assets/app.js"></script>
</body>
</html>
`
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'assets'), { recursive: true })

let written = 0
for (const language of meta.languages) {
  mkdirSync(join(out, language), { recursive: true })
  for (const page of meta.pages) {
    const source = join(docs, language, `${page.id}.md`)
    if (!existsSync(source)) {
      if (page.generated) {
        console.log(`Skipping ${language}/${page.id}: run node script/apiref.js first`)
        continue
      }
      throw new Error(`Missing docs page: ${language}/${page.id}.md`)
    }
    const rendered = renderMarkdown(readFileSync(source, 'utf8'), meta.strings[language])
    writeFileSync(join(out, language, `${page.id}.html`), layout({ language, page, body: rendered.html, headings: rendered.headings }))
    written += 1
  }
}

cpSync(join(docs, 'assets'), join(out, 'assets'), { recursive: true })
writeFileSync(join(out, '.nojekyll'), '')
writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(meta.site.name)}</title>
<link rel="canonical" href="./en/index.html">
<meta http-equiv="refresh" content="0; url=./en/index.html">
<script>
const preferred = (navigator.language || 'en').toLowerCase().startsWith('id') ? 'id' : 'en'
location.replace('./' + preferred + '/index.html')
</script>
</head>
<body><p><a href="./en/index.html">English</a> · <a href="./id/index.html">Bahasa Indonesia</a></p></body>
</html>
`)
if (meta.site.domain) writeFileSync(join(out, 'CNAME'), `${meta.site.domain}\n`)
console.log(`Built ${written} pages into ${out}`)
