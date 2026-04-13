<script setup>
import { ref, onMounted } from 'vue'
import MatchCard from '@/components/MatchCard.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import { useLeagueStore } from '@/stores/league.js'

const league = useLeagueStore()
const selectedRound = ref(null)
const filter = ref('All')

onMounted(async () => {
  await league.fetchRounds()
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
  if (selectedRound.value) await league.fetchMatches(selectedRound.value)
})

async function onRoundChange(id) {
  if (!id || id === 'global') return
  selectedRound.value = id
  await league.fetchMatches(id)
}

const filteredMatches = () => {
  if (filter.value === 'All') return league.matches
  if (filter.value === 'Today') {
    const today = new Date().toLocaleDateString()
    return league.matches.filter(m => m.match_date && new Date(m.match_date).toLocaleDateString() === today)
  }
  return league.matches.filter(m => m.status === filter.value)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-black text-primary">Match Schedule</h1>
      <p class="text-muted text-sm mt-1">All fixtures and results for the current round</p>
    </div>

    <RoundSelector
      :model-value="selectedRound"
      @update:model-value="onRoundChange"
      :rounds="league.rounds"
      :show-global="false"
    />

    <!-- Status Filter -->
    <div class="flex flex-wrap gap-2">
      <button v-for="f in ['All', 'Today', 'Scheduled', 'Completed']" :key="f"
        @click="filter = f"
        :class="[
          'px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all',
          filter === f
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
        ]">
        {{ f }}
      </button>
    </div>

    <!-- Match List -->
    <div v-if="league.loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 rounded-2xl bg-tertiary animate-pulse" />
    </div>

    <div v-else-if="filteredMatches().length > 0" class="space-y-3">
      <MatchCard v-for="match in filteredMatches()" :key="match.id" :match="match" />
    </div>

    <div v-else class="card p-10 text-center">
      <p class="text-muted">No matches found for this selection.</p>
    </div>
  </div>
</template>
