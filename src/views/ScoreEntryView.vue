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
    saveSuccess.value = 'Scores updated in system.'
    selectedMatch.value = null
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (e) {
    saveError.value = e.message || 'Error updating official record.'
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in pb-20">

    <!-- Premium Hero Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2 py-0.5 bg-blue-600 text-[9px] font-black tracking-widest text-white uppercase rounded-sm">ADMIN</span>
          <span class="text-[10px] font-bold tracking-[0.2em] uppercase" style="color: var(--text-muted);">Operation Center</span>
        </div>
        <h1 class="text-4xl font-black tracking-tighter" style="color: var(--text-heading);">Score Control</h1>
        <p class="text-sm font-medium" style="color: var(--text-muted);">
          <template v-if="league.activeRound">
            Official Scoring for Round {{ league.activeRound.round_number }} • Season {{ league.activeRound.season_year }}
          </template>
          <template v-else>No session detected</template>
        </p>
      </div>

      <div class="flex items-center gap-4">
        <RouterLink to="/admin" class="btn-ghost px-5 py-2.5 rounded-xl border flex items-center gap-2 group transition-all"
          style="border-color: var(--border);">
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span class="text-xs font-bold uppercase tracking-widest">Command Deck</span>
        </RouterLink>
      </div>
    </div>

    <!-- Enhanced Progress Section -->
    <div v-if="league.matches.length > 0" 
      class="card p-6 flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-blue-600">
      <div class="flex-shrink-0 relative">
        <!-- SVG Circle Progress -->
        <svg class="w-20 h-20 transform -rotate-90">
          <circle class="text-slate-800" stroke-width="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
          <circle class="text-blue-600 transition-all duration-1000" stroke-width="6" :stroke-dasharray="213" :stroke-dashoffset="213 - (213 * progressPct) / 100" stroke-linecap="round" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
        </svg>
        <span class="absolute inset-0 flex items-center justify-center text-lg font-black tracking-tighter" style="color: var(--text-primary);">
          {{ progressPct }}%
        </span>
      </div>
      <div class="flex-1 space-y-4 text-center md:text-left">
        <div>
          <h3 class="text-sm font-black uppercase tracking-widest" style="color: var(--text-secondary);">Reporting Progress</h3>
          <p class="text-xs mt-1" style="color: var(--text-muted);">{{ completedCount }} matches finalised out of {{ league.matches.length }} scheduled.</p>
        </div>
        <div class="flex gap-3 justify-center md:justify-start">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-500/5" style="border-color: var(--border);">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span class="text-[10px] font-bold uppercase" style="color: var(--text-secondary);">{{ completedCount }} Closed</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-500/5" style="border-color: var(--border);">
            <div class="w-2 h-2 rounded-full bg-amber-500"></div>
            <span class="text-[10px] font-bold uppercase" style="color: var(--text-secondary);">{{ league.matches.length - completedCount }} Open</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Banners -->
    <Transition name="banner">
      <div v-if="saveSuccess" class="flex items-center gap-3 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <p class="text-sm text-emerald-500 font-black tracking-tight uppercase">{{ saveSuccess }}</p>
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="saveError" class="px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-black uppercase tracking-tight">
        {{ saveError }}
      </div>
    </Transition>

    <!-- Main Entry Module -->
    <div class="space-y-4">
      <div class="flex items-center justify-between px-2 mb-2">
        <h2 class="text-xs font-black uppercase tracking-[0.2em]" style="color: var(--text-muted);">Official Fixtures</h2>
        <span class="text-[10px] font-bold" style="color: var(--text-muted);">AUTOMATIC SYSTEM SYNC: ACTIVE</span>
      </div>

      <!-- No Round State -->
      <div v-if="!league.activeRound && !league.loading" 
        class="card p-16 flex flex-col items-center text-center gap-6">
        <div class="w-16 h-16 rounded-3xl flex items-center justify-center bg-blue-600/10">
          <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-black tracking-tight" style="color: var(--text-heading);">Operation Locked</h2>
          <p class="text-sm max-w-xs mt-2" style="color: var(--text-muted);">Active round session required. Please activate a round to proceed with score logging.</p>
        </div>
        <RouterLink to="/admin/rounds" class="btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/30">
          Unlock Session
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-else-if="league.loading" class="space-y-4">
        <div v-for="i in 4" :key="i" class="h-32 rounded-3xl animate-pulse" style="background-color: var(--bg-surface);"/>
      </div>

      <!-- Match List -->
      <div v-else class="space-y-4">
        <div v-if="league.matches.length === 0" class="card p-20 text-center">
          <p class="text-sm font-black uppercase tracking-widest" style="color: var(--text-muted);">Zero fixtures found for this session.</p>
        </div>

        <MatchCard
          v-for="match in league.matches"
          :key="match.id"
          :match="match"
          :show-actions="true"
          class="transition-transform active:scale-[0.99]"
          @edit-score="selectedMatch = $event"
        />
      </div>
    </div>

    <!-- Complex Score Modal -->
    <ScoreInputModal
      :match="selectedMatch"
      @save="handleSaveScore"
      @close="selectedMatch = null"
    />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: scale(0.95) translateY(-10px); }
</style>
