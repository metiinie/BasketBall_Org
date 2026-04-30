import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { _sortStandings } from '@/utils/standings.js'

export const useGlobalStore = defineStore('global', () => {
  const snapshots = ref([])
  const globalStandings = ref([])
  const seasonYears = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchGlobalStandings(seasonYear = null) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('round_snapshots')
        .select(`*, rounds!inner(id, round_number, season_year, status)`)

      if (seasonYear) {
        query = query.eq('rounds.season_year', seasonYear)
      }

      const { data, error: err } = await query
      if (err) throw err

      const validSnapshots = (data || []).filter(s => s.rounds?.status === 'Completed')
      snapshots.value = validSnapshots

      const years = [...new Set(validSnapshots.map(s => s.rounds?.season_year).filter(Boolean))]
      seasonYears.value = years.sort((a, b) => b - a)

      // Fetch all matches across these completed rounds to perform proper FIBA H2H tiebreakers
      const roundIds = validSnapshots.map(s => s.round_id)
      let allMatches = []
      
      const chunkSize = 15;
      for (let i = 0; i < roundIds.length; i += chunkSize) {
        const chunk = roundIds.slice(i, i + chunkSize);
        
        const { data: matchesChunk, error: matchErr } = await supabase
          .from('matches')
          .select('*')
          .in('round_id', chunk)
          .eq('status', 'Completed')
          .range(0, 999) // ensure predictability per chunk
          
        if (!matchErr && matchesChunk) {
           allMatches = allMatches.concat(matchesChunk)
        }
      }

      globalStandings.value = aggregateStandings(validSnapshots, allMatches)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function aggregateStandings(snapshotsData, allMatches) {
    const aggregate = {}

    snapshotsData.forEach(snapshot => {
      const standings = snapshot.historical_standings_json || []
      standings.forEach(entry => {
        const id = entry.team.id
        if (!aggregate[id]) {
          aggregate[id] = {
            team: entry.team,
            played: 0, wins: 0, losses: 0,
            homeW: 0, homeL: 0, roadW: 0, roadL: 0,
            ptsFor: 0, ptsAgainst: 0, ptsDiff: 0,
            leaguePts: 0, forfeits: 0, roundsPlayed: 0,
          }
        }
        aggregate[id].played     += entry.played
        aggregate[id].wins       += entry.wins
        aggregate[id].losses     += entry.losses
        aggregate[id].homeW      += (entry.homeW || 0)
        aggregate[id].homeL      += (entry.homeL || 0)
        aggregate[id].roadW      += (entry.roadW || 0)
        aggregate[id].roadL      += (entry.roadL || 0)
        aggregate[id].ptsFor     += entry.ptsFor
        aggregate[id].ptsAgainst += entry.ptsAgainst
        aggregate[id].ptsDiff    += entry.ptsDiff
        aggregate[id].leaguePts  += entry.leaguePts
        aggregate[id].forfeits   += (entry.forfeits || 0)
        aggregate[id].roundsPlayed++
      })
    })

    // Recalculate PCT from aggregated wins/played (summing PCT values is invalid)
    Object.values(aggregate).forEach(s => {
      if (s.played > 0) {
        const p = s.wins / s.played
        s.pct = p === 1 ? '1.000' : p.toFixed(3).replace(/^0/, '')
      } else {
        s.pct = '.000'
      }
    })

    const rawStandings = Object.values(aggregate)
    const sorted = _sortStandings(rawStandings, allMatches)
    // Recalculate GB from aggregated data
    if (sorted.length > 0) {
      const leader = sorted[0]
      sorted.forEach((s, i) => {
        s.rank = i + 1
        if (i === 0 || leader.played === 0) {
          s.gb = '—'
        } else {
          const diff = ((leader.wins - s.wins) + (s.losses - leader.losses)) / 2
          s.gb = diff === 0 ? '—' : diff.toString()
        }
      })
    }
    return sorted
  }

  return { snapshots, globalStandings, seasonYears, loading, error, fetchGlobalStandings }
})
