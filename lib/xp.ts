/**
 * XP / level threshold helpers.
 * All logic lives here so it stays consistent across the app.
 *
 * Thresholds from CLAUDE.md:
 *   L1→L2 = 100 XP
 *   each subsequent = previous × 1.4, rounded to nearest 50
 */

/** XP required to advance FROM `level` TO `level + 1`. */
export function xpRequiredForLevel(level: number): number {
  if (level <= 0) return 0
  let req = 100
  for (let l = 1; l < level; l++) {
    req = Math.round((req * 1.4) / 50) * 50
  }
  return req
}

/** Total cumulative XP needed to REACH `level` from zero. */
export function totalXpForLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) {
    total += xpRequiredForLevel(l)
  }
  return total
}

/**
 * Given a profile's xp and level, returns:
 *   currentLevelXp  — XP earned within the current level
 *   nextLevelXp     — XP required to complete the current level
 *   progressPct     — 0–100 integer for the XP bar
 */
export function computeXpProgress(xp: number, level: number) {
  const baseXp = totalXpForLevel(level)
  const nextLevelXp = xpRequiredForLevel(level)
  const currentLevelXp = Math.max(0, xp - baseXp)
  const progressPct = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100))
  return { currentLevelXp, nextLevelXp, progressPct }
}
