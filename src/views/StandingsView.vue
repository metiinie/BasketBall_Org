<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSeasonLabel } from '@/utils/dateFormatter.js'
import StandingsTable from '@/components/StandingsTable.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import { useLeagueStore } from '@/stores/league.js'
import { useGlobalStore } from '@/stores/global.js'

const { t } = useI18n()
const league = useLeagueStore()
const global = useGlobalStore()

const selectedRound = ref(null)

async function refreshData() {
  if (!selectedRound.value) return
  
  if (selectedRound.value === 'global') {
    await global.fetchGlobalStandings()
  } else {
    await Promise.all([
      league.fetchTeams(league.selectedGender),
      league.fetchMatches(selectedRound.value),
      league.subscribeToMatches(selectedRound.value),
    ])
  }
}

onMounted(async () => {
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
})

watch(() => league.selectedSeason, async (newSeason) => {
  await league.fetchRounds(newSeason)
  if (league.rounds.length > 0) {
    selectedRound.value = league.rounds[0].id
  } else {
    selectedRound.value = null
  }
})

watch([selectedRound, () => league.selectedGender], () => {
  refreshData()
})

const currentRound = () => league.rounds.find(r => r.id === selectedRound.value)
const roundLabel = () => {
  if (selectedRound.value === 'global') return t('standings.global_season')
  const r = currentRound()
  return r ? t('matches.round', { num: r.round_number }) : ''
}
const seasonYearLabel = () => getSeasonLabel(league.selectedSeason)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

    <!-- Hero Banner -->
    <div class="card p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-blue-600/30">
            <svg viewBox="0 0 32 32" class="w-6 h-6" fill="none" stroke="white" stroke-width="2">
              <circle cx="16" cy="16" r="10"/>
              <path d="M16 6 Q20 11 20 16 Q20 21 16 26"/>
              <path d="M16 6 Q12 11 12 16 Q12 21 16 26"/>
              <line x1="6" y1="16" x2="26" y2="16"/>
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-black tracking-tight leading-none mb-1" style="color: var(--text-heading);">{{ t('standings.ebf_standings') }}</h1>
            <p class="text-xs font-medium capitalize tracking-wide" style="color: var(--text-muted);">{{ t('standings.ebf_full') }}</p>
          </div>
        </div>
        <div v-if="league.activeRound" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-bold tracking-wide text-emerald-500 uppercase tabular-nums">
            {{ t('standings.live_round', { num: league.activeRound.round_number }) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Global NBA-style Filters -->
    <GlobalFilter />

    <!-- Round Selector -->
    <div class="space-y-1.5 pt-2">
      <h3 class="text-xs font-bold uppercase tracking-wider" style="color: var(--text-muted);">{{ t('standings.select_round') }}</h3>
      <RoundSelector
        v-model="selectedRound"
        :rounds="league.rounds"
        :show-global="true"
      />
    </div>

    <!-- Standings Table -->
    <StandingsTable
      :standings="selectedRound === 'global' ? global.globalStandings : league.standings"
      :loading="league.loading || global.loading"
      :round-label="roundLabel()"
      :gender="league.selectedGender"
      :season-year="seasonYearLabel()"
      :is-global="selectedRound === 'global'"
      :show-exports="true"
    />

    <!-- FIBA Rules Note -->
    <div class="card p-4 flex items-start gap-3">
      <div class="p-2 rounded-lg shrink-0" style="background-color: var(--bg-surface);">
        <svg class="w-4 h-4" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div class="text-xs space-y-1" style="color: var(--text-muted);">
        <p class="font-bold uppercase tracking-wider text-[10px] mb-1" style="color: var(--text-secondary);">{{ t('standings.fiba_title') }}</p>
        <p v-html="t('standings.fiba_rule_1')"></p>
        <p v-html="t('standings.fiba_rule_points', { win: 2, loss: 1, forfeit: 0 })"></p>
      </div>
    </div>
  </div>
</template>
