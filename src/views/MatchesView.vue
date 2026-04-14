<script setup>
import { ref, onMounted, computed } from 'vue'
import NBAGameCard from '@/components/NBAGameCard.vue'
import RoundSelector from '@/components/RoundSelector.vue'
import GlobalFilter from '@/components/GlobalFilter.vue'
import { useLeagueStore } from '@/stores/league.js'

const league = useLeagueStore()
const selectedRound = ref(null)
const filter = ref('All')

onMounted(async () => {
  await league.fetchRounds(league.selectedSeason)
  if (league.activeRound) selectedRound.value = league.activeRound.id
  else if (league.rounds.length > 0) selectedRound.value = league.rounds[0].id
  if (selectedRound.value) await league.fetchMatches(selectedRound.value)
})

async function onRoundChange(id) {
  if (!id || id === 'global') return
  selectedRound.value = id
  await league.fetchMatches(id)
}

const matchesByDate = computed(() => {
  const list = filter.value === 'All' ? league.matches : 
               filter.value === 'Today' ? league.matches.filter(m => {
                 const d = new Date(m.match_date).toDateString()
                 return d === new Date().toDateString()
               }) : league.matches.filter(m => m.status === filter.value)

  const groups = {}
  list.forEach(m => {
    const date = new Date(m.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    if (!groups[date]) groups[date] = []
    groups[date].push(m)
  })
  
  // Convert to array and sort by date
  return Object.entries(groups).map(([date, matches]) => ({ date, matches }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-20">
    
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-black tracking-tight" style="color: var(--text-heading);">Match Scoreboard</h1>
        <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--text-muted);">FIBA Standard Timing & Scoring</p>
      </div>
      <div class="w-full md:w-auto">
        <GlobalFilter />
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
      <div class="w-full lg:max-w-xs">
        <RoundSelector
          :model-value="selectedRound"
          @update:model-value="onRoundChange"
          :rounds="league.rounds"
          :show-global="false"
        />
      </div>

      <!-- Status Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in ['All', 'Today', 'Scheduled', 'Completed']"
          :key="f"
          @click="filter = f"
          :class="['px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all',
            filter === f ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : '']"
          :style="filter !== f ? 'color: var(--text-secondary); background-color: var(--bg-card); border-color: var(--border);' : ''"
        >{{ f }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="league.loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 6" :key="i"
        class="h-32 rounded-2xl animate-pulse"
        style="background-color: var(--bg-surface);"/>
    </div>

    <!-- Matches Grouped by Date -->
    <div v-else-if="matchesByDate.length > 0" class="space-y-10">
      <div v-for="group in matchesByDate" :key="group.date" class="space-y-4">
        <!-- Date Header -->
        <h2 class="text-[11px] font-black uppercase tracking-[0.2em] px-1 py-1 border-b" 
            style="color: var(--text-muted); border-color: var(--border);">
          {{ group.date }}
        </h2>
        
        <!-- Game Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <NBAGameCard v-for="match in group.matches" :key="match.id" :match="match"/>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="card p-20 flex flex-col items-center text-center gap-4">
      <div class="w-16 h-16 rounded-3xl bg-slate-500/5 flex items-center justify-center">
        <svg class="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      </div>
      <div>
        <p class="font-bold text-lg" style="color: var(--text-secondary);">No games scheduled</p>
        <p class="text-sm" style="color: var(--text-muted);">Check back later for updates or select a different round.</p>
      </div>
    </div>

  </div>
</template>
