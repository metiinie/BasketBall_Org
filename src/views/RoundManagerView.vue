<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLeagueStore } from '@/stores/league.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const league = useLeagueStore()
const showConfirm = ref(false)
const finalizing = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  await league.fetchRounds()
  if (league.activeRound) {
    await Promise.all([
      league.fetchTeams(),
      league.fetchMatches(league.activeRound.id),
    ])
  }
})

const completedCount = computed(() => league.matches.filter(m => m.status === 'Completed').length)
const allCompleted = computed(() => league.matches.length > 0 && completedCount.value === league.matches.length)
const nextRound = computed(() => {
  if (!league.activeRound) return null
  return league.rounds.find(r => r.round_number === league.activeRound.round_number + 1)
})

async function doFinalizeRound() {
  finalizing.value = true
  error.value = ''
  success.value = ''
  try {
    await league.finalizeRound(league.activeRound.id)
    success.value = `Round finalized! The standings snapshot has been saved.`
    showConfirm.value = false
  } catch (e) {
    error.value = e.message || 'Failed to finalize round.'
    showConfirm.value = false
  } finally {
    finalizing.value = false
  }
}

function statusColor(s) {
  return s === 'Active' ? 'badge-win' : s === 'Completed' ? 'badge-completed' : 'badge-pending'
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Round Manager</h1>
        <p class="text-gray-500 text-sm mt-1">Close rounds and advance the season</p>
      </div>
      <RouterLink to="/admin" class="btn-ghost text-sm py-2 px-3">← Back</RouterLink>
    </div>

    <!-- Success / Error -->
    <Transition name="fade">
      <div v-if="success" class="px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm">
        {{ success }}
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="error" class="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
        {{ error }}
      </div>
    </Transition>

    <!-- Rounds Overview -->
    <div class="space-y-3">
      <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider">All Rounds</h2>
      <div class="space-y-2">
        <div v-for="round in league.rounds" :key="round.id"
          :class="['card px-5 py-4 flex items-center justify-between', round.status === 'Active' ? 'border-ebf-orange/40' : '']">
          <div class="flex items-center gap-3">
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black',
              round.status === 'Active' ? 'bg-ebf-orange text-white' :
              round.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-navy-700 text-gray-500']">
              {{ round.round_number }}
            </div>
            <div>
              <p class="font-semibold text-white text-sm">Round {{ round.round_number }}</p>
              <p class="text-xs text-gray-500">Season {{ round.season_year }}</p>
            </div>
          </div>
          <span :class="statusColor(round.status)">{{ round.status }}</span>
        </div>
      </div>
    </div>

    <!-- Active Round Finalization Panel -->
    <div v-if="league.activeRound" class="card p-6 border-ebf-orange/20 space-y-5">
      <div class="flex items-start gap-4">
        <div class="w-11 h-11 rounded-xl bg-ebf-orange/15 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-ebf-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-white">Finalize Round {{ league.activeRound.round_number }}</h3>
          <p class="text-sm text-gray-500 mt-1">
            Closing a round saves the standings as an official snapshot, marks the round as
            Completed, and activates Round {{ (league.activeRound.round_number + 1) || '—' }}.
          </p>
        </div>
      </div>

      <!-- Progress -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">Matches completed</span>
          <span :class="allCompleted ? 'text-green-400' : 'text-yellow-400'" class="font-bold">
            {{ completedCount }} / {{ league.matches.length }}
          </span>
        </div>
        <div class="h-2.5 rounded-full bg-navy-700 overflow-hidden">
          <div :class="['h-full rounded-full transition-all duration-500', allCompleted ? 'bg-green-500' : 'bg-gradient-ebf']"
            :style="`width: ${league.matches.length ? Math.round((completedCount / league.matches.length) * 100) : 0}%`" />
        </div>
      </div>

      <!-- Warning if not all done -->
      <div v-if="!allCompleted" class="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <svg class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-yellow-400 text-sm">
          {{ league.matches.length - completedCount }} match(es) still pending. You can finalize early, but pending matches will not be counted.
        </p>
      </div>

      <!-- Finalize Button -->
      <button
        @click="showConfirm = true"
        :disabled="league.matches.length === 0"
        class="btn-primary w-full py-3 text-base"
      >
        🏁 Finalize Round {{ league.activeRound.round_number }}
      </button>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Finalize Round?"
      :message="`This will freeze the current standings for Round ${league.activeRound?.round_number} and activate Round ${(league.activeRound?.round_number || 0) + 1}. This action cannot be undone.`"
      confirm-label="Yes, Finalize"
      :danger="false"
      :loading="finalizing"
      @confirm="doFinalizeRound"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
