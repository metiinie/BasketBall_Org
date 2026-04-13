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
    saveError.value = e.message || 'Failed to save score.'
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20">

    <!-- Standard Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">Score Management</h1>
        <p class="text-xs mt-0.5" style="color: var(--text-muted);">
          <template v-if="league.activeRound">
            Official Scoring for Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}
          </template>
          <template v-else>No active session</template>
        </p>
      </div>

      <RouterLink to="/admin" class="btn-ghost text-xs px-4 py-2">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Dashboard
      </RouterLink>
    </div>

    <!-- Linear Progress Card (Consistent) -->
    <div v-if="league.matches.length > 0" class="card p-5 flex flex-col gap-3">
      <div class="flex justify-between items-center px-1">
        <span class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">Round Completion</span>
        <span class="text-xs font-bold" style="color: var(--text-secondary);">{{ completedCount }} of {{ league.matches.length }} recorded</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex-1 h-2 rounded-full overflow-hidden" style="background-color: var(--bg-surface);">
          <div
            :style="`width: ${progressPct}%`"
            :class="['h-full rounded-full transition-all duration-700', progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600']"
          ></div>
        </div>
        <span class="text-sm font-bold w-10 text-right" style="color: var(--text-primary);">{{ progressPct }}%</span>
      </div>
    </div>

    <!-- Feedback -->
    <Transition name="banner">
      <div v-if="saveSuccess" class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>
        {{ saveSuccess }}
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="saveError" class="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
        {{ saveError }}
      </div>
    </Transition>

    <!-- Main List -->
    <div class="space-y-4">
      <!-- Empty State -->
      <div v-if="!league.activeRound && !league.loading" class="card p-12 flex flex-col items-center text-center gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-500/5">
          <svg class="w-6 h-6" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold" style="color: var(--text-secondary);">No Active Round</p>
          <p class="text-xs mt-1" style="color: var(--text-muted);">Score entry is locked until a round is activated.</p>
        </div>
        <RouterLink to="/admin/rounds" class="btn-primary text-xs px-6">Go to Round Manager</RouterLink>
      </div>

      <div v-else-if="league.loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-24 rounded-xl animate-pulse" style="background-color: var(--bg-surface);"/>
      </div>

      <div v-else class="space-y-3">
        <div v-if="league.matches.length === 0" class="card p-12 text-center text-xs" style="color: var(--text-muted);">
          No matches found for this session.
        </div>

        <MatchCard
          v-for="match in league.matches"
          :key="match.id"
          :match="match"
          :show-actions="true"
          @edit-score="selectedMatch = $event"
        />
      </div>
    </div>

    <!-- Refined Modal -->
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
