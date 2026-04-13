<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import MatchCard from '@/components/MatchCard.vue'
import ScoreInputModal from '@/components/ScoreInputModal.vue'
import { useLeagueStore } from '@/stores/league.js'

const league = useLeagueStore()
const selectedMatch = ref(null)
const saveError = ref('')
const saveSuccess = ref('')

onMounted(async () => {
  await league.fetchRounds()
  if (league.activeRound) {
    await league.fetchTeams()
    await league.fetchMatches(league.activeRound.id)
    league.subscribeToMatches(league.activeRound.id)
  }
})

onUnmounted(() => league.unsubscribeFromMatches())

const completedCount = computed(() => league.matches.filter(m => m.status === 'Completed').length)
const progressPct = computed(() =>
  league.matches.length ? Math.round((completedCount.value / league.matches.length) * 100) : 0
)

async function handleSaveScore({ matchId, homeScore, awayScore }) {
  saveError.value = ''
  saveSuccess.value = ''
  try {
    await league.updateMatchScore(matchId, homeScore, awayScore)
    saveSuccess.value = 'Score saved successfully.'
    selectedMatch.value = null
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (e) {
    saveError.value = e.message || 'Failed to save score. Please try again.'
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Score Entry</p>
        <h1 class="text-xl font-bold text-slate-900">Enter Match Scores</h1>
        <p class="text-xs text-slate-400 mt-0.5">
          <template v-if="league.activeRound">
            Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}
          </template>
          <template v-else>No active round</template>
        </p>
      </div>
      <RouterLink to="/admin" class="btn-ghost text-xs gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Dashboard
      </RouterLink>
    </div>

    <!-- Progress Bar (shown when matches exist) -->
    <div v-if="league.matches.length > 0" class="card p-4 flex items-center gap-4">
      <div class="flex-1">
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-xs font-semibold text-slate-500">Round Progress</span>
          <span class="text-xs font-bold text-slate-900">{{ completedCount }} / {{ league.matches.length }}</span>
        </div>
        <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            :style="`width: ${progressPct}%`"
            :class="['h-full rounded-full transition-all duration-700', progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600']"
          ></div>
        </div>
      </div>
      <span class="text-lg font-bold tabular-nums" :class="progressPct === 100 ? 'text-emerald-600' : 'text-blue-600'">
        {{ progressPct }}%
      </span>
    </div>

    <!-- Success / Error Banners -->
    <Transition name="banner">
      <div v-if="saveSuccess" class="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <p class="text-xs text-emerald-700 font-semibold">{{ saveSuccess }}</p>
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="saveError" class="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
        <p class="text-xs text-red-600 font-semibold">{{ saveError }}</p>
      </div>
    </Transition>

    <!-- No Active Round -->
    <div v-if="!league.activeRound && !league.loading" class="card p-10 flex flex-col items-center text-center gap-4">
      <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
        <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-slate-700">No Active Round</p>
        <p class="text-xs text-slate-400 mt-1">Activate a round in Round Manager to begin entering scores.</p>
      </div>
      <RouterLink to="/admin/rounds" class="btn-primary text-xs px-4 py-2 shadow-sm shadow-blue-600/20">
        Go to Round Manager
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-else-if="league.loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-20 rounded-xl bg-slate-100 animate-pulse"/>
    </div>

    <!-- Match List -->
    <div v-else class="space-y-3">
      <div v-if="league.matches.length === 0" class="card p-10 text-center">
        <p class="text-sm text-slate-500 font-medium">No matches found for this round.</p>
      </div>

      <MatchCard
        v-for="match in league.matches"
        :key="match.id"
        :match="match"
        :show-actions="true"
        @edit-score="selectedMatch = $event"
      />
    </div>

    <!-- Score Modal -->
    <ScoreInputModal
      :match="selectedMatch"
      @save="handleSaveScore"
      @close="selectedMatch = null"
    />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active { transition: all 0.25s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
