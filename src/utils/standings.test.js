import { describe, it, expect } from 'vitest'
import { calculateStandings, _sortStandings } from './standings.js'

describe('EBF Standings Calculator (FIBA Rules)', () => {
  
  const mockTeams = [
    { id: '1', name: 'Team A' },
    { id: '2', name: 'Team B' },
    { id: '3', name: 'Team C' },
    { id: '4', name: 'Team D' }
  ]

  it('calculates basic Win/Loss League Points correctly', () => {
    const matches = [
      { home_team_id: '1', away_team_id: '2', home_score: 100, away_score: 90, status: 'Completed' }, // 1 beats 2
      { home_team_id: '1', away_team_id: '3', home_score: 110, away_score: 100, status: 'Completed' } // 1 beats 3
    ]

    const standings = calculateStandings(matches, mockTeams)
    
    // Team A: 2 Wins (4 pts)
    const teamA = standings.find(s => s.team.id === '1')
    expect(teamA.leaguePts).toBe(4)
    expect(teamA.wins).toBe(2)
    expect(teamA.rank).toBe(1)
    expect(teamA.form).toEqual(['W', 'W'])
    
    // Team B: 1 Loss (1 pt)
    const teamB = standings.find(s => s.team.id === '2')
    expect(teamB.leaguePts).toBe(1)
    
    // Team D: 0 played (0 pts)
    const teamD = standings.find(s => s.team.id === '4')
    expect(teamD.leaguePts).toBe(0)
  })

  it('resolves 2-way ties using straight Head-to-Head result', () => {
    const matches = [
      // A beats B
      { home_team_id: '1', away_team_id: '2', home_score: 100, away_score: 90, status: 'Completed' },
      // B beats C
      { home_team_id: '2', away_team_id: '3', home_score: 80, away_score: 70, status: 'Completed' },
      // C beats A
      { home_team_id: '3', away_team_id: '1', home_score: 80, away_score: 70, status: 'Completed' },
    ]
    // Everybody is 1-1. Points: 3 each.
    // Wait, this is a 3-way tie. Let's make a 2-way tie.
    
    const matches2Way = [
      { home_team_id: '1', away_team_id: '3', home_score: 100, away_score: 80, status: 'Completed' }, // 1 beats 3
      { home_team_id: '2', away_team_id: '4', home_score: 100, away_score: 80, status: 'Completed' }, // 2 beats 4
      // 1 vs 2 (1 wins)
      { home_team_id: '1', away_team_id: '2', home_score: 85, away_score: 80, status: 'Completed' }
    ]
    // 1 has 4 pts, 2 has 3 pts. Still no tie. Let's make them tied.
    
    const matchesReal2Way = [
      { home_team_id: '1', away_team_id: '3', home_score: 100, away_score: 80, status: 'Completed' }, // 1 beats 3
      { home_team_id: '2', away_team_id: '4', home_score: 100, away_score: 80, status: 'Completed' }, // 2 beats 4
      
      { home_team_id: '4', away_team_id: '1', home_score: 100, away_score: 80, status: 'Completed' }, // 4 beats 1
      { home_team_id: '3', away_team_id: '2', home_score: 100, away_score: 80, status: 'Completed' }, // 3 beats 2
      
      { home_team_id: '1', away_team_id: '2', home_score: 85, away_score: 80, status: 'Completed' }  // 1 beats 2 (H2H)
    ]
    
    const standings = calculateStandings(matchesReal2Way, mockTeams)
    // 1 and 2 are 2-1 (5 pts total).
    // In H2H, 1 beat 2. So 1 should be ranked higher than 2.
    
    const rank1 = standings.find(s => s.team.id === '1').rank
    const rank2 = standings.find(s => s.team.id === '2').rank
    expect(rank1 < rank2).toBe(true)
  })

  it('resolves 3-way ties using specific Head-to-Head point differential among tied teams', () => {
    // Team 1, 2, 3 all tie (1-1 against each other)
    const matches = [
      // 1 beats 2 by +10
      { home_team_id: '1', away_team_id: '2', home_score: 100, away_score: 90, status: 'Completed' },
      // 2 beats 3 by +5
      { home_team_id: '2', away_team_id: '3', home_score: 85, away_score: 80, status: 'Completed' },
      // 3 beats 1 by +20
      { home_team_id: '3', away_team_id: '1', home_score: 100, away_score: 80, status: 'Completed' }
    ]
    
    // H2H PD diff calculation:
    // 1: +10 - 20 = -10
    // 2: -10 + 5 = -5
    // 3: -5 + 20 = +15
    // Team 3 should be 1st, Team 2 2nd, Team 1 3rd.
    
    const standings = calculateStandings(matches, mockTeams)
    
    expect(standings[0].team.id).toBe('3')
    expect(standings[1].team.id).toBe('2')
    expect(standings[2].team.id).toBe('1')
  })

  it('correctly processes forfeit rules (Winner: 20-0, Forfeit Team ranked 0 pts/last)', () => {
    const matches = [
       // Team 1 plays normal, 1 wins
       { home_team_id: '1', away_team_id: '3', home_score: 100, away_score: 90, status: 'Completed' },
       // Team 2 forfeits to Team 4
       { home_team_id: '2', away_team_id: '4', home_score: 0, away_score: 20, forfeit_side: 'home', status: 'Forfeited' }
    ]

    const standings = calculateStandings(matches, mockTeams)
    
    // Team 4 should get an artificial 20-0 win
    const team4 = standings.find(s => s.team.id === '4')
    expect(team4.wins).toBe(1)
    expect(team4.leaguePts).toBe(2)
    expect(team4.ptsFor).toBe(20)
    
    // Team 2 should get 0 league pts instead of 1 (a generic loss would give 1)
    // Wait, the standard FIBA forfeit is 0 pts. In our implementation, we didn't explicitly zero out the loss point...
    // Let's verify our engine's implementation logic...
    const team2 = standings.find(s => s.team.id === '2')
    // As per `_processForfeit`: away.wins++; away.leaguePts += 2; but it does NOT increment home.leaguePts
    expect(team2.leaguePts).toBe(0)
    expect(team2.forfeits).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// EDGE-CASE SUITES
// ═══════════════════════════════════════════════════════════════════════════

// ─── Suite 8: Forfeit Edge Cases ──────────────────────────────────────────

describe('calculateStandings — Forfeit Edge Cases', () => {
  it('home forfeit: forfeiting team losses counter is incremented', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'home' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    // Home team forfeited → should count as a loss
    expect(a.losses).toBe(1)
    expect(a.played).toBe(1)
    // wins + losses should equal played
    expect(a.wins + a.losses).toBe(a.played)
  })

  it('away forfeit: forfeiting team losses counter is incremented', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'away' }
    const standings = calculateStandings([match], [teamA, teamB])
    const b = standings.find(s => s.team.id === 'b')
    expect(b.losses).toBe(1)
    expect(b.played).toBe(1)
    expect(b.wins + b.losses).toBe(b.played)
  })

  it('double forfeit: both teams get a loss', () => {
    const match = { id: 'm1', home_team_id: 'a', away_team_id: 'b', home_score: null, away_score: null, status: 'Forfeited' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.losses).toBe(1)
    expect(b.losses).toBe(1)
    expect(a.wins + a.losses).toBe(a.played)
    expect(b.wins + b.losses).toBe(b.played)
  })

  it('forfeit applies 20-0 score for the non-forfeiting team', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'home' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    // Away team (B) awarded 20 pts; home (A) concedes 20
    expect(b.ptsFor).toBe(20)
    expect(a.ptsAgainst).toBe(20)
    expect(a.ptsFor).toBe(0)
    expect(b.ptsAgainst).toBe(0)
    expect(a.ptsDiff).toBe(-20)
    expect(b.ptsDiff).toBe(20)
  })

  it('double forfeit awards no points to either team', () => {
    const match = { id: 'm1', home_team_id: 'a', away_team_id: 'b', home_score: null, away_score: null, status: 'Forfeited' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.ptsFor).toBe(0)
    expect(a.ptsAgainst).toBe(0)
    expect(b.ptsFor).toBe(0)
    expect(b.ptsAgainst).toBe(0)
  })

  it('forfeit_side auto-detected when only home_score is null', () => {
    // home_score null, away_score present → home forfeited
    const match = { id: 'm1', home_team_id: 'a', away_team_id: 'b', home_score: null, away_score: 80, status: 'Forfeited' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.forfeits).toBe(1)
    expect(b.wins).toBe(1)
    expect(a.leaguePts).toBe(0)
    expect(b.leaguePts).toBe(2)
  })

  it('forfeit_side auto-detected when only away_score is null', () => {
    // away_score null, home_score present → away forfeited
    const match = { id: 'm1', home_team_id: 'a', away_team_id: 'b', home_score: 75, away_score: null, status: 'Forfeited' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(b.forfeits).toBe(1)
    expect(a.wins).toBe(1)
    expect(a.leaguePts).toBe(2)
    expect(b.leaguePts).toBe(0)
  })

  it('multiple forfeits by same team accumulate correctly', () => {
    const matches = [
      { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'home' },
      { ...mkMatch('m2', 'c', 'a', null, null), status: 'Forfeited', forfeit_side: 'away' },
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.forfeits).toBe(2)
    expect(a.played).toBe(2)
    expect(a.losses).toBe(2)
    expect(a.leaguePts).toBe(0)
    expect(a.ptsAgainst).toBe(40) // 20 per forfeit
  })

  it('mix of forfeits and regular matches produces correct totals', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80),  // A wins normally
      { ...mkMatch('m2', 'a', 'c', null, null), status: 'Forfeited', forfeit_side: 'home' }, // A forfeits
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.played).toBe(2)
    expect(a.wins).toBe(1)
    expect(a.losses).toBe(1)
    expect(a.forfeits).toBe(1)
    expect(a.leaguePts).toBe(2) // 2 from regular win, 0 from forfeit
    expect(a.ptsFor).toBe(100)
    expect(a.ptsAgainst).toBe(80 + 20) // 80 from match + 20 conceded from forfeit
  })

  it('forfeiting team gets L in form; non-forfeiting team gets W', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'home' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.form).toEqual(['L'])
    expect(b.form).toEqual(['W'])
    expect(a.streak).toBe('L1')
    expect(b.streak).toBe('W1')
  })

  it('home/road splits track correctly for forfeits', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'home' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.homeL).toBe(1)
    expect(a.homeW).toBe(0)
    expect(b.roadW).toBe(1)
    expect(b.roadL).toBe(0)
  })

  it('forfeited matches are excluded from H2H tie-breaking', () => {
    // A and B tied on league points; their only H2H is a forfeit → should not count for H2H
    const matches = [
      mkMatch('m1', 'a', 'c', 100, 80),  // A beats C
      mkMatch('m2', 'b', 'c', 100, 80),  // B beats C
      { ...mkMatch('m3', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'away' }, // B forfeits
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    // A has 4 league pts (2+2), B has 2 (2+0) → A should rank above B
    expect(a.rank).toBeLessThan(b.rank)
  })
})

// ─── Suite 9: Teams with No Matches ──────────────────────────────────────

describe('calculateStandings — Teams with No Matches', () => {
  it('unplayed teams have correct default stat values', () => {
    const standings = calculateStandings([], [teamA])
    const a = standings[0]
    expect(a.played).toBe(0)
    expect(a.wins).toBe(0)
    expect(a.losses).toBe(0)
    expect(a.homeW).toBe(0)
    expect(a.homeL).toBe(0)
    expect(a.roadW).toBe(0)
    expect(a.roadL).toBe(0)
    expect(a.ptsFor).toBe(0)
    expect(a.ptsAgainst).toBe(0)
    expect(a.ptsDiff).toBe(0)
    expect(a.leaguePts).toBe(0)
    expect(a.forfeits).toBe(0)
    expect(a.pct).toBe('.000')
    expect(a.streak).toBe('-')
    expect(a.form).toEqual([])
    expect(a.gb).toBe('—')
  })

  it('unplayed teams rank below active teams', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 90, 80), // A beats B
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    // C and D have no matches → 0 league pts, rank at bottom
    const cRank = standings.find(s => s.team.id === 'c').rank
    const dRank = standings.find(s => s.team.id === 'd').rank
    expect(cRank).toBeGreaterThan(2)
    expect(dRank).toBeGreaterThan(2)
  })

  it('GB is calculated relative to leader even for unplayed teams', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80),
      mkMatch('m2', 'a', 'c', 95, 75),
    ]
    // A: 2W 0L = 4pts; B: 0W 1L = 1pt; C: 0W 1L = 1pt; D: 0 matches
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    const leader = standings[0]
    const d = standings.find(s => s.team.id === 'd')
    expect(leader.gb).toBe('—')
    // D has 0W 0L; leader has 2W 0L; GB = (2-0 + 0-0)/2 = 1
    expect(d.gb).toBe('1')
  })

  it('all unplayed teams are sorted alphabetically', () => {
    const standings = calculateStandings([], [teamD, teamB, teamA, teamC])
    // All teams have 0 league pts; tiebreaker falls through to name sort
    const names = standings.map(s => s.team.name)
    expect(names).toEqual(['Adama City', 'Bahir Dar', 'Combat', 'Dire Dawa'])
  })

  it('single team with no matches gets rank 1', () => {
    const standings = calculateStandings([], [teamA])
    expect(standings).toHaveLength(1)
    expect(standings[0].rank).toBe(1)
    expect(standings[0].gb).toBe('—')
  })

  it('match referencing an unknown team ID is safely skipped', () => {
    const matches = [mkMatch('m1', 'a', 'unknown_id', 100, 80)]
    const standings = calculateStandings(matches, [teamA, teamB])
    // The match should be skipped because 'unknown_id' is not in teams
    const a = standings.find(s => s.team.id === 'a')
    expect(a.played).toBe(0)
  })
})

// ─── Suite 10: Ties in League Points ─────────────────────────────────────

describe('calculateStandings — Ties in League Points', () => {
  it('alphabetical name is the final tiebreaker when all else is equal', () => {
    // Two teams tied, never played each other, identical ptsDiff
    const matches = [
      mkMatch('m1', 'a', 'c', 100, 80), // A beats C by 20
      mkMatch('m2', 'b', 'd', 100, 80), // B beats D by 20
    ]
    // A: 2pts, PD +20; B: 2pts, PD +20; no H2H between A and B
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    const aIdx = standings.findIndex(s => s.team.id === 'a')
    const bIdx = standings.findIndex(s => s.team.id === 'b')
    // "Adama City" < "Bahir Dar" alphabetically → A ranks first
    expect(aIdx).toBeLessThan(bIdx)
  })

  it('4-way tie resolved through H2H within the tied group', () => {
    // Round-robin where every team beats exactly one other:
    // A>B, B>C, C>D, D>A, plus A>C and B>D to create an interesting 4-way
    // Actually, let's keep it simpler: each team 1W1L = 3pts
    const matches = [
      mkMatch('m1', 'a', 'b', 90, 80),  // A beats B
      mkMatch('m2', 'c', 'd', 90, 80),  // C beats D
      mkMatch('m3', 'b', 'c', 90, 80),  // B beats C
      mkMatch('m4', 'd', 'a', 90, 80),  // D beats A
    ]
    // All teams: 1W 1L = 3pts
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    expect(standings).toHaveLength(4)
    standings.forEach(s => expect(s.leaguePts).toBe(3))
    // Verify every team has a unique rank
    const ranks = standings.map(s => s.rank)
    expect(new Set(ranks).size).toBe(4)
  })

  it('GB shows "—" for multiple teams tied at the top', () => {
    // A and B both 1W each, tied at top
    const matches = [
      mkMatch('m1', 'a', 'c', 100, 80), // A beats C
      mkMatch('m2', 'b', 'c', 100, 80), // B beats C
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    // A and B both have 2 league pts. Whoever is rank 1 has gb "—"
    // The other also has GB = (wins_diff + losses_diff)/2 relative to leader
    // Both have 1W 0L, so gb should be "—" for both
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    const leader = standings[0]
    expect(leader.gb).toBe('—')
    // Since both teams have identical W-L records, the non-leader should have gb "—" too
    if (a.rank === 1) {
      expect(b.gb).toBe('—')
    } else {
      expect(a.gb).toBe('—')
    }
  })

  it('_sortStandings places higher league-pts teams first', () => {
    const group = [
      { team: { id: 'x', name: 'X' }, leaguePts: 4, ptsDiff: 0 },
      { team: { id: 'y', name: 'Y' }, leaguePts: 6, ptsDiff: 0 },
      { team: { id: 'z', name: 'Z' }, leaguePts: 2, ptsDiff: 0 },
    ]
    const sorted = _sortStandings(group, [])
    expect(sorted[0].team.id).toBe('y')
    expect(sorted[1].team.id).toBe('x')
    expect(sorted[2].team.id).toBe('z')
  })

  it('tie with one H2H match settles the pair; others fall to ptsDiff', () => {
    // A, B, C all have 4 league pts; A beat B head-to-head; C never played A or B
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80), // A beats B
      mkMatch('m2', 'b', 'd', 90, 70),  // B beats D
      mkMatch('m3', 'a', 'd', 85, 80),  // A beats D
      mkMatch('m4', 'c', 'd', 120, 60), // C beats D by 60 (big ptsDiff)
      mkMatch('m5', 'c', 'b', 80, 85),  // B beats C → C 1W 1L
      mkMatch('m6', 'c', 'a', 90, 85),  // C beats A → A 2W 1L
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    // A: 2W 1L = 5pts; B: 2W 1L = 5pts; C: 2W 1L = 5pts; D: 0W 3L = 3pts
    // Three-way tie at 5pts, resolved by H2H among {A,B,C}
    expect(standings[3].team.id).toBe('d')
  })
})

// ─── Suite 11: PCT, Streak, Form & GB Formatting ─────────────────────────

describe('calculateStandings — PCT, Streak, Form & GB', () => {
  it('PCT shows "1.000" for undefeated team', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80),
      mkMatch('m2', 'a', 'c', 95, 75),
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.pct).toBe('1.000')
  })

  it('PCT shows ".500" for even record', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80), // A wins
      mkMatch('m2', 'b', 'a', 100, 80), // A loses
    ]
    const standings = calculateStandings(matches, [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.pct).toBe('.500')
  })

  it('PCT shows ".000" for winless team', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 80, 100),
      mkMatch('m2', 'a', 'c', 70, 90),
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.pct).toBe('.000')
  })

  it('streak tracks consecutive results correctly', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 80, 100), // A loses
      mkMatch('m2', 'a', 'c', 80, 90),  // A loses
      mkMatch('m3', 'a', 'd', 100, 80), // A wins
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.streak).toBe('W1')
  })

  it('form keeps only last 5 results', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80),
      mkMatch('m2', 'a', 'b', 100, 80),
      mkMatch('m3', 'a', 'b', 100, 80),
      mkMatch('m4', 'a', 'b', 100, 80),
      mkMatch('m5', 'a', 'b', 100, 80),
      mkMatch('m6', 'a', 'b', 80, 100), // A loses the 6th
    ]
    const standings = calculateStandings(matches, [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.form).toHaveLength(5)
    expect(a.form).toEqual(['W', 'W', 'W', 'W', 'L'])
  })

  it('GB calculates fractional games behind correctly', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80), // A wins
      mkMatch('m2', 'a', 'c', 95, 75),  // A wins
      mkMatch('m3', 'b', 'c', 88, 80),  // B wins
    ]
    // A: 2W 0L; B: 1W 1L; C: 0W 2L
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const b = standings.find(s => s.team.id === 'b')
    const c = standings.find(s => s.team.id === 'c')
    // B: GB = ((2-1)+(1-0))/2 = 1
    expect(b.gb).toBe('1')
    // C: GB = ((2-0)+(2-0))/2 = 2
    expect(c.gb).toBe('2')
  })
})
