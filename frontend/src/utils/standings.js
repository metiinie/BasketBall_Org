/**
 * EBF League Standings Calculator
 * Implements FIBA-standard basketball standings with NBA-style analytics (PCT, GB, Home/Road, Streaks).
 *
 * Tie-Breaking Order (FIBA):
 *   1. Head-to-Head result
 *   2. Head-to-Head point difference
 *   3. Overall point difference
 *
 * @param {Array<Object>} matches  - Match records
 * @param {Array<Object>} teams    - Team records
 * @returns {Array<Object>}        - Sorted standings with NBA insights
 */
export function calculateStandings(matches, teams) {
  if (!teams || teams.length === 0) return []

  const completedMatches = matches.filter(
    m => m.status === 'Completed' || m.status === 'Forfeited'
  ).sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

  // ─── 1. Build base stats for each team ─────────────────────────────────
  const statsMap = {}
  teams.forEach(team => {
    statsMap[team.id] = {
      team,
      played:    0,
      wins:      0,
      losses:    0,
      homeW:     0,
      homeL:     0,
      roadW:     0,
      roadL:     0,
      streak:    '',       // empty until games are played — prevents false red coloring
      ptsFor:    0,
      ptsAgainst: 0,
      ptsDiff:   0,
      leaguePts: 0,
      forfeits:  0,
      pct:      '.000',
      gb:       '—',
      form:      [],
    }
  })

  // ─── 2. Process each match chronologically ──────────────────────────────
  completedMatches.forEach(match => {
    const home = statsMap[match.home_team_id]
    const away = statsMap[match.away_team_id]
    if (!home || !away) return

    const isForfeited = match.status === 'Forfeited' || match.home_score === null || match.away_score === null

    if (isForfeited) {
      _processForfeit(match, home, away)
    } else {
      home.played++
      away.played++
      home.ptsFor    += match.home_score
      home.ptsAgainst += match.away_score
      away.ptsFor    += match.away_score
      away.ptsAgainst += match.home_score

      if (match.home_score > match.away_score) {
        home.wins++; home.leaguePts += 2; home.form.push('W'); home.homeW++
        away.losses++; away.leaguePts += 1; away.form.push('L'); away.roadL++
      } else {
        away.wins++; away.leaguePts += 2; away.form.push('W'); away.roadW++
        home.losses++; home.leaguePts += 1; home.form.push('L'); home.homeL++
      }
    }
  })

  // ─── 3. Finalize Individual Stats (PCT & Streak) ───────────────────────
  Object.values(statsMap).forEach(s => {
    s.ptsDiff = s.ptsFor - s.ptsAgainst
    s.form = s.form.slice(-5)

    // Calculate PCT
    if (s.played > 0) {
      const p = s.wins / s.played
      s.pct = p === 1 ? '1.000' : p.toFixed(3).replace(/^0/, '')
    }

    // Calculate Streak
    if (s.form.length > 0) {
      let count = 0
      const last = s.form[s.form.length - 1]
      for (let i = s.form.length - 1; i >= 0; i--) {
        if (s.form[i] === last) count++
        else break
      }
      s.streak = `${last}${count}`
    }
  })

  const standings = Object.values(statsMap)

  // ─── 4. Sort with tie-breaking ─────────────────────────────────────────
  const sorted = _sortStandings(standings, completedMatches)

  // ─── 5. Assign Ranks & GB (Games Behind) ──────────────────────────────
  if (sorted.length > 0) {
    const leader = sorted[0]
    sorted.forEach((s, i) => {
      s.rank = i + 1
      if (i === 0) {
        s.gb = '—'
      } else if (leader.played > 0) {
        const diff = ((leader.wins - s.wins) + (s.losses - leader.losses)) / 2
        s.gb = diff === 0 ? '—' : diff.toString()
      } else {
        s.gb = '—'
      }
    })
  }

  return sorted
}

function _processForfeit(match, home, away) {
  if (!home || !away) return // Safety check for deleted teams
  home.played++
  away.played++
  const side = match.forfeit_side ?? (match.home_score === 0 && match.away_score === 20 ? 'home' : match.home_score === 20 && match.away_score === 0 ? 'away' : 'both')

  if (side === 'both') {
    home.form.push('L'); away.form.push('L')
    home.homeL++; away.roadL++;
    home.forfeits++; away.forfeits++
    // Both teams get 0 league points in a double forfeit
  } else if (side === 'home') {
    home.homeL++; home.form.push('L')
    home.forfeits++
    // Winner gets 2 pts, score is 20-0
    away.wins++; away.leaguePts += 2; away.form.push('W'); away.roadW++
    away.ptsFor += 20; home.ptsAgainst += 20
  } else {
    away.roadL++; away.form.push('L')
    away.forfeits++
    // Winner gets 2 pts, score is 20-0
    home.wins++; home.leaguePts += 2; home.form.push('W'); home.homeW++
    home.ptsFor += 20; away.ptsAgainst += 20
  }
}

export function _sortStandings(standings, allMatches) {
  standings.sort((a, b) => b.leaguePts - a.leaguePts)
  const result = []
  let i = 0
  while (i < standings.length) {
    let j = i + 1
    while (j < standings.length && standings[j].leaguePts === standings[i].leaguePts) j++
    const group = standings.slice(i, j)
    if (group.length === 1) result.push(group[0])
    else result.push(..._resolveTiedGroup(group, allMatches))
    i = j
  }
  return result
}

function _resolveTiedGroup(group, allMatches) {
  const tiedIds = new Set(group.map(s => s.team.id))
  const h2hMatches = allMatches.filter(m => tiedIds.has(m.home_team_id) && tiedIds.has(m.away_team_id) && m.status !== 'Forfeited' && m.home_score !== null && m.away_score !== null)
  
  const h2h = {}
  group.forEach(s => { h2h[s.team.id] = { leaguePts: 0, ptsFor: 0, ptsAgainst: 0, ptsDiff: 0 } })
  
  h2hMatches.forEach(match => {
    const home = h2h[match.home_team_id]
    const away = h2h[match.away_team_id]
    if (!home || !away) return
    home.ptsFor += match.home_score
    home.ptsAgainst += match.away_score
    away.ptsFor += match.away_score
    away.ptsAgainst += match.home_score
    if (match.home_score > match.away_score) { home.leaguePts += 2; away.leaguePts += 1 } 
    else if (match.away_score > match.home_score) { away.leaguePts += 2; home.leaguePts += 1 }
  })

  Object.values(h2h).forEach(s => { s.ptsDiff = s.ptsFor - s.ptsAgainst })

  // Sort by H2H League Pts, then H2H Pts Diff, then Forfeit penalty (per FIBA: forfeiter is last), then overall Pts Diff
  group.sort((a, b) => {
    const ha = h2h[a.team.id]
    const hb = h2h[b.team.id]
    
    // 1. H2H League Points
    if (hb.leaguePts !== ha.leaguePts) return hb.leaguePts - ha.leaguePts
    
    // 2. H2H Point Difference
    if (hb.ptsDiff !== ha.ptsDiff) return hb.ptsDiff - ha.ptsDiff
    
    // 3. FIBA Forfeit Penalty: Team that forfeited is classified last in the tied group
    // In our statsMap, we tracked 'forfeits' count.
    if (a.forfeits !== b.forfeits) return a.forfeits - b.forfeits // more forfeits = lower rank
    
    // 4. Overall Point Difference
    if (b.ptsDiff !== a.ptsDiff) return b.ptsDiff - a.ptsDiff
    
    return a.team.name.localeCompare(b.team.name)
  })
  return group
}
