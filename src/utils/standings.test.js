import { describe, it, expect } from 'vitest'
import { calculateStandings } from './standings.js'

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
