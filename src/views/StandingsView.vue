<script setup>
import { ref, watch, onMounted } from 'vue'
import StandingsTable from '@/components/StandingsTable.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import { useLeagueStore } from '@/stores/league.js'
import { useGlobalStore } from '@/stores/global.js'

const league = useLeagueStore()
const global = useGlobalStore()

const selectedRound = ref(null)
const selectedGender = ref('ወንድ')

onMounted(async () => {
  await league.fetchRounds()
  // Default to active round
  if (league.activeRound) {
    selectedRound.value = league.activeRound.id
  } else if (league.rounds.length > 0) {
    selectedRound.value = league.rounds[0].id
  }
})

// Fetch matches + teams when round selection changes
watch(selectedRound, async (val) => {
  if (!val || val === 'global') {
    if (val === 'global') await global.fetchGlobalStandings()
    return
  }
  await Promise.all([
    league.fetchTeams(selectedGender.value),
    league.fetchMatches(val),
    league.subscribeToMatches(val),
  ])
})

watch(selectedGender, async () => {
  if (selectedRound.value && selectedRound.value !== 'global') {
    await league.fetchTeams(selectedGender.value)
  }
})

const currentRound = () => league.rounds.find(r => r.id === selectedRound.value)
const roundLabel = () => {
  if (selectedRound.value === 'global') return 'Global Season'
  const r = currentRound()
  return r ? `Round ${r.round_number}` : ''
}
const seasonYear = () => currentRound()?.season_year ?? ''
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
    <!-- Hero Banner -->
    <div class="card p-8">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-blue-600/30">
            <svg viewBox="0 0 32 32" class="w-6 h-6" fill="none" stroke="white" stroke-width="2">
              <circle cx="16" cy="16" r="10"/>
              <path d="M16 6 Q20 11 20 16 Q20 21 16 26"/>
              <path d="M16 6 Q12 11 12 16 Q12 21 16 26"/>
              <line x1="6" y1="16" x2="26" y2="16"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">EBF League Standings</h1>
            <p class="text-sm font-medium text-slate-500 capitalize tracking-wide">Ethiopian Basketball Federation</p>
          </div>
        </div>
        <!-- Live indicator -->
        <div v-if="league.activeRound" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-bold tracking-wide text-emerald-600 uppercase">Live · Round {{ league.activeRound.round_number }}</span>
        </div>
      </div>
    </div>

    <!-- Gender Filter -->
    <div class="flex gap-2">
      <button v-for="g in ['ወንድ', 'ሴት']" :key="g"
        @click="selectedGender = g"
        :class="[
          'flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200',
          selectedGender === g
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
        ]">
        <span>{{ g === 'ወንድ' ? '♂' : '♀' }}</span> {{ g }}
      </button>
    </div>

    <!-- Round Selector -->
    <div class="space-y-1.5">
      <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Round</h3>
      <RoundSelector
        v-model="selectedRound"
        :rounds="league.rounds"
        :show-global="true"
      />
    </div>

    <!-- Standings Table -->
    <div>
      <StandingsTable
        :standings="selectedRound === 'global' ? global.globalStandings : league.standings"
        :loading="league.loading || global.loading"
        :round-label="roundLabel()"
        :gender="selectedGender"
        :season-year="seasonYear()"
        :is-global="selectedRound === 'global'"
        :show-exports="true"
      />
    </div>

    <!-- FIBA Rules Note -->
    <div class="card p-5 text-xs text-slate-500 space-y-1.5 flex items-start gap-4">
      <div class="p-2 rounded-lg bg-slate-100 shrink-0">
        <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p class="font-bold text-slate-700 tracking-wide uppercase text-[10px] mb-1">FIBA Tiebreaker Rules Applied</p>
        <p>1. Head-to-Head Result &nbsp;→&nbsp; 2. H2H Point Difference &nbsp;→&nbsp; 3. Overall Point Difference.</p>
        <p class="mt-1">Win = <span class="text-blue-600 font-bold">2 pts</span> &nbsp;|&nbsp; Loss = <span class="text-slate-600 font-bold">1 pt</span> &nbsp;|&nbsp; Forfeit = <span class="text-red-500 font-bold">0 pts</span></p>
      </div>
    </div>
  </div>
</template>
