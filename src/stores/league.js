import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { calculateStandings } from '@/utils/standings.js'
import { useAuthStore } from '@/stores/auth.js'

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
      let query = supabase.from('teams').select('*').order('name').range(0, 499)
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
    logAuditAction('CREATE_TEAM', data.id, payload)
    return data
  }

  async function updateTeam(id, payload) {
    const targetIdx = teams.value.findIndex(t => t.id === id)
    if (targetIdx === -1) return null
    const originalTeam = { ...teams.value[targetIdx] }
    
    // Optimistic Update
    teams.value[targetIdx] = { ...originalTeam, ...payload }

    try {
      const { data, error: err } = await supabase.from('teams').update(payload).eq('id', id).select().single()
      if (err) throw err
      const idx = teams.value.findIndex(t => t.id === id)
      if (idx !== -1) teams.value[idx] = data
      
      logAuditAction('UPDATE_TEAM', id, payload)
      return data
    } catch (err) {
      if (isNetworkError(err) || !navigator.onLine) {
        // Simple offline queuing for teams
        // For complexity, we don't queue non-score items as robustly since it's an admin task, 
        // but we preserve the optimistic state if it's network-related.
        console.warn('Network offline during team update. Note: Team edits are not fully flushed to queue.')
        return teams.value[targetIdx]
      } else {
        const idx = teams.value.findIndex(t => t.id === id)
        if (idx !== -1) teams.value[idx] = originalTeam
        throw err
      }
    }
  }

  async function deleteTeam(id) {
    const { error: err } = await supabase.from('teams').delete().eq('id', id)
    if (err) throw err
    teams.value = teams.value.filter(t => t.id !== id)
    logAuditAction('DELETE_TEAM', id, { team_id: id })
  }

  // ─── Rounds ──────────────────────────────────────────────────────────────

  async function fetchRounds(seasonYear = null) {
    loading.value = true
    error.value = null
    try {
      let query = supabase.from('rounds').select('*').order('round_number').range(0, 200)
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
    logAuditAction('UPDATE_ROUND', id, payload)
    return data
  }

  async function createRound(seasonYear, roundNumber) {
    const { data, error: err } = await supabase.from('rounds').insert({
      season_year: seasonYear,
      round_number: roundNumber,
      status: 'Pending'
    }).select().single()
    if (err) throw err
    rounds.value.push(data)
    logAuditAction('CREATE_ROUND', data.id, data)
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
    
    if (matches.value.length > 0 && matches.value[0].round_id === data.round_id) {
       matches.value.push(data)
    }
    logAuditAction('CREATE_MATCH', data.id, payload)
    return data
  }

  async function updateMatch(id, payload) {
    const targetIdx = matches.value.findIndex(m => m.id === id)
    if (targetIdx === -1) return null
    const originalMatch = { ...matches.value[targetIdx] }
    
    // Optimistic Update
    matches.value[targetIdx] = { ...originalMatch, ...payload, _syncing: true }

    try {
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
      
      logAuditAction('UPDATE_MATCH', id, payload)
      return data
    } catch (err) {
      if (isNetworkError(err) || !navigator.onLine) {
        const idx = matches.value.findIndex(m => m.id === id)
        if (idx !== -1) matches.value[idx]._syncing = 'offline'
        offlineQueue.value = offlineQueue.value.filter(q => q.matchId !== id)
        offlineQueue.value.push({ matchId: id, payload, timestamp: Date.now() })
        saveQueue()
        return matches.value[targetIdx]
      } else {
        const idx = matches.value.findIndex(m => m.id === id)
        if (idx !== -1) matches.value[idx] = originalMatch
        throw err
      }
    }
  }

  async function deleteMatch(id) {
    const { error: err } = await supabase.from('matches').delete().eq('id', id)
    if (err) throw err
    matches.value = matches.value.filter(m => m.id !== id)
    logAuditAction('DELETE_MATCH', id, { match_id: id })
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

  // ─── Optimistic Updates & Offline Resiliency ─────────────────────────────
  
  const offlineQueue = ref(JSON.parse(localStorage.getItem('ebf_offline_queue') || '[]'))

  function saveQueue() {
    localStorage.setItem('ebf_offline_queue', JSON.stringify(offlineQueue.value))
  }

  function isNetworkError(err) {
    return err.message === 'Failed to fetch' || err.message.includes('NetworkError') || err.message.includes('fetch failed')
  }

  async function syncOfflineQueue() {
    if (offlineQueue.value.length === 0 || !navigator.onLine) return

    let remainingQueue = [...offlineQueue.value]
    
    for (const item of offlineQueue.value) {
      try {
        const { data, error: err } = await supabase
          .from('matches')
          .update(item.payload)
          .eq('id', item.matchId)
          .select(`
            *,
            home_team:teams!home_team_id(id, name, gender, logo_url),
            away_team:teams!away_team_id(id, name, gender, logo_url)
          `)
          .single()
        
        if (!err) {
           const idx = matches.value.findIndex(m => m.id === item.matchId)
           if (idx !== -1) matches.value[idx] = data
           remainingQueue = remainingQueue.filter(q => q.timestamp !== item.timestamp)
        }
      } catch (e) {
        console.error('Failed to sync offline update:', e)
        if (!isNetworkError(e)) {
           // If it's a hard DB error or invalid input, remove it from queue to avoid permanent blockage
           remainingQueue = remainingQueue.filter(q => q.timestamp !== item.timestamp)
        }
      }
    }
    
    offlineQueue.value = remainingQueue
    saveQueue()
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', syncOfflineQueue)
    // Run sync on startup if online
    setTimeout(syncOfflineQueue, 2000)
  }

  // ─── Audit Logging ───────────────────────────────────────────────────────

  async function logAuditAction(actionName, entityId, payload) {
    try {
      const auth = useAuthStore()
      if (!auth.user?.id) return // Fail silently if no logged in user

      const { error: err } = await supabase.from('audit_logs').insert({
        user_id: auth.user.id,
        action: actionName,
        entity_id: String(entityId),
        details: payload
      })
      
      if (err) {
        console.warn('Silent Audit Log Warning: Failed to record action', err)
      }
    } catch (e) {
      console.error('Audit Logging Error', e)
    }
  }

  async function performOptimisticUpdate(matchId, payload) {
    const targetIdx = matches.value.findIndex(m => m.id === matchId)
    if (targetIdx === -1) return null

    // 1. Save Original State for possible rollback
    const originalMatch = { ...matches.value[targetIdx] }

    // 2. Optimistic Local Update
    matches.value[targetIdx] = {
      ...originalMatch,
      ...payload,
      _syncing: true // Optional flag for UI
    }

    try {
      const { data, error: err } = await supabase
        .from('matches')
        .update(payload)
        .eq('id', matchId)
        .select(`
          *,
          home_team:teams!home_team_id(id, name, gender, logo_url),
          away_team:teams!away_team_id(id, name, gender, logo_url)
        `)
        .single()
        
      if (err) throw err

      // 3. Success: Replace with DB truth
      const idx = matches.value.findIndex(m => m.id === matchId)
      if (idx !== -1) matches.value[idx] = data
      
      const actionName = payload.status === 'Forfeited' ? 'MARK_FORFEIT' : 'UPDATE_MATCH_SCORE';
      logAuditAction(actionName, matchId, payload)
      
      return data
    } catch (err) {
      // 4. Failure Handling
      if (isNetworkError(err) || !navigator.onLine) {
         const idx = matches.value.findIndex(m => m.id === matchId)
         if (idx !== -1) matches.value[idx]._syncing = 'offline'

         // Add to Queue (replace any previous pending updates for same match)
         offlineQueue.value = offlineQueue.value.filter(q => q.matchId !== matchId)
         offlineQueue.value.push({ matchId, payload, timestamp: Date.now() })
         saveQueue()
         
         // Return optimistically updated data
         return matches.value[targetIdx]
      } else {
         // Hard database error -> Rollback
         const idx = matches.value.findIndex(m => m.id === matchId)
         if (idx !== -1) matches.value[idx] = originalMatch
         throw err
      }
    }
  }

  async function updateMatchScore(matchId, homeScore, awayScore, isOT = false) {
    const status = (homeScore !== null && awayScore !== null) ? 'Completed' : 'Scheduled'
    const payload = {
      home_score: homeScore, 
      away_score: awayScore, 
      status,
      is_ot: isOT
    }
    return performOptimisticUpdate(matchId, payload)
  }

  async function markMatchForfeit(matchId, forfeitingTeamSide) {
    const payload = forfeitingTeamSide === 'home'
      ? { home_score: 0, away_score: 20, status: 'Forfeited', forfeit_side: 'home' }
      : { home_score: 20, away_score: 0, status: 'Forfeited', forfeit_side: 'away' }
    return performOptimisticUpdate(matchId, payload)
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

    logAuditAction('FINALIZE_ROUND', roundId, { snapshot_count: finalStandings.length })

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
      
      // Batch queries in chunks of 15 to avoid massive IN clauses & 1000-row limits
      const chunkSize = 15;
      let aggregatedMatches = [];
      
      for (let i = 0; i < roundIds.length; i += chunkSize) {
        const chunk = roundIds.slice(i, i + chunkSize);
        
        const { data, error: err } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:teams!home_team_id(id, name, gender, logo_url),
            away_team:teams!away_team_id(id, name, gender, logo_url),
            round:rounds(id, round_number, season_year)
          `)
          .in('round_id', chunk)
          .order('match_date', { nullsFirst: true })
          .range(0, 999) // Explicit maximum to enforce predictability within chunks

        if (err) throw err
        if (data) {
          aggregatedMatches = aggregatedMatches.concat(data)
        }
      }
      
      // Re-sort the final aggregated array just in case chunks arrive slightly unordered
      aggregatedMatches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
      
      cumulativeMatches.value = aggregatedMatches
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
