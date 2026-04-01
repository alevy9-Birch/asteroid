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

/** Easiest → hardest; used for leaderboard ordering within a commander. */
const DIFFICULTY_ORDER: Record<GameDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  brutal: 3,
  deadly: 4,
}

/** Sort key so “None” sorts before named commanders, then heroes A–Z. */
function commanderSortKey(c: CommanderKey): string {
  return c === 'none' ? '0' : `1-${c}`
}

/**
 * Display / storage order: character → difficulty (easy→hard) → score (high first) → wave → time.
 * Does not decide which runs qualify as “top 5”; use `pickTopByScore` first.
 */
export function sortHighScoresForDisplay(a: ScoreRecord, b: ScoreRecord): number {
  const ca = commanderSortKey(a.commander).localeCompare(commanderSortKey(b.commander))
  if (ca !== 0) return ca
  const da = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
  if (da !== 0) return da
  if (b.score !== a.score) return b.score - a.score
  if (b.wave !== a.wave) return b.wave - a.wave
  return b.at - a.at
}

/** Keep the N highest-scoring runs (tie-break: wave, then recency). */
function pickTopByScore(entries: ScoreRecord[], n: number): ScoreRecord[] {
  return [...entries]
    .sort((a, b) => b.score - a.score || b.wave - a.wave || b.at - a.at)
    .slice(0, n)
}

function orderBoard(entries: ScoreRecord[]): ScoreRecord[] {
  return [...entries].sort(sortHighScoresForDisplay)
}

export function loadLeaderboards(): Leaderboards {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyBoards()
    const parsed = JSON.parse(raw) as Leaderboards
    if (!parsed || !Array.isArray(parsed.total)) return emptyBoards()
    const byCommander = parsed.byCommander ?? {}
    const normalizedBy: Partial<Record<CommanderKey, ScoreRecord[]>> = {}
    for (const k of Object.keys(byCommander) as CommanderKey[]) {
      const list = byCommander[k]
      if (!Array.isArray(list)) continue
      normalizedBy[k] = orderBoard(list.slice(0, MAX_ENTRIES))
    }
    return {
      total: orderBoard(parsed.total.slice(0, MAX_ENTRIES)),
      byCommander: normalizedBy,
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

function trim(board: ScoreRecord[]): ScoreRecord[] {
  return orderBoard(pickTopByScore(board, MAX_ENTRIES))
}

/** Rank by score (1 = best score on this board); matches “top 5” selection. */
function rankByScore(board: ScoreRecord[], rec: ScoreRecord): number | null {
  const sorted = [...board].sort((a, b) => b.score - a.score || b.wave - a.wave || b.at - a.at)
  const idx = sorted.findIndex(
    (e) =>
      e.at === rec.at &&
      e.score === rec.score &&
      e.wave === rec.wave &&
      e.commander === rec.commander &&
      e.difficulty === rec.difficulty,
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
    (e) =>
      e.at === rec.at &&
      e.score === rec.score &&
      e.wave === rec.wave &&
      e.commander === rec.commander &&
      e.difficulty === rec.difficulty,
  )
  const madeCommanderTop = commanderNext.some(
    (e) =>
      e.at === rec.at &&
      e.score === rec.score &&
      e.wave === rec.wave &&
      e.commander === rec.commander &&
      e.difficulty === rec.difficulty,
  )
  data.total = totalNext
  data.byCommander[cmd] = commanderNext
  saveLeaderboards(data)
  return {
    totalBoard: totalNext,
    commanderBoard: commanderNext,
    totalRank: madeTotalTop ? rankByScore(totalNext, rec) : null,
    commanderRank: madeCommanderTop ? rankByScore(commanderNext, rec) : null,
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
