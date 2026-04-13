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
const scheduledCount = computed(() => league.matches.filter(m => m.status === 'Scheduled' || m.status === 'Pending').length)
const allCompleted = computed(() => league.matches.length > 0 && completedCount.value === league.matches.length)
const progressPct = computed(() =>
  league.matches.length ? Math.round((completedCount.value / league.matches.length) * 100) : 0
)
const nextRound = computed(() => {
  if (!league.activeRound) return null
  return league.rounds.find(r => r.round_number === league.activeRound.round_number + 1)
})
const completedRounds = computed(() => league.rounds.filter(r => r.status === 'Completed').length)

async function doFinalizeRound() {
  finalizing.value = true
  error.value = ''
  success.value = ''
  try {
    await league.finalizeRound(league.activeRound.id)
    success.value = 'Round finalized. Official standings snapshot committed to archive.'
    showConfirm.value = false
  } catch (e) {
    error.value = e.message || 'Failed to finalize round.'
    showConfirm.value = false
  } finally {
    finalizing.value = false
  }
}

const statusBadge = (status) => {
  const map = {
    Active:    { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Completed: { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',     dot: 'bg-blue-500' },
    Pending:   { bg: 'bg-slate-100 border-slate-200',  text: 'text-slate-500',    dot: 'bg-slate-400' },
  }
  return map[status] ?? map.Pending
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-6">

    <!-- ── Official Header ── -->
    <div class="card overflow-hidden">
      <!-- Blue top accent bar -->
      <div class="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500"></div>

      <div class="px-6 py-5 flex items-start justify-between">
        <div class="flex items-start gap-4">
          <button @click="router.back()" class="btn-icon mt-0.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>

          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold tracking-widest uppercase rounded">EBF</span>
              <span class="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Official Operations</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900 leading-tight">Round Management Console</h1>
            <p class="text-xs text-slate-400 mt-0.5">Ethiopian Basketball Federation — Season Control Authority</p>
          </div>
        </div>

        <!-- Document Date -->
        <div class="text-right hidden sm:block">
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Issued</p>
          <p class="text-xs font-semibold text-slate-700 mt-0.5">{{ today }}</p>
        </div>
      </div>
    </div>

    <!-- ── Summary Stats ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card p-4">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Total Rounds</p>
        <p class="text-2xl font-bold text-slate-900 leading-none">{{ league.rounds.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Completed</p>
        <p class="text-2xl font-bold text-blue-600 leading-none">{{ completedRounds }}</p>
      </div>
      <div class="card p-4">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Matches Logged</p>
        <p class="text-2xl font-bold text-slate-900 leading-none">{{ completedCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pending Score</p>
        <p class="text-2xl font-bold leading-none" :class="scheduledCount > 0 ? 'text-amber-500' : 'text-slate-900'">{{ scheduledCount }}</p>
      </div>
    </div>

    <!-- ── Main Two-Column Grid ── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Left: Active Round Operations (8 cols) -->
      <div class="lg:col-span-8 space-y-4">

        <!-- Active Round Card -->
        <div v-if="league.activeRound" class="card overflow-hidden">
          <!-- Header band -->
          <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span class="text-xs font-bold text-slate-700 uppercase tracking-widest">Active — Round {{ league.activeRound.round_number }}</span>
            </div>
            <span class="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
              In Progress
            </span>
          </div>

          <div class="p-6 space-y-6">

            <!-- Round Identity -->
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/25">
                <span class="text-2xl font-bold text-white tabular-nums">{{ String(league.activeRound.round_number).padStart(2, '0') }}</span>
              </div>
              <div>
                <p class="text-base font-bold text-slate-900">Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}</p>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
                  Finalising this round commits an official standings snapshot to the historical archive
                  {{ nextRound ? `and advances the season to Round ${nextRound.round_number}` : '' }}.
                </p>
              </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-slate-100"></div>

            <!-- Progress -->
            <div class="space-y-3">
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-xs font-bold text-slate-700">Match Completion Status</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">{{ completedCount }} of {{ league.matches.length }} matches recorded</p>
                </div>
                <span class="text-lg font-bold tabular-nums" :class="allCompleted ? 'text-emerald-600' : 'text-slate-700'">{{ progressPct }}%</span>
              </div>

              <!-- Progress track -->
              <div class="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  :style="`width: ${progressPct}%`"
                  :class="['h-full rounded-full transition-all duration-1000', allCompleted ? 'bg-emerald-500' : 'bg-blue-600']"
                ></div>
              </div>

              <!-- Match status pills -->
              <div class="flex gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {{ completedCount }} Completed
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                  {{ scheduledCount }} Pending
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">
                  {{ league.matches.length }} Total
                </span>
              </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-slate-100"></div>

            <!-- Warning -->
            <div v-if="!allCompleted && league.matches.length > 0"
              class="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p class="text-xs text-amber-700 font-medium leading-relaxed">
                <strong>Advisory:</strong> {{ scheduledCount }} match{{ scheduledCount !== 1 ? 'es' : '' }} have not been scored.
                Early finalisation will exclude these from the official record.
              </p>
            </div>

            <!-- Feedback -->
            <Transition name="fade">
              <div v-if="success" class="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-xs text-emerald-700 font-semibold">{{ success }}</p>
              </div>
            </Transition>
            <Transition name="fade">
              <div v-if="error" class="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
                <p class="text-xs text-red-600 font-semibold">{{ error }}</p>
              </div>
            </Transition>

            <!-- Action Row -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100">
              <p class="text-[10px] text-slate-400 leading-relaxed max-w-xs">
                Authorised officers only. This action is permanent and cannot be reversed.
              </p>
              <button
                @click="showConfirm = true"
                :disabled="league.matches.length === 0"
                class="btn-primary px-5 py-2.5 text-sm shadow-sm shadow-blue-600/30 disabled:opacity-40 gap-2"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Finalise Round {{ league.activeRound.round_number }}
              </button>
            </div>
          </div>
        </div>

        <!-- No Active Round State -->
        <div v-else class="card p-10 flex flex-col items-center text-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">No Active Round</p>
            <p class="text-xs text-slate-400 mt-1">No rounds are currently marked as Active. Contact your system administrator to activate a round.</p>
          </div>
        </div>

      </div>

      <!-- Right: Historical Archive (4 cols) -->
      <div class="lg:col-span-4">
        <div class="card overflow-hidden h-full">
          <div class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-xs font-bold text-slate-600 uppercase tracking-widest">Season Archive</p>
          </div>

          <!-- Timeline -->
          <div class="p-4 space-y-1">
            <div
              v-for="(round, idx) in league.rounds"
              :key="round.id"
              class="relative flex items-stretch gap-3"
            >
              <!-- Timeline line -->
              <div class="flex flex-col items-center w-6 flex-shrink-0">
                <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0 mt-3 z-10', statusBadge(round.status).dot]"></div>
                <div v-if="idx < league.rounds.length - 1" class="w-px flex-1 bg-slate-200 mt-1"></div>
              </div>

              <!-- Round Entry -->
              <div
                :class="[
                  'flex-1 p-3 rounded-lg mb-2 border transition-colors',
                  round.status === 'Active'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold text-slate-900">Round {{ round.round_number }}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">Season {{ round.season_year }}</p>
                  </div>
                  <span :class="['text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider', statusBadge(round.status).bg, statusBadge(round.status).text]">
                    {{ round.status }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="!league.rounds.length" class="py-8 text-center">
              <p class="text-xs text-slate-400">No rounds in the database.</p>
            </div>
          </div>

          <!-- Archive Footer -->
          <div class="px-5 py-3 bg-slate-50 border-t border-slate-100">
            <p class="text-[10px] text-slate-400 leading-relaxed">
              Official records are immutable once committed. Contact the federation for amendments.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Confirm Dialog ── -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Finalise Round?"
      :message="`This commits the official standings snapshot for Round ${league.activeRound?.round_number} to the historical archive${nextRound ? ` and activates Round ${nextRound.round_number}` : ''}. This action is permanent.`"
      confirm-label="Confirm & Finalise"
      :danger="false"
      :loading="finalizing"
      @confirm="doFinalizeRound"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
