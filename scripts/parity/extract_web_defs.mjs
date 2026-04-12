import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(process.cwd())
const srcPath = resolve(root, 'src/game/BaseDefenseGame.ts')
const outPath = resolve(root, 'godot/data/parity_web_defs.json')
const src = readFileSync(srcPath, 'utf8')

function sliceBetween(startMarker, endMarker) {
  const s = src.indexOf(startMarker)
  if (s < 0) return ''
  const e = src.indexOf(endMarker, s + startMarker.length)
  return e < 0 ? src.slice(s) : src.slice(s, e)
}

function extractObjectsById(section) {
  const out = []
  const idMatches = [...section.matchAll(/id:\s*'([^']+)'/g)]
  for (let i = 0; i < idMatches.length; i++) {
    const id = idMatches[i][1]
    const start = idMatches[i].index ?? 0
    const end = i + 1 < idMatches.length ? (idMatches[i + 1].index ?? section.length) : section.length
    const chunk = section.slice(start, end)
    out.push({ id, chunk })
  }
  return out
}

const buildSection = sliceBetween('export const BUILDINGS', 'export const UPGRADES')
const upgradeSection = sliceBetween('export const UPGRADES', 'type Projectile')

const buildingDefs = extractObjectsById(buildSection).map(({ id, chunk }) => {
  const label = (chunk.match(/label:\s*'([^']+)'/) ?? [null, id])[1]
  const category = (chunk.match(/category:\s*'([^']+)'/) ?? [null, 'unknown'])[1]
  const creditCost = Number((chunk.match(/creditCost:\s*([0-9.]+)/) ?? [null, '0'])[1])
  const supplyCost = Number((chunk.match(/supplyCost:\s*([0-9.]+)/) ?? [null, '0'])[1])
  const powerDrainPerSec = Number((chunk.match(/powerDrainPerSec:\s*([0-9.]+)/) ?? [null, '0'])[1])
  return { id, label, category, creditCost, supplyCost, powerDrainPerSec }
})

const upgradeDefs = extractObjectsById(upgradeSection).map(({ id, chunk }) => {
  const label = (chunk.match(/label:\s*'([^']+)'/) ?? [null, id])[1]
  const creditCost = Number((chunk.match(/creditCost:\s*([0-9.]+)/) ?? [null, '0'])[1])
  const prereqRaw = (chunk.match(/prereqIds:\s*\[([^\]]*)\]/) ?? [null, ''])[1]
  const prereqIds = prereqRaw ? [...prereqRaw.matchAll(/'([^']+)'/g)].map((x) => x[1]) : []
  return { id, label, creditCost, prereqIds }
})

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'src/game/BaseDefenseGame.ts',
  buildings: buildingDefs,
  upgrades: upgradeDefs,
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outPath}`)
