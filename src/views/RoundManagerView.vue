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
const editForm = ref({ start_date: '', end_date: '' })

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

// Compact Insights
const roundLeaders = computed(() => league.standings.slice(0, 3))

const recentMatch = computed(() => {
  return [...league.matches]
    .filter(m => m.status === 'Completed')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))[0]
})

const upcomingMatch = computed(() => {
  return [...league.matches]
    .filter(m => m.status === 'Scheduled' || m.status === 'Pending')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))[0]
})

const completedCount = computed(() => league.matches.filter(m => m.status === 'Completed').length)
const scheduledCount = computed(() => league.matches.filter(m => m.status === 'Scheduled' || m.status === 'Pending').length)
const allCompleted = computed(() => league.matches.length > 0 && completedCount.value === league.matches.length)
const progressPct = computed(() =>
  league.matches.length ? Math.round((completedCount.value / league.matches.length) * 100) : 0
)

async function handleUpdateRound() {
  updating.value = true
  try {
    await league.updateRound(league.activeRound.id, {
      start_date: editForm.value.start_date || null,
      end_date: editForm.value.end_date || null
    })
    success.value = 'Rounds updated.'
    showEditModal.value = false
    setTimeout(() => { success.value = '' }, 2000)
  } catch (e) {
    error.value = e.message || 'Error.'
  } finally {
    updating.value = false
  }
}

async function doFinalizeRound() {
  finalizing.value = true
  try {
    await league.finalizeRound(league.activeRound.id)
    success.value = 'Round archived.'
    showConfirm.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    finalizing.value = false
  }
}

const statusBadge = (s) => {
  const map = {
    Active:    { dot: 'bg-emerald-500', text: 'Active' },
    Completed: { dot: 'bg-blue-500',    text: 'History' },
    Pending:   { dot: 'bg-slate-500',   text: 'Draft' },
  }
  return map[s] || map.Pending
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'TBA'

const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-20">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <button @click="router.back()" class="btn-icon">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <div>
          <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">Round Manager</h1>
          <p class="text-xs mt-0.5" style="color: var(--text-muted);">Operation Control Authority Center</p>
        </div>
      </div>
      <div class="hidden sm:block text-right">
        <p class="text-[13px] font-bold uppercase tracking-widest text-slate-500">{{ today }}</p>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT: Active Round (Compact Master) -->
      <div class="lg:col-span-8 space-y-4">
        <div v-if="league.activeRound" class="card overflow-hidden">
          <!-- Row 1: Status & Config -->
          <div class="px-5 py-4 border-b flex items-center justify-between bg-slate-500/5" style="border-color: var(--border);">
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-xs font-bold uppercase tracking-[0.15em]" style="color: var(--text-primary);">Operational Round {{ league.activeRound.round_number }}</span>
            </div>
            <button @click="showEditModal = true" class="text-xs font-bold uppercase text-blue-500 hover:text-blue-400">Configure Dates</button>
          </div>

          <!-- Row 2: Insights Grid -->
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Round Leaders (Mini) -->
            <div class="space-y-5">
              <h4 class="text-[11px] font-black uppercase tracking-widest opacity-60">Round Leaders</h4>
              <div class="space-y-2">
                <div v-for="s in roundLeaders" :key="s.team.id" class="flex items-center gap-3 p-2 rounded-xl border bg-slate-500/5" style="border-color: var(--border);">
                  <div class="w-8 h-8 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    <img v-if="s.team.logo_url" :src="s.team.logo_url" class="w-full h-full object-cover"/>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold truncate">{{ s.team.name }}</p>
                    <p class="text-[11px] font-bold text-blue-500 uppercase tracking-tighter">{{ s.wins }}W - {{ s.losses }}L</p>
                  </div>
                  <span class="text-[11px] font-black tabular-nums opacity-60">#{{ s.rank }}</span>
                </div>
              </div>
            </div>

            <!-- Temporal & Action Feed -->
            <div class="space-y-6">
              <!-- Dates Card -->
              <div class="p-4 rounded-xl border border-dashed flex items-center gap-8" style="border-color: var(--border);">
                <div class="flex-1">
                  <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">Start</p>
                  <p class="text-xs font-bold">{{ formatDate(league.activeRound.start_date) }}</p>
                </div>
                <div class="w-px h-8 bg-slate-700/50"></div>
                <div class="flex-1">
                  <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">End</p>
                  <p class="text-xs font-bold">{{ formatDate(league.activeRound.end_date) }}</p>
                </div>
              </div>

              <!-- Activity Feed (Compact) -->
              <div class="space-y-4">
                <div v-if="recentMatch" class="flex items-center gap-4">
                  <span class="w-2 h-2 rounded-full bg-blue-500/50"></span>
                  <p class="text-[12px] font-bold truncate flex-1 opacity-80">{{ recentMatch.home_team.name }} {{ recentMatch.home_score }}:{{ recentMatch.away_score }} {{ recentMatch.away_team.name }}</p>
                </div>
                <div v-if="upcomingMatch" class="flex items-center gap-4">
                  <span class="w-2 h-2 rounded-full bg-amber-500/50"></span>
                  <p class="text-[12px] font-bold truncate flex-1 opacity-80 italic">Next: {{ upcomingMatch.home_team.name }} vs {{ upcomingMatch.away_team.name }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 3: Progress & Finalise -->
          <div class="px-5 py-5 border-t bg-slate-500/5" style="border-color: var(--border);">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div class="flex-1 w-full space-y-3">
                <div class="flex justify-between text-[11px] font-bold uppercase tracking-widest opacity-70">
                  <span>Report Sync Status</span>
                  <span>{{ progressPct }}%</span>
                </div>
                <div class="h-2 rounded-full overflow-hidden bg-slate-900/40">
                  <div :style="`width: ${progressPct}%`" :class="['h-full transition-all duration-700', allCompleted ? 'bg-emerald-500' : 'bg-blue-600']"></div>
                </div>
              </div>
              <button @click="showConfirm = true" :disabled="!league.matches.length" 
                class="btn-primary w-full sm:w-auto h-11 px-8 text-xs font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-600/20">
                Finalise Round
              </button>
            </div>
          </div>
        </div>

        <!-- No Active State -->
        <div v-else class="card p-12 flex flex-col items-center text-center gap-3">
          <p class="text-sm font-bold opacity-20">NO ACTIVE OPERATIONS</p>
          <p class="text-xs opacity-50">Current season is in a dormant state.</p>
        </div>
      </div>

      <!-- RIGHT: Archive Rail (Side rail) -->
      <div class="lg:col-span-4 space-y-4">
        <div class="card overflow-hidden">
          <div class="px-4 py-3 border-b bg-slate-500/5" style="border-color: var(--border);">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-50">Season Archive</span>
          </div>
          <div class="p-2 space-y-1 max-h-[500px] overflow-y-auto">
            <div v-for="r in league.rounds" :key="r.id" class="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-500/5"
              :class="r.status === 'Active' ? 'border-blue-500/20 bg-blue-500/5' : ''">
              <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-xs">{{ r.round_number }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold leading-none">Round {{ r.round_number }}</p>
                <p class="text-[9px] mt-1 opacity-50">{{ r.season_year }} Season</p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <div :class="['w-1.5 h-1.5 rounded-full', statusBadge(r.status).dot]"></div>
                <span class="text-[8px] font-bold uppercase opacity-40">{{ statusBadge(r.status).text }}</span>
              </div>
            </div>
            <div v-if="!league.rounds.length" class="p-8 text-center text-xs opacity-30">Archive empty.</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modals (Dates) -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/80">
        <div class="card w-full max-w-sm overflow-hidden border-blue-500/30">
          <div class="px-6 py-4 flex items-center justify-between border-b" style="border-color: var(--border);">
            <h2 class="text-sm font-bold">Round Configuration</h2>
            <button @click="showEditModal = false" class="btn-icon"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[11px] font-black uppercase tracking-widest opacity-60">Start Date</label>
                <input v-model="editForm.start_date" type="date" class="input-field h-11 text-sm px-3"/>
              </div>
              <div class="space-y-2">
                <label class="text-[11px] font-black uppercase tracking-widest opacity-60">End Date</label>
                <input v-model="editForm.end_date" type="date" class="input-field h-11 text-sm px-3"/>
              </div>
            </div>
            <button @click="handleUpdateRound" :disabled="updating" class="btn-primary w-full h-11 text-xs font-black">SYNC CHANGES</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Finalise Dialog -->
    <ConfirmDialog v-if="showConfirm" title="Finalise Round?" message="Archiving this round commits official standings snapshots." confirm-label="FINALISE" :loading="finalizing" @confirm="doFinalizeRound" @cancel="showConfirm = false" />
  </div>
</template>
