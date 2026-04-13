<script setup>
import { ref, watch, onMounted } from 'vue'
import StandingsTable from '@/components/StandingsTable.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import { useLeagueStore } from '@/stores/league.js'
import { useGlobalStore } from '@/stores/global.js'

const league = useLeagueStore()
const global = useGlobalStore()

const selectedRound = ref(null)
const selectedGender = ref('Male')

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
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 border border-navy-700/60 p-6">
      <div class="absolute inset-0 bg-gradient-to-r from-ebf-orange/10 to-transparent pointer-events-none" />
      <div class="absolute -right-8 -top-8 w-40 h-40 bg-ebf-orange/5 rounded-full blur-2xl" />
      <div class="relative">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-ebf flex items-center justify-center shadow-lg shadow-ebf-orange/30">
            <svg viewBox="0 0 32 32" class="w-5 h-5" fill="none" stroke="white" stroke-width="2">
              <circle cx="16" cy="16" r="10"/>
              <path d="M16 6 Q20 11 20 16 Q20 21 16 26"/>
              <path d="M16 6 Q12 11 12 16 Q12 21 16 26"/>
              <line x1="6" y1="16" x2="26" y2="16"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-black text-white leading-none">EBF League Standings</h1>
            <p class="text-xs text-gray-500 leading-none mt-0.5">Ethiopian Basketball Federation</p>
          </div>
        </div>
        <!-- Live indicator -->
        <div v-if="league.activeRound" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          <span class="text-[11px] font-semibold text-green-400">Live — Round {{ league.activeRound.round_number }}</span>
        </div>
      </div>
    </div>

    <!-- Gender Filter -->
    <div class="flex gap-2">
      <button v-for="g in ['Male', 'Female']" :key="g"
        @click="selectedGender = g"
        :class="[
          'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200',
          selectedGender === g
            ? 'bg-ebf-orange text-white border-ebf-orange shadow-lg shadow-ebf-orange/25'
            : 'bg-navy-800/60 text-gray-400 border-navy-600 hover:border-ebf-orange/40 hover:text-white'
        ]">
        <span>{{ g === 'Male' ? '♂' : '♀' }}</span> {{ g }}
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
    <div class="card p-4 text-xs text-gray-600 space-y-1">
      <p class="font-semibold text-gray-500">FIBA Tiebreaker Rules:</p>
      <p>1. Head-to-Head result → 2. H2H Point Difference → 3. Overall Point Difference</p>
      <p>Win = 2pts · Loss = 1pt · Forfeit = 0pts</p>
    </div>
  </div>
</template>
