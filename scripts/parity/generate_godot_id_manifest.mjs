import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(process.cwd())
const sourcePath = resolve(root, 'src/game/BaseDefenseGame.ts')
const outPath = resolve(root, 'godot/data/parity_web_manifest.json')

const src = readFileSync(sourcePath, 'utf8')

function extractUnion(name) {
  const pattern = new RegExp(`export type ${name} =([\\s\\S]*?)\\n\\n`, 'm')
  const m = src.match(pattern)
  if (!m) return []
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'src/game/BaseDefenseGame.ts',
  buildingIds: extractUnion('BuildingId'),
  upgradeIds: extractUnion('UpgradeId'),
  heroIds: extractUnion('HeroId'),
  difficultyIds: extractUnion('GameDifficulty'),
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outPath}`)
