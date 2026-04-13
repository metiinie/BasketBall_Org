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
    <div v-if="!league.activeRound && !league.loading" class="card p-10 text-center">
      <p class="text-gray-500">No active round. Please activate a round in Round Manager first.</p>
      <RouterLink to="/admin/rounds" class="btn-primary mt-4 inline-block">Go to Round Manager</RouterLink>
    </div>

    <!-- Loading -->
    <div v-else-if="league.loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-24 rounded-2xl bg-navy-800/60 animate-pulse" />
    </div>

    <!-- Match List -->
    <div v-else class="space-y-3">
      <div v-if="league.matches.length === 0" class="card p-10 text-center">
        <p class="text-gray-500">No matches found for the active round.</p>
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
    <div v-if="league.matches.length > 0" class="card p-4">
      <div class="flex justify-between text-sm text-gray-400 mb-2">
        <span>Round Progress</span>
        <span class="font-semibold text-white">
          {{ league.matches.filter(m => m.status === 'Completed').length }} /
          {{ league.matches.length }} matches completed
        </span>
      </div>
      <div class="h-2 rounded-full bg-navy-700 overflow-hidden">
        <div class="h-full rounded-full bg-gradient-ebf transition-all duration-500"
          :style="`width: ${league.matches.length ? Math.round((league.matches.filter(m => m.status === 'Completed').length / league.matches.length) * 100) : 0}%`" />
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
