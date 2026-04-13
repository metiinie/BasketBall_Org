<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeagueStore } from '@/stores/league.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
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
const progressPct = computed(() =>
  league.matches.length ? Math.round((completedCount.value / league.matches.length) * 100) : 0
)
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
    success.value = 'Round finalized! Standings snapshot saved successfully.'
    showConfirm.value = false
  } catch (e) {
    error.value = e.message || 'Failed to finalize round.'
    showConfirm.value = false
  } finally {
    finalizing.value = false
  }
}

const statusColor = (status) => {
  if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (status === 'Completed') return 'bg-blue-50 text-blue-700 border border-blue-200'
  return 'bg-slate-100 text-slate-600 border border-slate-200'
}
const statusDot = (status) => {
  if (status === 'Active') return 'bg-emerald-500'
  if (status === 'Completed') return 'bg-blue-500'
  return 'bg-slate-400'
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">

    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="router.back()" class="btn-icon">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">Round Manager</h1>
        <p class="text-xs text-slate-500 mt-0.5">Control active season round finalisation</p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Left: Active Round Operations -->
      <div class="lg:col-span-8 space-y-4">

        <!-- Active Round Card -->
        <div class="card p-6 space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Operations</p>
              <h2 class="text-base font-bold text-slate-900">Round Control Panel</h2>
            </div>
            <span class="px-2.5 py-1 bg-slate-100 text-[10px] text-slate-600 font-semibold tracking-widest rounded-md uppercase">Official</span>
          </div>

          <!-- Active Round Content -->
          <div v-if="league.activeRound" class="space-y-6">

            <!-- Round Info Row -->
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-600/30">
                <span class="text-lg font-bold text-white">{{ league.activeRound.round_number }}</span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Round {{ league.activeRound.round_number }} — Active</h3>
                <p class="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-md">
                  Finalising saves an official standings snapshot and advances the season to
                  {{ nextRound ? `Round ${nextRound.round_number}` : 'the next phase' }}.
                </p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-slate-500">Matches Completed</span>
                <span class="text-xs font-bold" :class="allCompleted ? 'text-emerald-600' : 'text-slate-700'">
                  {{ completedCount }} / {{ league.matches.length }}
                </span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  :style="`width: ${progressPct}%`"
                  :class="['h-full rounded-full transition-all duration-700', allCompleted ? 'bg-emerald-500' : 'bg-blue-500']"
                ></div>
              </div>
              <p class="text-[10px] text-slate-400">{{ progressPct }}% of round matches have been recorded</p>
            </div>

            <!-- Warning -->
            <div v-if="!allCompleted && league.matches.length > 0"
              class="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p class="text-xs text-amber-700 font-medium">
                {{ league.matches.length - completedCount }} match{{ league.matches.length - completedCount !== 1 ? 'es' : '' }} still pending scores.
                Finalising early will exclude them from the historical snapshot.
              </p>
            </div>

            <!-- Success / Error Feedback -->
            <Transition name="fade">
              <div v-if="success" class="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <p class="text-xs text-emerald-700 font-semibold">{{ success }}</p>
              </div>
            </Transition>
            <Transition name="fade">
              <div v-if="error" class="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <p class="text-xs text-red-600 font-semibold">{{ error }}</p>
              </div>
            </Transition>

            <!-- Finalize Action -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100">
              <div class="text-xs text-slate-400">This action cannot be undone.</div>
              <button
                @click="showConfirm = true"
                :disabled="league.matches.length === 0"
                class="btn-primary px-5 py-2.5 shadow-sm shadow-blue-600/30 disabled:opacity-40"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Finalize Round {{ league.activeRound.round_number }}
              </button>
            </div>
          </div>

          <!-- No Active Round Empty State -->
          <div v-else class="py-10 flex flex-col items-center text-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">No Active Round</p>
              <p class="text-xs text-slate-400 mt-0.5">No rounds are currently active. Set a round to Active to begin.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Right: All Rounds Archive -->
      <div class="lg:col-span-4">
        <div class="card p-5 space-y-4 h-full">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <h2 class="text-xs font-bold text-slate-700 uppercase tracking-widest">All Rounds</h2>
          </div>

          <div class="space-y-2">
            <div v-for="round in league.rounds" :key="round.id"
              class="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
              :class="round.status === 'Active' ? 'border-blue-200 bg-blue-50 hover:bg-blue-50' : 'border-slate-200'">

              <div class="w-2 h-2 rounded-full flex-shrink-0" :class="statusDot(round.status)"></div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-slate-900">Round {{ round.round_number }}</p>
                  <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest', statusColor(round.status)]">
                    {{ round.status }}
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 mt-0.5">Season {{ round.season_year }}</p>
              </div>
            </div>

            <div v-if="!league.rounds.length" class="py-8 text-center">
              <p class="text-xs text-slate-400">No rounds found in the database.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Finalize Round?"
      :message="`This will save the official standings snapshot for Round ${league.activeRound?.round_number} and advance the season${nextRound ? ` to Round ${nextRound.round_number}` : ''}. This cannot be undone.`"
      confirm-label="Finalize"
      :danger="false"
      :loading="finalizing"
      @confirm="doFinalizeRound"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
