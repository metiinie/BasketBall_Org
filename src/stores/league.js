import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { calculateStandings } from '@/utils/standings.js'

export const useLeagueStore = defineStore('league', () => {
  const teams = ref([])
  const rounds = ref([])
  const activeRound = ref(null)
  const matches = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Global Context Filters (NBA-style)
  const selectedGender = ref('ወንድ')
  const selectedSeason = ref(2025)

  /** Reactive standings computed from current round matches + teams */
  const standings = computed(() => {
    if (!teams.value.length) return []
    return calculateStandings(matches.value, teams.value)
  })

  let matchSubscription = null

  // ─── Teams ───────────────────────────────────────────────────────────────

  async function fetchTeams(gender = null) {
    loading.value = true
    error.value = null
    try {
      let query = supabase.from('teams').select('*').order('name')
      if (gender) query = query.eq('gender', gender)
      const { data, error: err } = await query
      if (err) throw err
      teams.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createTeam(payload) {
    const { data, error: err } = await supabase.from('teams').insert(payload).select().single()
    if (err) throw err
    teams.value.push(data)
    return data
  }

  async function updateTeam(id, payload) {
    const { data, error: err } = await supabase.from('teams').update(payload).eq('id', id).select().single()
    if (err) throw err
    const idx = teams.value.findIndex(t => t.id === id)
    if (idx !== -1) teams.value[idx] = data
    return data
  }

  async function deleteTeam(id) {
    const { error: err } = await supabase.from('teams').delete().eq('id', id)
    if (err) throw err
    teams.value = teams.value.filter(t => t.id !== id)
  }

  // ─── Rounds ──────────────────────────────────────────────────────────────

  async function fetchRounds(seasonYear = null) {
    loading.value = true
    error.value = null
    try {
      let query = supabase.from('rounds').select('*').order('round_number')
      if (seasonYear) query = query.eq('season_year', seasonYear)
      const { data, error: err } = await query
      if (err) throw err
      rounds.value = data || []
      activeRound.value = data?.find(r => r.status === 'Active') ?? null
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function updateRound(id, payload) {
    const { data, error: err } = await supabase.from('rounds').update(payload).eq('id', id).select().single()
    if (err) throw err
    const idx = rounds.value.findIndex(r => r.id === id)
    if (idx !== -1) rounds.value[idx] = data
    if (activeRound.value?.id === id) activeRound.value = data
    return data
  }

  async function createRound(seasonYear, roundNumber) {
    // Check if there's an active round first. We might want to deactivate it or just let the user know.
    const { data, error: err } = await supabase.from('rounds').insert({
      season_year: seasonYear,
      round_number: roundNumber,
      status: 'Pending' // Start as pending, user can activate it
    }).select().single()
    if (err) throw err
    rounds.value.push(data)
    return data
  }

  // ─── Matches ─────────────────────────────────────────────────────────────

  async function createMatch(payload) {
    const { data, error: err } = await supabase
      .from('matches')
      .insert(payload)
      .select(`
        *,
        home_team:teams!home_team_id(id, name, gender, logo_url),
        away_team:teams!away_team_id(id, name, gender, logo_url)
      `)
      .single()
    if (err) throw err
    // Only add to local state if the scheduled match is in the currently viewed round.
    if (matches.value.length > 0 && matches.value[0].round_id === data.round_id) {
       matches.value.push(data)
    }
    return data
  }

  async function updateMatch(id, payload) {
    const { data, error: err } = await supabase
      .from('matches')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        home_team:teams!home_team_id(id, name, gender, logo_url),
        away_team:teams!away_team_id(id, name, gender, logo_url)
      `)
      .single()
    if (err) throw err
    const idx = matches.value.findIndex(m => m.id === id)
    if (idx !== -1) matches.value[idx] = data
    return data
  }

  async function deleteMatch(id) {
    const { error: err } = await supabase.from('matches').delete().eq('id', id)
    if (err) throw err
    matches.value = matches.value.filter(m => m.id !== id)
  }

  async function fetchMatches(roundId) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(id, name, gender, logo_url),
          away_team:teams!away_team_id(id, name, gender, logo_url),
          round:rounds(id, round_number, season_year)
        `)
        .eq('round_id', roundId)
        .order('match_date', { nullsFirst: true })
      if (err) throw err
      matches.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /** Subscribe to real-time match updates for the active round */
  function subscribeToMatches(roundId) {
    if (matchSubscription) matchSubscription.unsubscribe()
    matchSubscription = supabase
      .channel(`matches:round:${roundId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `round_id=eq.${roundId}` },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload
          if (eventType === 'INSERT') {
            // Re-fetch the full match with team joins
            const { data: fullMatch } = await supabase
              .from('matches')
              .select(`
                *,
                home_team:teams!home_team_id(id, name, gender, logo_url),
                away_team:teams!away_team_id(id, name, gender, logo_url),
                round:rounds(id, round_number, season_year)
              `)
              .eq('id', newRecord.id)
              .single()
            if (fullMatch) {
              matches.value.push(fullMatch)
              // If cumulative is loaded, it should also include this new match
              if (cumulativeMatches.value.length > 0) cumulativeMatches.value.push(fullMatch)
            }
          } else if (eventType === 'UPDATE') {
            const idx = matches.value.findIndex(m => m.id === newRecord.id)
            if (idx !== -1) matches.value[idx] = { ...matches.value[idx], ...newRecord }
            
            const cumIdx = cumulativeMatches.value.findIndex(m => m.id === newRecord.id)
            if (cumIdx !== -1) cumulativeMatches.value[cumIdx] = { ...cumulativeMatches.value[cumIdx], ...newRecord }
          } else if (eventType === 'DELETE') {
            matches.value = matches.value.filter(m => m.id !== oldRecord.id)
            cumulativeMatches.value = cumulativeMatches.value.filter(m => m.id !== oldRecord.id)
          }
        })
      .subscribe()
  }

  function unsubscribeFromMatches() {
    if (matchSubscription) {
      matchSubscription.unsubscribe()
      matchSubscription = null
    }
  }

  async function updateMatchScore(matchId, homeScore, awayScore, isOT = false) {
    const status = (homeScore !== null && awayScore !== null) ? 'Completed' : 'Scheduled'
    const { data, error: err } = await supabase
      .from('matches')
      .update({ 
        home_score: homeScore, 
        away_score: awayScore, 
        status,
        is_ot: isOT // We'll pass this; if it doesn't exist, Supabase will safely ignore it OR error (which we want to know)
      })
      .eq('id', matchId)
      .select(`
        *,
        home_team:teams!home_team_id(id, name, gender, logo_url),
        away_team:teams!away_team_id(id, name, gender, logo_url)
      `)
      .single()
    if (err) throw err
    const idx = matches.value.findIndex(m => m.id === matchId)
    if (idx !== -1) matches.value[idx] = data
    return data
  }

  async function markMatchForfeit(matchId, forfeitingTeamSide) {
    // Standard FIBA rule: Winner gets 20, Forfeiter gets 0 (or null but we'll use 0 for DB score consistency if needed)
    // However, the standings calculator will award 20 virtual points anyway.
    // For direct DB clarity as requested: 20 - 0.
    const update = forfeitingTeamSide === 'home'
      ? { home_score: 0, away_score: 20, status: 'Forfeited', forfeit_side: 'home' }
      : { home_score: 20, away_score: 0, status: 'Forfeited', forfeit_side: 'away' }
    
    const { data, error: err } = await supabase.from('matches').update(update).eq('id', matchId).select(`
      *,
      home_team:teams!home_team_id(id, name, gender, logo_url),
      away_team:teams!away_team_id(id, name, gender, logo_url)
    `).single()
    
    if (err) throw err
    const idx = matches.value.findIndex(m => m.id === matchId)
    if (idx !== -1) matches.value[idx] = data
    return data
  }

  // ─── Round Finalisation ──────────────────────────────────────────────────

  async function finalizeRound(roundId) {
    // 1. Compute final standings snapshot — save extended stats for global standings display
    const finalStandings = standings.value.map(s => ({
      team: { id: s.team.id, name: s.team.name, gender: s.team.gender, logo_url: s.team.logo_url },
      rank: s.rank,
      played: s.played, wins: s.wins, losses: s.losses,
      homeW: s.homeW, homeL: s.homeL,
      roadW: s.roadW, roadL: s.roadL,
      ptsFor: s.ptsFor, ptsAgainst: s.ptsAgainst,
      ptsDiff: s.ptsDiff, leaguePts: s.leaguePts,
      pct: s.pct, gb: s.gb, forfeits: s.forfeits,
    }))

    // 2. Upsert snapshot
    const { error: snapErr } = await supabase
      .from('round_snapshots')
      .upsert({ round_id: roundId, historical_standings_json: finalStandings })
    if (snapErr) throw snapErr

    // 3. Mark round as Completed
    const { error: roundErr } = await supabase
      .from('rounds')
      .update({ status: 'Completed' })
      .eq('id', roundId)
    if (roundErr) throw roundErr

    // 4. Activate next round (if exists)
    const current = rounds.value.find(r => r.id === roundId)
    if (current) {
      const next = rounds.value.find(r => r.round_number === current.round_number + 1)
      if (next) {
        await supabase.from('rounds').update({ status: 'Active' }).eq('id', next.id)
      }
    }

    // 5. Refresh rounds state — pass the season year to avoid loading all seasons
    const seasonYear = current?.season_year || selectedSeason.value
    await fetchRounds(seasonYear)
    matches.value = []
  }

  const cumulativeMatches = ref([])
  const cumulativeStandings = computed(() => {
    if (!teams.value.length) return []
    return calculateStandings(cumulativeMatches.value, teams.value)
  })

  async function fetchCumulativeMatches(roundId) {
    loading.value = true
    error.value = null
    try {
      const currentRound = rounds.value.find(r => r.id === roundId)
      if (!currentRound) return

      // Include all rounds in the same season up to the currently selected round's number
      const validRounds = rounds.value.filter(r => 
        r.season_year === currentRound.season_year && 
        r.round_number <= currentRound.round_number
      )
      const roundIds = validRounds.map(r => r.id)
      
      const { data, error: err } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(id, name, gender, logo_url),
          away_team:teams!away_team_id(id, name, gender, logo_url),
          round:rounds(id, round_number, season_year)
        `)
        .in('round_id', roundIds)
        .order('match_date', { nullsFirst: true })
        
      if (err) throw err
      cumulativeMatches.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /** Clear matches from local state (use instead of direct mutation) */
  function clearMatches() {
    matches.value = []
  }

  return {
    teams, rounds, activeRound, matches, cumulativeMatches, standings, cumulativeStandings, loading, error,
    selectedGender, selectedSeason,
    fetchTeams, createTeam, updateTeam, deleteTeam,
    fetchRounds, createRound,
    fetchMatches, fetchCumulativeMatches, createMatch, updateMatch, deleteMatch,
    subscribeToMatches, unsubscribeFromMatches,
    updateMatchScore, markMatchForfeit,
    finalizeRound, updateRound, clearMatches
  }
})
