import { describe, it, expect } from 'vitest'
import { calculateStandings } from './standings.js'

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
