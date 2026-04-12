import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const repoRoot = resolve(process.cwd())
const sourcePath = resolve(repoRoot, 'src/game/BaseDefenseGame.ts')
const outPath = resolve(repoRoot, 'docs/parity/WEB_DATA_INVENTORY.md')

const src = readFileSync(sourcePath, 'utf8')

function extractUnion(name) {
  const pattern = new RegExp(`export type ${name} =([\\s\\S]*?)\\n\\n`, 'm')
  const m = src.match(pattern)
  if (!m) return []
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

const buildings = extractUnion('BuildingId')
const upgrades = extractUnion('UpgradeId')
const difficulties = extractUnion('GameDifficulty')
const heroes = extractUnion('HeroId')

const body = `# Web Data Inventory Snapshot

Generated from \`src/game/BaseDefenseGame.ts\`.

- Buildings: **${buildings.length}**
- Upgrades: **${upgrades.length}**
- Difficulties: **${difficulties.length}**
- Heroes: **${heroes.length}**

## Building IDs

${buildings.map((x) => `- \`${x}\``).join('\n')}

## Upgrade IDs

${upgrades.map((x) => `- \`${x}\``).join('\n')}

## Difficulty IDs

${difficulties.map((x) => `- \`${x}\``).join('\n')}

## Hero IDs

${heroes.map((x) => `- \`${x}\``).join('\n')}
`

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, body, 'utf8')
console.log(`Wrote ${outPath}`)
