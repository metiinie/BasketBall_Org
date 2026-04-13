/**
 * EBF League Standings Calculator
 * Implements FIBA-standard basketball standings with strict tie-breaking.
 *
 * Tie-Breaking Order:
 *   1. Head-to-Head result (league pts in mutual matches among tied teams)
 *   2. Head-to-Head point difference (pts scored − pts conceded in mutual matches)
 *   3. Overall point difference across all matches in the round
 *
 * Scoring:
 *   Win     = 2 league points
 *   Loss    = 1 league point
 *   Forfeit = 0 league points (forfeiting team); Winner = 2 pts
 *
 * @param {Array<Object>} matches  - Match records (may include Scheduled/Completed/Forfeited)
 * @param {Array<Object>} teams    - Team records for the round
 * @returns {Array<Object>}        - Sorted standings with rank assigned
 */
export function calculateStandings(matches, teams) {
  if (!teams || teams.length === 0) return []

  const completedMatches = matches.filter(
    m => m.status === 'Completed' || m.status === 'Forfeited'
  )

  // ─── 1. Build base stats for each team ─────────────────────────────────
  const statsMap = {}
  teams.forEach(team => {
    statsMap[team.id] = {
      team,
      played:    0,
      wins:      0,
      losses:    0,
      forfeits:  0,
      ptsFor:    0,
      ptsAgainst: 0,
      ptsDiff:   0,
      leaguePts: 0,
    }
  })

  // ─── 2. Process each match ──────────────────────────────────────────────
  completedMatches.forEach(match => {
    const home = statsMap[match.home_team_id]
    const away = statsMap[match.away_team_id]
    if (!home || !away) return

    const isForfeited = match.status === 'Forfeited'
      || match.home_score === null
      || match.away_score === null

    if (isForfeited) {
      _processForfeit(match, home, away)
      return
    }

    // Normal completed match
    home.played++
    away.played++
    home.ptsFor    += match.home_score
    home.ptsAgainst += match.away_score
    away.ptsFor    += match.away_score
    away.ptsAgainst += match.home_score

    if (match.home_score > match.away_score) {
      home.wins++;  home.leaguePts += 2
      away.losses++; away.leaguePts += 1
    } else if (match.away_score > match.home_score) {
      away.wins++;  away.leaguePts += 2
      home.losses++; home.leaguePts += 1
    }
    // Basketball has no draws (overtime resolves ties), but guard against
    // bad data: if equal scores, neither team gets extra points.
  })

  // ─── 3. Compute overall point difference ───────────────────────────────
  Object.values(statsMap).forEach(s => {
    s.ptsDiff = s.ptsFor - s.ptsAgainst
  })

  const standings = Object.values(statsMap)

  // ─── 4. Sort with tie-breaking ─────────────────────────────────────────
  const sorted = _sortStandings(standings, completedMatches)

  // ─── 5. Assign ranks ───────────────────────────────────────────────────
  sorted.forEach((s, i) => { s.rank = i + 1 })

  return sorted
}

// ─── Private helpers ──────────────────────────────────────────────────────

function _processForfeit(match, home, away) {
  home.played++
  away.played++

  // Determine which side forfeited.
  // Priority: explicit forfeit_side field → fallback to null score detection
  const side = match.forfeit_side
    ?? (match.home_score === null && match.away_score === null ? 'both'
      : match.home_score === null ? 'home'
      : match.away_score === null ? 'away'
      : 'both')

  if (side === 'both') {
    home.forfeits++
    away.forfeits++
  } else if (side === 'home') {
    home.forfeits++
    away.wins++
    away.leaguePts += 2
  } else {
    away.forfeits++
    home.wins++
    home.leaguePts += 2
  }
}

/**
 * Sort standings array applying FIBA tie-breaking cascade.
 * Groups teams by equal league points and resolves each group independently.
 */
function _sortStandings(standings, allMatches) {
  // Primary sort: league points descending
  standings.sort((a, b) => b.leaguePts - a.leaguePts)

  const result = []
  let i = 0

  while (i < standings.length) {
    let j = i + 1
    while (j < standings.length && standings[j].leaguePts === standings[i].leaguePts) j++

    const group = standings.slice(i, j)

    if (group.length === 1) {
      result.push(group[0])
    } else {
      result.push(..._resolveTiedGroup(group, allMatches))
    }

    i = j
  }

  return result
}

/**
 * Resolve ordering within a group of teams that share the same league points.
 * Uses FIBA tiebreakers TB1 → TB2 → TB3.
 */
function _resolveTiedGroup(group, allMatches) {
  const tiedIds = new Set(group.map(s => s.team.id))

  // Filter matches exclusively between the tied teams
  const h2hMatches = allMatches.filter(
    m => tiedIds.has(m.home_team_id) && tiedIds.has(m.away_team_id)
      && m.status !== 'Forfeited'
      && m.home_score !== null && m.away_score !== null
  )

  // Build H2H sub-stats
  const h2h = {}
  group.forEach(s => {
    h2h[s.team.id] = { leaguePts: 0, ptsFor: 0, ptsAgainst: 0, ptsDiff: 0 }
  })

  h2hMatches.forEach(match => {
    const home = h2h[match.home_team_id]
    const away = h2h[match.away_team_id]
    if (!home || !away) return

    home.ptsFor    += match.home_score
    home.ptsAgainst += match.away_score
    away.ptsFor    += match.away_score
    away.ptsAgainst += match.home_score

    if (match.home_score > match.away_score) {
      home.leaguePts += 2; away.leaguePts += 1
    } else if (match.away_score > match.home_score) {
      away.leaguePts += 2; home.leaguePts += 1
    }
  })

  Object.values(h2h).forEach(s => { s.ptsDiff = s.ptsFor - s.ptsAgainst })

  // Sort the group using tiebreakers
  group.sort((a, b) => {
    const ha = h2h[a.team.id]
    const hb = h2h[b.team.id]

    // TB1: Head-to-Head league points
    if (hb.leaguePts !== ha.leaguePts) return hb.leaguePts - ha.leaguePts

    // TB2: Head-to-Head point difference
    if (hb.ptsDiff !== ha.ptsDiff) return hb.ptsDiff - ha.ptsDiff

    // TB3: Overall point difference
    if (b.ptsDiff !== a.ptsDiff) return b.ptsDiff - a.ptsDiff

    // Final fallback: alphabetical (deterministic for equal everything)
    return a.team.name.localeCompare(b.team.name)
  })

  return group
}
