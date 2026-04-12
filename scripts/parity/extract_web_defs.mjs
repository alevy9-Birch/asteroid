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

function parseVarsFromSrc(text) {
  const d = { C: 1, P: 1, S: 1, E: 1, asteroidKillCreditMul: 1.45 }
  const block = text.match(/const VARS = \{([^}]*)\}/s)
  if (!block) return d
  for (const m of block[1].matchAll(/\b([A-Za-z_][\w]*)\s*:\s*([0-9.]+)/g)) {
    if (m[1] in d) d[m[1]] = Number(m[2])
  }
  return d
}

const VARS = parseVarsFromSrc(src)
/** Matches `export const UPGRADES` map in BaseDefenseGame.ts (RAW costs × this). */
const UPGRADE_CREDIT_COST_MUL = 0.93

function parseBalanceExpr(raw) {
  raw = raw.replace(/\s+/g, ' ').trim()
  if (raw === '' || raw === 'undefined') return null
  if (/^\d+\.?\d*$/.test(raw)) return Number(raw)

  let m = raw.match(/^Math\.round\(\s*([0-9.]+)\s*\*\s*VARS\.([CPSE])\s*\)$/i)
  if (m) return Math.round(Number(m[1]) * VARS[m[2]])
  m = raw.match(/^Math\.round\(\s*VARS\.([CPSE])\s*\*\s*([0-9.]+)\s*\)$/i)
  if (m) return Math.round(VARS[m[1]] * Number(m[2]))

  m = raw.match(/^([0-9.]+)\s*\*\s*VARS\.([CPSE])$/i)
  if (m) return Number(m[1]) * VARS[m[2]]
  m = raw.match(/^VARS\.([CPSE])\s*\*\s*([0-9.]+)$/i)
  if (m) return VARS[m[1]] * Number(m[2])

  return null
}

function pickNum(chunk, key) {
  const re = new RegExp(`\\b${key}:\\s*([^,\\n]+),`)
  const m = chunk.match(re)
  if (!m) return undefined
  const v = parseBalanceExpr(m[1])
  return v === null ? undefined : v
}

function pickHex(chunk, key) {
  const m = chunk.match(new RegExp(`\\b${key}:\\s*(0x[0-9a-fA-F]+)`, 'i'))
  return m ? parseInt(m[1], 16) : undefined
}

function pickStr(chunk, key) {
  const m = chunk.match(new RegExp(`\\b${key}:\\s*'([^']*)'`))
  return m ? m[1] : undefined
}

function pickStringIds(chunk, key) {
  const m = chunk.match(new RegExp(`\\b${key}:\\s*\\[([^\\]]*)\\]`))
  if (!m) return undefined
  const inner = m[1]
  const ids = [...inner.matchAll(/'([^']+)'/g)].map((x) => x[1])
  return ids.length ? ids : undefined
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

// Stop before `UPGRADES_RAW` — `export const UPGRADES` appears much later and would swallow the whole upgrade list into "buildings".
const buildSection = sliceBetween('export const BUILDINGS', 'const UPGRADES_RAW')
const upgradeSection = sliceBetween('const UPGRADES_RAW:', 'export const UPGRADES:')

const buildingDefs = extractObjectsById(buildSection).map(({ id, chunk }) => {
  const label = pickStr(chunk, 'label') ?? id
  const category = pickStr(chunk, 'category') ?? 'unknown'
  const out = { id, label, category }

  const sz = chunk.match(/size:\s*\{\s*w:\s*(\d+)\s*,\s*h:\s*(\d+)\s*\}/)
  if (sz) out.size = { w: Number(sz[1]), h: Number(sz[2]) }

  const color = pickHex(chunk, 'color')
  if (color !== undefined) out.color = color

  for (const k of [
    'maxHp',
    'creditCost',
    'supplyCost',
    'supplyCapAdd',
    'creditPayout',
    'creditIntervalSec',
    'powerGenPerSec',
    'powerDrainPerSec',
    'powerCapAdd',
    'range',
    'fireRate',
    'damage',
    'projectileSpeed',
    'auraDamagePerSec',
    'shotCreditCost',
  ]) {
    const v = pickNum(chunk, k)
    if (v !== undefined) out[k] = v
  }

  const wk = pickStr(chunk, 'weaponKind')
  if (wk !== undefined) out.weaponKind = wk

  const kind = pickStr(chunk, 'kind')
  if (kind !== undefined) out.kind = kind

  return out
})

const upgradeDefs = extractObjectsById(upgradeSection).map(({ id, chunk }) => {
  const label = pickStr(chunk, 'label') ?? id
  const category = pickStr(chunk, 'category')
  const out = { id, label }
  if (category !== undefined) out.category = category

  const cc = pickNum(chunk, 'creditCost')
  if (cc !== undefined) out.creditCost = cc > 0 ? Math.round(cc * UPGRADE_CREDIT_COST_MUL) : cc

  const prereq = pickStringIds(chunk, 'prereqIds')
  if (prereq) out.prereqIds = prereq

  const unlock = pickStringIds(chunk, 'unlockBuildingIds')
  if (unlock) out.unlockBuildingIds = unlock

  const desc = pickStr(chunk, 'description')
  if (desc !== undefined) out.description = desc

  const heroId = pickStr(chunk, 'heroId')
  if (heroId !== undefined) out.heroId = heroId

  return out
})

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'src/game/BaseDefenseGame.ts',
  balanceVars: { ...VARS },
  buildings: buildingDefs,
  upgrades: upgradeDefs,
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outPath} (${buildingDefs.length} buildings, ${upgradeDefs.length} upgrades)`)
