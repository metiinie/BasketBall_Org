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
    Active:    { cls: 'badge-completed', dot: 'bg-emerald-500' }, // Reusing badge classes from style.css
    Completed: { cls: 'badge-completed', dot: 'bg-blue-500' },
    Pending:   { cls: 'badge-pending',   dot: 'bg-slate-400' },
  }
  return map[status] ?? map.Pending
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-6">

    <!-- Official Header -->
    <div class="card overflow-hidden">
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
              <span class="text-[10px] font-semibold tracking-widest uppercase" style="color: var(--text-muted);">Official Operations</span>
            </div>
            <h1 class="text-xl font-bold leading-tight" style="color: var(--text-heading);">Round Management Console</h1>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">Ethiopian Basketball Federation — Season Control Authority</p>
          </div>
        </div>

        <div class="text-right hidden sm:block">
          <p class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-muted);">Issued</p>
          <p class="text-xs font-semibold mt-0.5" style="color: var(--text-secondary);">{{ today }}</p>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--text-muted);">Total Rounds</p>
        <p class="text-2xl font-bold leading-none" style="color: var(--text-primary);">{{ league.rounds.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--text-muted);">Completed</p>
        <p class="text-2xl font-bold text-blue-500 leading-none">{{ completedRounds }}</p>
      </div>
      <div class="card p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--text-muted);">Matches Logged</p>
        <p class="text-2xl font-bold leading-none" style="color: var(--text-primary);">{{ completedCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color: var(--text-muted);">Pending Score</p>
        <p class="text-2xl font-bold leading-none" :style="scheduledCount > 0 ? 'color: #f59e0b;' : 'color: var(--text-primary);'">{{ scheduledCount }}</p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Left: Active Round Operations -->
      <div class="lg:col-span-8 space-y-4">
        <div v-if="league.activeRound" class="card overflow-hidden">
          <div class="px-6 py-4 flex items-center justify-between" style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border);">
            <div class="flex items-center gap-2.5">
              <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span class="text-xs font-bold uppercase tracking-widest" style="color: var(--text-secondary);">Active — Round {{ league.activeRound.round_number }}</span>
            </div>
            <span class="badge-completed text-[10px] font-bold tracking-widest uppercase px-2.5 py-1">In Progress</span>
          </div>

          <div class="p-6 space-y-6 text-left">
            <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/25">
                <span class="text-2xl font-bold text-white tabular-nums">{{ String(league.activeRound.round_number).padStart(2, '0') }}</span>
              </div>
              <div>
                <p class="text-base font-bold" style="color: var(--text-primary);">Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}</p>
                <p class="text-xs mt-1 leading-relaxed max-w-sm" style="color: var(--text-muted);">
                  Finalising this round commits an official standings snapshot to the archive
                  {{ nextRound ? `and advances to Round ${nextRound.round_number}` : '' }}.
                </p>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border);"></div>

            <div class="space-y-3">
              <div class="flex justify-between items-end">
                <div>
                  <p class="text-xs font-bold" style="color: var(--text-secondary);">Match Completion Status</p>
                  <p class="text-[10px] mt-0.5" style="color: var(--text-muted);">{{ completedCount }} of {{ league.matches.length }} matches recorded</p>
                </div>
                <span class="text-lg font-bold tabular-nums" :style="allCompleted ? 'color: #10b981;' : 'color: var(--text-primary);'">{{ progressPct }}%</span>
              </div>

              <div class="relative h-2.5 rounded-full overflow-hidden" style="background-color: var(--bg-surface);">
                <div :style="`width: ${progressPct}%`" :class="['h-full rounded-full transition-all duration-1000', allCompleted ? 'bg-emerald-500' : 'bg-blue-600']"></div>
              </div>

              <div class="flex gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold" style="background-color: var(--bg-surface); border: 1px solid var(--border); color: #10b981;">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {{ completedCount }} Completed
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold" style="background-color: var(--bg-surface); border: 1px solid var(--border); color: #f59e0b;">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {{ scheduledCount }} Pending
                </span>
              </div>
            </div>

            <div style="border-top: 1px solid var(--border);"></div>

            <!-- Warning -->
            <div v-if="!allCompleted && league.matches.length > 0"
              class="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <svg class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p class="text-xs font-medium leading-relaxed text-amber-500">
                <strong>Advisory:</strong> {{ scheduledCount }} match{{ scheduledCount !== 1 ? 'es' : '' }} have not been scored.
                Early finalisation will exclude these from the official record.
              </p>
            </div>

            <!-- Action Row -->
            <div class="flex items-center justify-between pt-2">
              <p class="text-[10px] leading-relaxed max-w-xs" style="color: var(--text-muted);">
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
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color: var(--bg-surface);">
            <svg class="w-5 h-5" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold" style="color: var(--text-secondary);">No Active Round</p>
            <p class="text-xs mt-1" style="color: var(--text-muted);">No rounds are currently marked as Active.</p>
          </div>
        </div>
      </div>

      <!-- Right: Historical Archive -->
      <div class="lg:col-span-4">
        <div class="card overflow-hidden h-full">
          <div class="px-5 py-4 flex items-center gap-2" style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border);">
            <svg class="w-3.5 h-3.5" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--text-secondary);">Season Archive</p>
          </div>

          <div class="p-4 space-y-1">
            <div v-for="(round, idx) in league.rounds" :key="round.id" class="relative flex items-stretch gap-3">
              <div class="flex flex-col items-center w-6 flex-shrink-0">
                <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0 mt-3 z-10', statusBadge(round.status).dot]"></div>
                <div v-if="idx < league.rounds.length - 1" class="w-px flex-1 mt-1" style="background-color: var(--border);"></div>
              </div>

              <div class="flex-1 p-3 rounded-lg mb-2 border transition-colors bg-opacity-10"
                :class="statusBadge(round.status).cls">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-bold" style="color: var(--text-primary);">Round {{ round.round_number }}</p>
                    <p class="text-[10px] mt-0.5" style="color: var(--text-muted);">Season {{ round.season_year }}</p>
                  </div>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider" :class="statusBadge(round.status).cls">
                    {{ round.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="!league.rounds.length" class="py-8 text-center text-xs" style="color: var(--text-muted);">No rounds available.</div>
          </div>

          <div class="px-5 py-3 border-t" style="background-color: var(--bg-surface); border-color: var(--border);">
            <p class="text-[10px] leading-relaxed" style="color: var(--text-muted);">
              Official records are immutable once committed.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Finalise Round?"
      :message="`This commits the official standings for Round ${league.activeRound?.round_number} to archive. This action is permanent.`"
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
