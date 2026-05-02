import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import api from '@/lib/api.js'
import { socket, connectSocket } from '@/lib/socket.js'
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

  // Helper to normalize gender from DB (MALE/FEMALE) to UI (ወንድ/ሴት)
  const normalizeGender = (g) => {
    if (g === 'MALE' || g === 'ወንድ') return 'ወንድ'
    if (g === 'FEMALE' || g === 'ሴት') return 'ሴት'
    return g
  }

  // Computed teams normalized and filtered by current selectedGender
  const normalizedTeams = computed(() => {
    return teams.value.map(t => ({
      ...t,
      gender: normalizeGender(t.gender)
    }))
  })

  const filteredTeams = computed(() => {
    return normalizedTeams.value.filter(t => t.gender === selectedGender.value)
  })

  // ─── Storage ─────────────────────────────────────────────────────────────

  /**
   * Upload a team logo to Supabase Storage.
   * Assumes a public bucket named 'logos' exists.
   */
  async function uploadTeamLogo(file) {
    if (!file) return null
    loading.value = true
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `team-logos/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

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
      const response = await api.get('/teams', { params: { gender } })
      teams.value = response.data || []
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  async function createTeam(payload) {
    const response = await api.post('/teams', payload)
    const data = response.data
    teams.value.push(data)
    return data
  }

  async function updateTeam(id, payload) {
    const targetIdx = teams.value.findIndex(t => t.id === id)
    if (targetIdx === -1) return null
    const originalTeam = { ...teams.value[targetIdx] }
    
    // Optimistic Update
    teams.value[targetIdx] = { ...originalTeam, ...payload }

    try {
      const response = await api.patch(`/teams/${id}`, payload)
      const data = response.data
      const idx = teams.value.findIndex(t => t.id === id)
      if (idx !== -1) teams.value[idx] = data
      
      return data
    } catch (err) {
      if (isNetworkError(err) || !navigator.onLine) {
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
    await api.delete(`/teams/${id}`)
    teams.value = teams.value.filter(t => t.id !== id)
  }

  // ─── Rounds ──────────────────────────────────────────────────────────────

  async function fetchRounds(seasonYear = null) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/rounds', {
        params: {
          season_year: seasonYear,
          gender: selectedGender.value
        }
      })
      const data = response.data
      rounds.value = data || []
      activeRound.value = data?.find(r => r.status === 'Active') ?? null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  async function updateRound(id, payload) {
    const response = await api.patch(`/rounds/${id}`, payload)
    const data = response.data
    const idx = rounds.value.findIndex(r => r.id === id)
    if (idx !== -1) rounds.value[idx] = data
    if (activeRound.value?.id === id) activeRound.value = data
    return data
  }

  async function createRound(seasonYear, roundNumber) {
    const response = await api.post('/rounds', {
      season_year: seasonYear,
      round_number: roundNumber,
      gender: selectedGender.value,
      status: 'Pending'
    })
    const data = response.data
    rounds.value.push(data)
    return data
  }

  /**
   * Set any round as the Active round for the current gender+season.
   * Safely deactivates the previous active round first.
   */
  async function setActiveRound(roundId) {
    loading.value = true
    try {
      // 1. Find the round to activate
      const targetRound = rounds.value.find(r => r.id === roundId)
      if (!targetRound) throw new Error('Round not found')

      // 2. Deactivate any currently active round in the same gender+season
      const currentlyActive = rounds.value.find(r => r.status === 'Active')
      if (currentlyActive && currentlyActive.id !== roundId) {
        await api.patch(`/rounds/${currentlyActive.id}`, { status: 'Completed' })
      }

      // 3. Activate the target round
      const response = await api.patch(`/rounds/${roundId}`, { status: 'Active' })
      const data = response.data

      // 4. Refresh rounds state
      await fetchRounds(targetRound.season_year)
    } catch (e) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // ─── Matches ─────────────────────────────────────────────────────────────

  async function createMatch(payload) {
    const response = await api.post('/matches', payload)
    const data = response.data
    
    if (matches.value.length > 0 && matches.value[0].round_id === data.round_id) {
       matches.value.push(data)
    }
    return data
  }

  async function updateMatch(id, payload) {
    const targetIdx = matches.value.findIndex(m => m.id === id)
    if (targetIdx === -1) return null
    const originalMatch = { ...matches.value[targetIdx] }
    
    // Optimistic Update
    matches.value[targetIdx] = { ...originalMatch, ...payload, _syncing: true }

    try {
      const response = await api.patch(`/matches/${id}`, payload)
      const data = response.data
      
      const idx = matches.value.findIndex(m => m.id === id)
      if (idx !== -1) matches.value[idx] = data
      
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
    await api.delete(`/matches/${id}`)
    matches.value = matches.value.filter(m => m.id !== id)
  }

  async function fetchMatches(roundId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/matches', { params: { round_id: roundId } })
      matches.value = response.data || []
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  /** Subscribe to real-time match updates for a specific round */
  function subscribeToMatches(roundId) {
    if (!roundId) return
    
    connectSocket()
    
    // Join the specific round room
    socket.emit('joinRound', roundId)

    // Listen for updates
    socket.on('matchUpdated', (updatedMatch) => {
      console.log('Real-time Match Update Received:', updatedMatch)
      const idx = matches.value.findIndex(m => m.id === updatedMatch.id)
      if (idx !== -1) {
        matches.value[idx] = updatedMatch
      } else if (matches.value.length > 0 && matches.value[0].round_id === updatedMatch.round_id) {
        matches.value.push(updatedMatch)
      }
    })
  }

  function unsubscribeFromMatches() {
    socket.off('matchUpdated')
    console.log('Unsubscribed from real-time updates')
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
        const response = await api.patch(`/matches/${item.matchId}`, item.payload)
        const data = response.data
        
        const idx = matches.value.findIndex(m => m.id === item.matchId)
        if (idx !== -1) matches.value[idx] = data
        remainingQueue = remainingQueue.filter(q => q.timestamp !== item.timestamp)
      } catch (e) {
        console.error('Failed to sync offline update:', e)
        if (!isNetworkError(e)) {
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
      const response = await api.patch(`/matches/${matchId}`, payload)
      const data = response.data
        
      // 3. Success: Replace with DB truth
      const idx = matches.value.findIndex(m => m.id === matchId)
      if (idx !== -1) matches.value[idx] = data
      
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
    await api.post('/snapshots', { round_id: roundId, historical_standings_json: finalStandings })

    // 3. Mark round as Completed
    await api.patch(`/rounds/${roundId}`, { status: 'Completed' })

    // 4. Activate next round for the same gender (if exists)
    const current = rounds.value.find(r => r.id === roundId)
    if (current) {
      // Find the next round in the same gender to avoid cross-gender activation
      const next = rounds.value.find(
        r => r.round_number === current.round_number + 1 && r.gender === current.gender
      )
      if (next) {
        await api.patch(`/rounds/${next.id}`, { status: 'Active' })
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
      
      const response = await api.get('/matches/cumulative', {
        params: { round_ids: roundIds.join(',') }
      })
      const aggregatedMatches = response.data || []
      
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

  /** Clear rounds and activeRound from local state */
  function clearRounds() {
    rounds.value = []
    activeRound.value = null
  }

  return {
    teams, rounds, activeRound, matches, cumulativeMatches, standings, cumulativeStandings, loading, error,
    selectedGender, selectedSeason, normalizedTeams, filteredTeams,
    fetchTeams, createTeam, updateTeam, deleteTeam,
    fetchRounds, createRound, setActiveRound,
    fetchMatches, fetchCumulativeMatches, createMatch, updateMatch, deleteMatch,
    subscribeToMatches, unsubscribeFromMatches,
    updateMatchScore, markMatchForfeit,
    finalizeRound, updateRound, clearMatches, clearRounds,
    uploadTeamLogo
  }
})
