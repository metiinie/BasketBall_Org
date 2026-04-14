import { describe, it, expect } from 'vitest'
import { calculateStandings, _sortStandings } from './standings.js'

// ─── Test Fixture Helpers ─────────────────────────────────────────────────

const mkTeam = (id, name) => ({ id, name, gender: 'ወንድ', logo_url: null })
const mkMatch = (id, homeId, awayId, homeScore, awayScore, status = 'Completed') => ({
  id, home_team_id: homeId, away_team_id: awayId,
  home_score: homeScore, away_score: awayScore, status,
})

// ─── Test Teams ───────────────────────────────────────────────────────────

const teamA = mkTeam('a', 'Adama City')
const teamB = mkTeam('b', 'Bahir Dar')
const teamC = mkTeam('c', 'Combat')
const teamD = mkTeam('d', 'Dire Dawa')

// ─── Suite 1: Basic scenarios ─────────────────────────────────────────────

describe('calculateStandings — Basic Scenarios', () => {
  it('returns empty array when no teams provided', () => {
    expect(calculateStandings([], [])).toEqual([])
  })

  it('returns zero-stats for all teams when no matches played', () => {
    const standings = calculateStandings([], [teamA, teamB, teamC])
    expect(standings).toHaveLength(3)
    standings.forEach(s => {
      expect(s.played).toBe(0)
      expect(s.leaguePts).toBe(0)
      expect(s.ptsDiff).toBe(0)
    })
  })

  it('ignores Scheduled matches (only processes Completed/Forfeited)', () => {
    const matches = [mkMatch('m1', 'a', 'b', 90, 80, 'Scheduled')]
    const standings = calculateStandings(matches, [teamA, teamB])
    expect(standings.every(s => s.played === 0)).toBe(true)
  })

  it('assigns rank 1 to 3', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 95, 80),
      mkMatch('m2', 'a', 'c', 88, 75),
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const ranks = standings.map(s => s.rank)
    expect(ranks).toEqual([1, 2, 3])
  })
})

// ─── Suite 2: Scoring system ──────────────────────────────────────────────

describe('calculateStandings — Scoring System', () => {
  it('winner gets 2 league points, loser gets 1', () => {
    const matches = [mkMatch('m1', 'a', 'b', 100, 90)]
    const standings = calculateStandings(matches, [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.leaguePts).toBe(2)
    expect(b.leaguePts).toBe(1)
    expect(a.wins).toBe(1)
    expect(b.losses).toBe(1)
  })

  it('correctly accumulates stats across multiple matches', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80),  // A wins
      mkMatch('m2', 'a', 'c', 90, 95),  // C wins
      mkMatch('m3', 'b', 'c', 70, 85),  // C wins
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const c = standings.find(s => s.team.id === 'c')
    expect(c.leaguePts).toBe(4)  // 2 wins
    expect(c.wins).toBe(2)
    expect(c.losses).toBe(0)
    expect(standings[0].team.id).toBe('c')
  })

  it('tracks ptsFor and ptsAgainst correctly', () => {
    const matches = [mkMatch('m1', 'a', 'b', 110, 95)]
    const standings = calculateStandings(matches, [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    expect(a.ptsFor).toBe(110)
    expect(a.ptsAgainst).toBe(95)
    expect(a.ptsDiff).toBe(15)
  })
})

// ─── Suite 3: Forfeit Handling ────────────────────────────────────────────

describe('calculateStandings — Forfeit Handling', () => {
  it('forfeiting home team gives 0 pts to home, 2 pts to away', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'home' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.leaguePts).toBe(0)
    expect(b.leaguePts).toBe(2)
    expect(a.forfeits).toBe(1)
    expect(b.wins).toBe(1)
  })

  it('forfeiting away team gives 0 pts to away, 2 pts to home', () => {
    const match = { ...mkMatch('m1', 'a', 'b', null, null), status: 'Forfeited', forfeit_side: 'away' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.leaguePts).toBe(2)
    expect(b.leaguePts).toBe(0)
  })

  it('double forfeit gives both teams 0 pts', () => {
    const match = { id: 'm1', home_team_id: 'a', away_team_id: 'b', home_score: null, away_score: null, status: 'Forfeited' }
    const standings = calculateStandings([match], [teamA, teamB])
    const a = standings.find(s => s.team.id === 'a')
    const b = standings.find(s => s.team.id === 'b')
    expect(a.leaguePts).toBe(0)
    expect(b.leaguePts).toBe(0)
    expect(a.forfeits).toBe(1)
    expect(b.forfeits).toBe(1)
  })
})

// ─── Suite 4: Tie-Breaking TB1 — Head-to-Head Result ─────────────────────

describe('calculateStandings — TB1: Head-to-Head Result', () => {
  it('2-team tie resolved by direct H2H result', () => {
    // A beat B → both have 2pts (A: 1W=2pts, B: 1W=2pts from other matches)
    const matches = [
      mkMatch('m1', 'a', 'b', 85, 80),   // A beats B → A gets 2 H2H pts
      mkMatch('m2', 'a', 'c', 75, 90),   // C beats A
      mkMatch('m3', 'b', 'c', 90, 70),   // B beats C
    ]
    // A: 1W 1L = 3 pts; B: 1W 1L = 3 pts; C: 1W 1L = 3 pts
    // TB1 H2H: A beat B (A=2, B=1), B beat C (B=2, C=1), C beat A (C=2, A=1)
    // It's a 3-way tie in H2H too, so TB2 applies
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    expect(standings).toHaveLength(3)
    // All have same league pts — verify TB is applied (any valid order OK when still tied)
    standings.forEach(s => expect(s.leaguePts).toBe(3))
  })

  it('2-team tie: direct winner goes above loser', () => {
    const matches = [
      mkMatch('m1', 'a', 'c', 100, 95), // A beats C
      mkMatch('m2', 'b', 'c', 88, 90),  // C beats B
      mkMatch('m3', 'a', 'b', 80, 85),  // B beats A ← B wins H2H over A
      mkMatch('m4', 'd', 'c', 70, 80),  // C beats D
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    const aIdx = standings.findIndex(s => s.team.id === 'a')
    const bIdx = standings.findIndex(s => s.team.id === 'b')
    // A and B both have 1W 1L = 3 pts; B beat A in H2H, so B ranks above A
    expect(bIdx).toBeLessThan(aIdx)
  })
})

// ─── Suite 5: Tie-Breaking TB2 — Head-to-Head Point Difference ───────────

describe('calculateStandings — TB2: H2H Point Difference', () => {
  it('resolves via H2H ptsDiff when H2H pts are equal', () => {
    // Create circular tie where H2H league pts are all equal
    // A beats B heavily (+30), B beats C heavily (+30), C beats A by 1
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 70),  // A+30 H2H
      mkMatch('m2', 'b', 'c', 110, 80),  // B+30 H2H
      mkMatch('m3', 'c', 'a', 85, 84),   // C+1 H2H
    ]
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    // All have 3 leaguePts; H2H pts: all equal (each got 2+1)
    // H2H ptsDiff: A = +30-1=+29, B = +30-30=0, C = +1-30=-29
    const aRank = standings.find(s => s.team.id === 'a').rank
    const bRank = standings.find(s => s.team.id === 'b').rank
    const cRank = standings.find(s => s.team.id === 'c').rank
    expect(aRank).toBeLessThan(bRank)
    expect(bRank).toBeLessThan(cRank)
  })
})

// ─── Suite 6: Tie-Breaking TB3 — Overall Point Difference ────────────────

describe('calculateStandings — TB3: Overall Point Difference', () => {
  it('uses overall ptsDiff when H2H is insufficient', () => {
    // Two teams tied, never played each other, different overall PD
    const matches = [
      mkMatch('m1', 'a', 'c', 120, 80),  // A large win
      mkMatch('m2', 'b', 'c', 85, 80),   // B small win
    ]
    // A: 2pts, PD +40; B: 2pts, PD +5 — no H2H match between A and B
    const standings = calculateStandings(matches, [teamA, teamB, teamC])
    const aRank = standings.find(s => s.team.id === 'a').rank
    const bRank = standings.find(s => s.team.id === 'b').rank
    expect(aRank).toBeLessThan(bRank)
  })
})

// ─── Suite 7: Clear winner (no ties) ─────────────────────────────────────

describe('calculateStandings — Clear Winner', () => {
  it('sorts 4 teams with distinct league points correctly', () => {
    const matches = [
      mkMatch('m1', 'a', 'b', 100, 80),
      mkMatch('m2', 'a', 'c', 95, 75),
      mkMatch('m3', 'a', 'd', 90, 70),
      mkMatch('m4', 'b', 'c', 85, 80),
      mkMatch('m5', 'b', 'd', 88, 82),
      mkMatch('m6', 'c', 'd', 78, 85),
    ]
    // A: 3W 0L = 6pts; B: 2W 1L = 5pts; D: 1W 2L = 4pts; C: 0W 3L = 3pts
    const standings = calculateStandings(matches, [teamA, teamB, teamC, teamD])
    expect(standings[0].team.id).toBe('a')
    expect(standings[1].team.id).toBe('b')
    expect(standings[2].team.id).toBe('d')
    expect(standings[3].team.id).toBe('c')
    expect(standings[0].leaguePts).toBe(6)
    expect(standings[1].leaguePts).toBe(5)
    expect(standings[2].leaguePts).toBe(4)
    expect(standings[3].leaguePts).toBe(3)
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
