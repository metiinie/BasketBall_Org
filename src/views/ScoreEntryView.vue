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
        <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Score Entry</p>
        <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">Enter Match Scores</h1>
        <p class="text-xs mt-0.5" style="color: var(--text-muted);">
          <template v-if="league.activeRound">
            Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}
          </template>
          <template v-else>No active round</template>
        </p>
      </div>
      <RouterLink to="/admin" class="btn-ghost text-xs gap-1.5 px-4 py-2">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Dashboard
      </RouterLink>
    </div>

    <!-- Progress Card -->
    <div v-if="league.matches.length > 0" class="card p-5 flex items-center gap-5">
      <div class="flex-1">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--text-muted);">Round Progress</span>
          <span class="text-xs font-bold" style="color: var(--text-secondary);">{{ completedCount }} / {{ league.matches.length }}</span>
        </div>
        <div class="h-2 rounded-full overflow-hidden" style="background-color: var(--bg-surface);">
          <div
            :style="`width: ${progressPct}%`"
            :class="['h-full rounded-full transition-all duration-700', progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600']"
          ></div>
        </div>
      </div>
      <span class="text-lg font-bold tabular-nums" :style="progressPct === 100 ? 'color: #10b981;' : 'color: #3b82f6;'">
        {{ progressPct }}%
      </span>
    </div>

    <!-- Feedback Banners -->
    <Transition name="banner">
      <div v-if="saveSuccess" class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>
        <p class="text-xs text-emerald-500 font-bold">{{ saveSuccess }}</p>
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="saveError" class="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
        {{ saveError }}
      </div>
    </Transition>

    <!-- Empty/No Round States -->
    <div v-if="!league.activeRound && !league.loading" class="card p-12 flex flex-col items-center text-center gap-5">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color: var(--bg-surface);">
        <svg class="w-6 h-6" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <div>
        <p class="text-sm font-bold" style="color: var(--text-secondary);">No Active Round</p>
        <p class="text-xs mt-1" style="color: var(--text-muted);">Activate a round to begin entering scores.</p>
      </div>
      <RouterLink to="/admin/rounds" class="btn-primary text-xs px-6 py-2.5">
        Go to Round Manager
      </RouterLink>
    </div>

    <div v-else-if="league.loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-20 rounded-xl animate-pulse" style="background-color: var(--bg-surface);"/>
    </div>

    <div v-else class="space-y-3">
      <div v-if="league.matches.length === 0" class="card p-12 text-center">
        <p class="text-sm font-medium" style="color: var(--text-muted);">No matches scheduled for this round.</p>
      </div>

      <MatchCard
        v-for="match in league.matches"
        :key="match.id"
        :match="match"
        :show-actions="true"
        @edit-score="selectedMatch = $event"
      />
    </div>

    <ScoreInputModal
      :match="selectedMatch"
      @save="handleSaveScore"
      @close="selectedMatch = null"
    />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active { transition: all 0.2s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
