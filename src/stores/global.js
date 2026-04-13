import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

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
        .select(`*, rounds(id, round_number, season_year, status)`)

      if (seasonYear) {
        // Filter via rounds join
        query = query.eq('rounds.season_year', seasonYear)
      }

      const { data, error: err } = await query
      if (err) throw err

      const validSnapshots = (data || []).filter(s => s.rounds?.status === 'Completed')
      snapshots.value = validSnapshots

      // Collect unique season years
      const years = [...new Set(validSnapshots.map(s => s.rounds?.season_year).filter(Boolean))]
      seasonYears.value = years.sort((a, b) => b - a)

      globalStandings.value = aggregateStandings(validSnapshots)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function aggregateStandings(snapshotsData) {
    const aggregate = {}

    snapshotsData.forEach(snapshot => {
      const standings = snapshot.historical_standings_json || []
      standings.forEach(entry => {
        const id = entry.team.id
        if (!aggregate[id]) {
          aggregate[id] = {
            team: entry.team,
            played: 0, wins: 0, losses: 0,
            ptsFor: 0, ptsAgainst: 0, ptsDiff: 0,
            leaguePts: 0, roundsPlayed: 0,
          }
        }
        aggregate[id].played += entry.played
        aggregate[id].wins += entry.wins
        aggregate[id].losses += entry.losses
        aggregate[id].ptsFor += entry.ptsFor
        aggregate[id].ptsAgainst += entry.ptsAgainst
        aggregate[id].ptsDiff += entry.ptsDiff
        aggregate[id].leaguePts += entry.leaguePts
        aggregate[id].roundsPlayed++
      })
    })

    return Object.values(aggregate)
      .sort((a, b) => {
        if (b.leaguePts !== a.leaguePts) return b.leaguePts - a.leaguePts
        return b.ptsDiff - a.ptsDiff
      })
      .map((s, i) => ({ ...s, rank: i + 1 }))
  }

  return { snapshots, globalStandings, seasonYears, loading, error, fetchGlobalStandings }
})
