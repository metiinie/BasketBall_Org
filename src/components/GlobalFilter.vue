<script setup>
import { computed } from 'vue'
import { useLeagueStore } from '@/stores/league.js'

const league = useLeagueStore()

const leagues = [
  { id: 'ወንድ', label: "Men's League", icon: '♂' },
  { id: 'ሴት', label: "Women's League", icon: '♀' }
]

const seasons = [
  { id: 2025, label: '2025–26' },
  { id: 2024, label: '2024–25' },
]

const currentSeasonLabel = computed(() => {
  return seasons.find(s => s.id === league.selectedSeason)?.label || league.selectedSeason
})

const currentLeagueLabel = computed(() => {
  return leagues.find(l => l.id === league.selectedGender)?.label || league.selectedGender
})

function handleLeagueChange(id) {
  league.selectedGender = id
}

function handleSeasonChange(id) {
  league.selectedSeason = id
}
</script>

<template>
  <div class="flex items-center gap-6 py-2">
    
    <!-- League Selector -->
    <div class="group relative">
      <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 ml-1">League</p>
      <div class="relative">
        <select 
          :value="league.selectedGender"
          @change="handleLeagueChange($event.target.value)"
          class="appearance-none bg-transparent pr-8 pl-1 py-1 text-sm font-black tracking-tight text-slate-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors focus:outline-none"
        >
          <option v-for="l in leagues" :key="l.id" :value="l.id">{{ l.label }}</option>
        </select>
        <div class="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="w-px h-8 bg-slate-200 dark:bg-slate-700 self-end mb-1"></div>

    <!-- Season Selector -->
    <div class="group relative">
      <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 ml-1">Season</p>
      <div class="relative">
        <select 
          :value="league.selectedSeason"
          @change="handleSeasonChange(parseInt($event.target.value))"
          class="appearance-none bg-transparent pr-8 pl-1 py-1 text-sm font-black tracking-tight text-slate-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors focus:outline-none"
        >
          <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
        <div class="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  text-indent: 1px;
  text-overflow: '';
}
/* Style for dropdown options */
option {
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
}
</style>
