<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeagueStore } from '@/stores/league.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const league = useLeagueStore()

// State
const showConfirm = ref(false)
const showEditModal = ref(false)
const finalizing = ref(false)
const updating = ref(false)
const error = ref('')
const success = ref('')

// Edit Form State
const editForm = ref({
  start_date: '',
  end_date: ''
})

onMounted(async () => {
  await league.fetchRounds()
  if (league.activeRound) {
    editForm.value.start_date = league.activeRound.start_date?.split('T')[0] || ''
    editForm.value.end_date = league.activeRound.end_date?.split('T')[0] || ''
    await Promise.all([
      league.fetchTeams(),
      league.fetchMatches(league.activeRound.id),
    ])
  }
})

// Insights Calculations
const roundLeaders = computed(() => {
  return league.standings.slice(0, 3)
})

const recentMatches = computed(() => {
  return [...league.matches]
    .filter(m => m.status === 'Completed')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    .slice(0, 2)
})

const upcomingMatches = computed(() => {
  return [...league.matches]
    .filter(m => m.status === 'Scheduled' || m.status === 'Pending')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
    .slice(0, 2)
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
const completedRoundsNum = computed(() => league.rounds.filter(r => r.status === 'Completed').length)

// Actions
async function handleUpdateRound() {
  updating.value = true
  try {
    await league.updateRound(league.activeRound.id, {
      start_date: editForm.value.start_date || null,
      end_date: editForm.value.end_date || null
    })
    success.value = 'Round details updated successfully.'
    showEditModal.value = false
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = e.message || 'Failed to update round.'
  } finally {
    updating.value = false
  }
}

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
    Active:    { cls: 'badge-completed', dot: 'bg-emerald-500' },
    Completed: { cls: 'badge-completed', dot: 'bg-blue-500' },
    Pending:   { cls: 'badge-pending',   dot: 'bg-slate-400' },
  }
  return map[status] ?? map.Pending
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-6 pb-20">

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
              <span class="text-[10px] font-semibold tracking-widest uppercase" style="color: var(--text-muted);">Operation Control</span>
            </div>
            <h1 class="text-2xl font-black tracking-tight" style="color: var(--text-heading);">Round Management</h1>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">Ethiopian Basketball Federation — Authority Dashboard</p>
          </div>
        </div>
        <div class="text-right hidden sm:block">
          <p class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">System Time</p>
          <p class="text-xs font-bold mt-1" style="color: var(--text-secondary);">{{ today }}</p>
        </div>
      </div>
    </div>

    <!-- Feedback Banners -->
    <Transition name="fade">
      <div v-if="success" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>
        {{ success }}
      </div>
    </Transition>

    <!-- Round Stats Overview -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card p-5 relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 w-12 h-12 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform"></div>
        <p class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">Total Rounds</p>
        <p class="text-3xl font-black tracking-tighter" style="color: var(--text-primary);">{{ league.rounds.length }}</p>
      </div>
      <div class="card p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">Completed</p>
        <p class="text-3xl font-black tracking-tighter text-blue-500">{{ completedRoundsNum }}</p>
      </div>
      <div class="card p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">Reports Logged</p>
        <p class="text-3xl font-black tracking-tighter" style="color: var(--text-primary);">{{ completedCount }}</p>
      </div>
      <div class="card p-5">
        <p class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">Pending Entry</p>
        <p class="text-3xl font-black tracking-tighter" :style="scheduledCount > 0 ? 'color: #f59e0b;' : 'color: var(--text-primary);'">{{ scheduledCount }}</p>
      </div>
    </div>

    <!-- Active Round Master Dashboard -->
    <div v-if="league.activeRound" class="card overflow-hidden border-2 border-blue-600/20">
      <!-- Header Row -->
      <div class="px-6 py-4 flex items-center justify-between border-b bg-gradient-to-r from-blue-600/5 to-transparent" style="border-color: var(--border);">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></div>
          <span class="text-xs font-black uppercase tracking-[0.2em]" style="color: var(--text-primary);">Active Operational Round</span>
        </div>
        <button @click="showEditModal = true" class="btn-ghost btn-sm gap-2 px-4 border shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Configure Details
        </button>
      </div>

      <div class="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <!-- Column 1: Round Context & Timeline -->
        <div class="lg:col-span-4 space-y-8">
          <div class="flex items-center gap-5">
            <div class="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-blue-600/30">
              <span class="text-3xl font-black text-white tabular-nums">{{ String(league.activeRound.round_number).padStart(2, '0') }}</span>
            </div>
            <div>
              <h2 class="text-2xl font-black tracking-tighter" style="color: var(--text-heading);">Round {{ league.activeRound.round_number }}</h2>
              <p class="text-xs font-bold uppercase tracking-widest mt-1" style="color: var(--text-muted);">Season {{ league.activeRound.season_year }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">Official Timeline</h4>
            <div class="p-5 rounded-2xl border bg-slate-500/5 space-y-4" style="border-color: var(--border);">
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600/10 text-blue-500 border border-blue-500/20">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p class="text-[9px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">Commenced</p>
                  <p class="text-sm font-bold" style="color: var(--text-primary);">{{ formatDate(league.activeRound.start_date) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-600/10 text-emerald-500 border border-emerald-500/20">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <p class="text-[9px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">Target Closure</p>
                  <p class="text-sm font-bold" style="color: var(--text-primary);">{{ formatDate(league.activeRound.end_date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: Round Leaders (Real Data) -->
        <div class="lg:col-span-4 space-y-6">
          <h4 class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">Round Leaders (Top 3)</h4>
          <div class="space-y-3">
            <div v-for="(s, idx) in roundLeaders" :key="s.team.id" 
              class="flex items-center gap-4 p-4 rounded-3xl border transition-all hover:border-blue-500/30"
              style="background-color: var(--bg-surface); border-color: var(--border);">
              <div class="relative">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm overflow-hidden">
                  <img v-if="s.team.logo_url" :src="s.team.logo_url" class="w-full h-full object-cover"/>
                  <span v-else class="text-lg font-black text-slate-300">{{ s.team.initial }}</span>
                </div>
                <div class="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                  :class="idx === 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-700 text-slate-200'">
                  #{{ s.rank }}
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm font-black truncate" style="color: var(--text-primary);">{{ s.team.name }}</p>
                <div class="flex items-center gap-3 mt-0.5">
                  <span class="text-[10px] font-bold" style="color: var(--text-muted);">Record: <span class="text-blue-500">{{ s.wins }}W</span> - {{ s.losses }}L</span>
                  <span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-500 uppercase">{{ s.leaguePts }} PTS</span>
                </div>
              </div>
            </div>
            <div v-if="!roundLeaders.length" class="text-xs font-medium py-10 text-center italic" style="color: var(--text-muted);">Calculating initial performance...</div>
          </div>
        </div>

        <!-- Column 3: Recent Activity -->
        <div class="lg:col-span-4 space-y-6">
          <h4 class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">Live Action Feed</h4>
          
          <div class="space-y-6">
            <!-- Latest Result -->
            <div class="space-y-3">
              <p class="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2" style="color: var(--text-muted);">
                <span class="w-1 h-1 rounded-full bg-emerald-500"></span> Last Completed
              </p>
              <div v-for="m in recentMatches" :key="m.id" class="p-4 rounded-2xl border" style="border-color: var(--border);">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-xs font-bold truncate flex-1" style="color: var(--text-primary);">{{ m.home_team.name }}</span>
                  <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-900/50 text-xs font-black tabular-nums border border-slate-700/50">
                    <span :class="m.home_score > m.away_score ? 'text-blue-500' : ''">{{ m.home_score }}</span>
                    <span class="opacity-30">:</span>
                    <span :class="m.away_score > m.home_score ? 'text-blue-500' : ''">{{ m.away_score }}</span>
                  </div>
                  <span class="text-xs font-bold truncate flex-1 text-right" style="color: var(--text-primary);">{{ m.away_team.name }}</span>
                </div>
              </div>
              <p v-if="!recentMatches.length" class="text-[10px] italic py-4" style="color: var(--text-muted);">Waiting for first result...</p>
            </div>

            <!-- Up Next -->
            <div class="space-y-3">
              <p class="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2" style="color: var(--text-muted);">
                <span class="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span> Next Schedule
              </p>
              <div v-for="m in upcomingMatches" :key="m.id" class="p-4 rounded-2xl border border-dashed" style="border-color: var(--border);">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-xs font-bold truncate flex-1" style="color: var(--text-secondary);">{{ m.home_team.name }}</span>
                  <span class="text-[9px] font-black text-slate-500 uppercase italic">VS</span>
                  <span class="text-xs font-bold truncate flex-1 text-right" style="color: var(--text-secondary);">{{ m.away_team.name }}</span>
                </div>
                <p class="text-[9px] font-bold text-center mt-3 text-blue-500 uppercase tracking-widest">{{ formatDate(m.match_date) }}</p>
              </div>
              <p v-if="!upcomingMatches.length" class="text-[10px] italic py-4" style="color: var(--text-muted);">Round fixtures cleared.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer: Operations & Finalise -->
      <div class="px-8 py-6 border-t bg-slate-500/5" style="border-color: var(--border);">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex-1 w-full max-w-lg space-y-3">
            <div class="flex justify-between items-center px-1">
              <p class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">Completion Authority Gauge</p>
              <span class="text-sm font-black tracking-tighter" :style="allCompleted ? 'color: #10b981;' : 'color: var(--text-primary);'">{{ progressPct }}%</span>
            </div>
            <div class="relative h-2 rounded-full overflow-hidden" style="background-color: var(--bg-surface);">
              <div :style="`width: ${progressPct}%`" :class="['h-full transition-all duration-1000', allCompleted ? 'bg-emerald-500' : 'bg-blue-600']"></div>
            </div>
            <div v-if="!allCompleted" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p class="text-[10px] font-bold leading-tight">Proceeding with early finalisation will omit {{ scheduledCount }} unscored fixtures.</p>
            </div>
          </div>

          <div class="flex-shrink-0">
             <button
              @click="showConfirm = true"
              :disabled="league.matches.length === 0"
              class="btn-primary w-full md:w-auto px-8 py-3.5 rounded-2xl text-xs font-black tracking-[0.2em] shadow-xl shadow-blue-600/30 disabled:opacity-40"
            >
              FINALISE ROUND {{ league.activeRound.round_number }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Archive Visualization -->
    <div class="card overflow-hidden">
      <div class="px-6 py-4 flex items-center gap-2 bg-slate-500/5 border-b" style="border-color: var(--border);">
        <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        <p class="text-xs font-black uppercase tracking-[0.2em]" style="color: var(--text-secondary);">Historical Season Archive</p>
      </div>

      <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="(round, idx) in league.rounds" :key="round.id" 
          class="p-4 rounded-2xl border flex items-center gap-4 transition-all hover:shadow-md h-full"
          :class="statusBadge(round.status).cls">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
            <span class="text-lg font-black text-slate-800 tabular-nums">{{ round.round_number }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black tracking-tighter" style="color: var(--text-primary);">Round {{ round.round_number }}</span>
              <span class="text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded-full" :class="statusBadge(round.status).cls">
                {{ round.status }}
              </span>
            </div>
            <p class="text-[9px] font-bold mt-1" style="color: var(--text-muted);">
              {{ round.status === 'Completed' ? 'Snapshot Committed' : 'Operational Window TBA' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Details Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" style="background-color: rgba(15,23,42,0.8);">
        <div class="card w-full max-w-md animate-slide-up">
          <div class="px-6 py-4 flex items-center justify-between border-b" style="border-color: var(--border);">
            <div>
              <h2 class="text-base font-bold" style="color: var(--text-heading);">Configure Round Details</h2>
              <p class="text-[10px] font-bold mt-0.5 text-blue-500 uppercase tracking-widest">Active Round {{ league.activeRound.round_number }}</p>
            </div>
            <button @click="showEditModal = false" class="btn-icon">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">Start Date</label>
                <input v-model="editForm.start_date" type="date" class="input-field py-3"/>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">End Date</label>
                <input v-model="editForm.end_date" type="date" class="input-field py-3"/>
              </div>
            </div>
            <p class="text-[10px] text-center" style="color: var(--text-muted);">These dates will be displayed on the official round dashboard.</p>
            <button @click="handleUpdateRound" :disabled="updating" class="btn-primary w-full py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 font-black tracking-widest uppercase text-xs">
              {{ updating ? 'Syncing...' : 'Update Details' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="showConfirm"
      title="Finalise Operational Round?"
      :message="`Proceeding commits the official standings for Round ${league.activeRound?.round_number} to archive. This action is definitive and permanent.`"
      confirm-label="EXECUTE FINALISATION"
      :danger="false"
      :loading="finalizing"
      @confirm="doFinalizeRound"
      @cancel="showConfirm = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
