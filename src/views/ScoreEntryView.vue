<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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

async function handleSaveScore({ matchId, homeScore, awayScore }) {
  saveError.value = ''
  saveSuccess.value = ''
  try {
    await league.updateMatchScore(matchId, homeScore, awayScore)
    saveSuccess.value = 'Score saved successfully!'
    selectedMatch.value = null
    setTimeout(() => { saveSuccess.value = '' }, 3000)
  } catch (e) {
    saveError.value = e.message || 'Failed to save score. Please try again.'
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Score Entry</h1>
        <p class="text-gray-500 text-sm mt-1">
          <template v-if="league.activeRound">
            Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}
          </template>
          <template v-else>No active round</template>
        </p>
      </div>
      <RouterLink to="/admin" class="btn-ghost text-sm py-2 px-3">← Back</RouterLink>
    </div>

    <!-- Success / Error Banners -->
    <Transition name="banner">
      <div v-if="saveSuccess" class="px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-medium flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {{ saveSuccess }}
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="saveError" class="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium">
        {{ saveError }}
      </div>
    </Transition>

    <!-- No Active Round -->
    <div v-if="!league.activeRound && !league.loading" class="glass-panel p-12 text-center rounded-3xl">
      <div class="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="text-gray-400 font-medium tracking-wide">No active round. Please activate a round in <br class="hidden sm:block"/>Round Manager first.</p>
      <RouterLink to="/admin/rounds" class="btn-primary mt-6 inline-block shadow-ebf-orange/30">Go to Round Manager</RouterLink>
    </div>

    <!-- Loading -->
    <div v-else-if="league.loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-24 rounded-2xl bg-navy-800/60 animate-pulse" />
    </div>

    <!-- Match List -->
    <div v-else class="space-y-4">
      <div v-if="league.matches.length === 0" class="glass-panel p-12 text-center rounded-3xl">
        <p class="text-gray-400 font-medium tracking-wide">No matches found for the active round.</p>
      </div>

      <MatchCard
        v-for="match in league.matches"
        :key="match.id"
        :match="match"
        :show-actions="true"
        @edit-score="selectedMatch = $event"
      />
    </div>

    <!-- Progress Summary -->
    <div v-if="league.matches.length > 0" class="glass-panel p-6 rounded-3xl backdrop-blur-xl border border-white/10 mt-8">
      <div class="flex justify-between items-end text-sm text-gray-400 mb-3">
        <span class="font-bold tracking-wider uppercase text-[11px]">Round Progress</span>
        <span class="font-black text-white text-lg leading-none">
          {{ league.matches.filter(m => m.status === 'Completed').length }} <span class="text-gray-500 text-sm">/ {{ league.matches.length }}</span>
        </span>
      </div>
      <div class="h-3 rounded-full bg-navy-950 overflow-hidden border border-white/5 shadow-inner">
        <div class="h-full rounded-full bg-gradient-ebf transition-all duration-1000 ease-out relative overflow-hidden"
          :style="`width: ${league.matches.length ? Math.round((league.matches.filter(m => m.status === 'Completed').length / league.matches.length) * 100) : 0}%`">
            <div class="absolute inset-0 bg-white/20 -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>

    <!-- Score Input Modal -->
    <ScoreInputModal
      :match="selectedMatch"
      @save="handleSaveScore"
      @close="selectedMatch = null"
    />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
