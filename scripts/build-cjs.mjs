import { build } from 'esbuild'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outdir = join(root, 'src', 'cjs')

await mkdir(outdir, { recursive: true })

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
].filter(name => name !== 'whatsapp-rust-bridge')

const entries = [
  ['src/Brand/index.js', 'src/cjs/brand.cjs'],
  ['src/ported-exports.js', 'src/cjs/ported.cjs']
]

for (const [entry, outfile] of entries) {
  await build({
    entryPoints: [join(root, entry)],
    outfile: join(root, outfile),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external,
    target: 'node20'
  })
  const code = await readFile(join(root, outfile), 'utf8')
  const lines = []
  let inBlock = false
  for (const line of code.split('\n')) {
    if (inBlock) {
      if (line.includes('*/')) inBlock = false
      continue
    }
    if (/^\s*\/\//.test(line)) continue
    if (/^\s*\/\*/.test(line)) {
      if (!line.includes('*/')) inBlock = true
      continue
    }
    lines.push(line)
  }
  await writeFile(join(root, outfile), lines.join('\n'))
  console.log(`built ${outfile}`)
}
