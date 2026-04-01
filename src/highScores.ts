import type { GameDifficulty, HeroId } from './game/BaseDefenseGame'

export type CommanderKey = 'none' | HeroId

export type ScoreRecord = {
  score: number
  wave: number
  commander: CommanderKey
  difficulty: GameDifficulty
  moneyEarned: number
  moneySpent: number
  powerProduced: number
  asteroidsKilled: number
  mostCommonBuildingLabel: string
  at: number
}

const STORAGE_KEY = 'asteroid-defense-leaderboards-v1'
const MAX_ENTRIES = 5

export type Leaderboards = {
  total: ScoreRecord[]
  byCommander: Partial<Record<CommanderKey, ScoreRecord[]>>
}

function emptyBoards(): Leaderboards {
  return { total: [], byCommander: {} }
}

export function loadLeaderboards(): Leaderboards {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyBoards()
    const parsed = JSON.parse(raw) as Leaderboards
    if (!parsed || !Array.isArray(parsed.total)) return emptyBoards()
    return {
      total: parsed.total.slice(0, MAX_ENTRIES),
      byCommander: parsed.byCommander ?? {},
    }
  } catch {
    return emptyBoards()
  }
}

function saveLeaderboards(data: Leaderboards) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function sortScores(a: ScoreRecord, b: ScoreRecord): number {
  if (b.score !== a.score) return b.score - a.score
  if (b.wave !== a.wave) return b.wave - a.wave
  return b.at - a.at
}

function trim(board: ScoreRecord[]): ScoreRecord[] {
  return [...board].sort(sortScores).slice(0, MAX_ENTRIES)
}

function rankOf(board: ScoreRecord[], rec: ScoreRecord): number | null {
  const sorted = [...board].sort(sortScores)
  const idx = sorted.findIndex(
    (e) =>
      e.at === rec.at &&
      e.score === rec.score &&
      e.wave === rec.wave &&
      e.commander === rec.commander,
  )
  return idx >= 0 ? idx + 1 : null
}

export type AddScoreResult = {
  totalBoard: ScoreRecord[]
  commanderBoard: ScoreRecord[]
  totalRank: number | null
  commanderRank: number | null
  madeTotalTop: boolean
  madeCommanderTop: boolean
}

/** Insert a run into total + commander boards; keep top MAX_ENTRIES each. */
export function addScoreRecord(rec: ScoreRecord): AddScoreResult {
  const data = loadLeaderboards()
  const totalNext = trim([...data.total, rec])
  const cmd = rec.commander
  const cmdPrev = data.byCommander[cmd] ?? []
  const commanderNext = trim([...cmdPrev, rec])
  const madeTotalTop = totalNext.some(
    (e) => e.at === rec.at && e.score === rec.score && e.wave === rec.wave && e.commander === rec.commander,
  )
  const madeCommanderTop = commanderNext.some(
    (e) => e.at === rec.at && e.score === rec.score && e.wave === rec.wave && e.commander === rec.commander,
  )
  data.total = totalNext
  data.byCommander[cmd] = commanderNext
  saveLeaderboards(data)
  return {
    totalBoard: totalNext,
    commanderBoard: commanderNext,
    totalRank: madeTotalTop ? rankOf(totalNext, rec) : null,
    commanderRank: madeCommanderTop ? rankOf(commanderNext, rec) : null,
    madeTotalTop,
    madeCommanderTop,
  }
}

export function computeRunScore(input: {
  wave: number
  asteroidsKilled: number
  moneyEarned: number
  moneySpent: number
  powerProduced: number
  difficulty: GameDifficulty
}): number {
  const { wave, asteroidsKilled, moneyEarned, moneySpent, powerProduced, difficulty } = input
  let diffMul = 1
  switch (difficulty) {
    case 'easy':
      diffMul = 0.72
      break
    case 'medium':
      diffMul = 0.86
      break
    case 'hard':
      diffMul = 1
      break
    case 'brutal':
      diffMul = 1.22
      break
    case 'deadly':
      diffMul = 1.45
      break
    default:
      diffMul = 1
  }
  const raw =
    wave * 180 +
    asteroidsKilled * 12 +
    moneyEarned * 0.04 +
    powerProduced * 0.08 -
    moneySpent * 0.02
  return Math.max(0, Math.round(raw * diffMul))
}
