<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLeagueStore } from '@/stores/league.js'
import GlobalFilter from '@/components/GlobalFilter.vue'

const router = useRouter()
const league = useLeagueStore()

const matchData = ref({
  home_team_id: '',
  away_team_id: '',
  match_date: '',
  venue: ''
})

const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function initScheduler() {
  await league.fetchRounds(league.selectedSeason)
  await league.fetchTeams() // Fetch all teams once, computed will filter by gender
  if (league.activeRound) {
    await league.fetchMatches(league.activeRound.id)
  } else {
    league.matches = []
  }
}

onMounted(initScheduler)

watch(() => league.selectedSeason, initScheduler)
watch(() => league.selectedGender, () => {
  // Reset team selection if gender changes to prevent mismatched IDs
  matchData.value.home_team_id = ''
  matchData.value.away_team_id = ''
})

const filteredTeams = computed(() =>
  league.teams.filter(t => t.gender === league.selectedGender)
)

const recentSchedules = computed(() =>
  league.matches
    .filter(m => m.status === 'Pending' || m.status === 'Scheduled' || m.status === 'Completed')
    .slice(0, 6)
)

async function scheduleMatch() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!league.activeRound) {
    errorMsg.value = 'No active round found. Activate a round first.'
    return
  }
  if (!matchData.value.home_team_id || !matchData.value.away_team_id) {
    errorMsg.value = 'Please select both Home and Away teams.'
    return
  }
  if (matchData.value.home_team_id === matchData.value.away_team_id) {
    errorMsg.value = 'Home and Away teams must be different.'
    return
  }
  if (!matchData.value.match_date) {
    errorMsg.value = 'Please specify a match date and time.'
    return
  }

  submitting.value = true
  try {
    await league.createMatch({
      round_id: league.activeRound.id,
      home_team_id: matchData.value.home_team_id,
      away_team_id: matchData.value.away_team_id,
      match_date: new Date(matchData.value.match_date).toISOString(),
      venue: matchData.value.venue,
      status: 'Scheduled'
    })
    successMsg.value = 'Match scheduled successfully!'
    matchData.value.home_team_id = ''
    matchData.value.away_team_id = ''
    matchData.value.match_date = ''
    matchData.value.venue = ''
    setTimeout(() => successMsg.value = '', 4000)
  } catch (err) {
    errorMsg.value = err.message || 'Failed to schedule match.'
  } finally {
    submitting.value = false
  }
}

const statusBadge = (status) => {
  const map = {
    Completed: 'badge-completed',
    Scheduled: 'badge-win',
    Pending:   'badge-pending',
  }
  return map[status] ?? 'badge-pending'
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-6">

    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="router.back()" class="btn-icon">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
      </button>
      <div>
        <h1 class="text-xl font-bold tracking-tight" style="color: var(--text-heading);">Match Scheduler</h1>
        <p class="text-xs mt-0.5" style="color: var(--text-muted);">Create and publish upcoming league fixtures</p>
      </div>
    </div>

    <!-- Active Round Banner -->
    <div v-if="league.activeRound" class="card px-5 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
        <div>
          <p class="text-xs font-bold" style="color: var(--text-primary);">Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}</p>
          <p class="text-[10px] mt-0.5" style="color: var(--text-muted);">All new fixtures will be assigned to this round</p>
        </div>
      </div>
      <span class="badge-completed px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold">Active</span>
    </div>

    <div v-else class="card px-5 py-3.5 border-amber-500/30 bg-amber-500/10">
      <p class="text-xs font-semibold text-amber-500">⚠ No active round found. Activate a round first.</p>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Form Card -->
      <div class="lg:col-span-8">
        <form @submit.prevent="scheduleMatch" class="card p-6 space-y-5">

          <div class="pb-4" style="border-bottom: 1px solid var(--border);">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">New Fixture</h2>
            <p class="text-xs mt-0.5" style="color: var(--text-muted);">Fill in all required fields to publish the match</p>
          </div>

          <!-- Global Filter (Gender / Season) -->
          <div class="p-4 rounded-xl border bg-slate-500/5 mb-2" style="border-color: var(--border);">
            <GlobalFilter />
          </div>

          <!-- Teams Selection -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">Home Team</label>
              <select v-model="matchData.home_team_id" required class="input-field">
                <option value="" disabled>Select home team</option>
                <option v-for="team in filteredTeams" :key="team.id" :value="team.id" :disabled="team.id === matchData.away_team_id">
                  {{ team.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">Away Team</label>
              <select v-model="matchData.away_team_id" required class="input-field">
                <option value="" disabled>Select away team</option>
                <option v-for="team in filteredTeams" :key="team.id" :value="team.id" :disabled="team.id === matchData.home_team_id">
                  {{ team.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- VS Badge Preview -->
          <div v-if="matchData.home_team_id && matchData.away_team_id"
            class="flex items-center gap-3 px-4 py-3 rounded-lg border"
            style="background-color: var(--bg-surface); border-color: var(--border);">
            <span class="text-xs font-bold flex-1 text-right" style="color: var(--text-primary);">
              {{ filteredTeams.find(t => t.id === matchData.home_team_id)?.name }}
            </span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-blue-600/20 text-blue-500 border border-blue-600/30">VS</span>
            <span class="text-xs font-bold flex-1" style="color: var(--text-primary);">
              {{ filteredTeams.find(t => t.id === matchData.away_team_id)?.name }}
            </span>
          </div>

          <!-- Time & Venue -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">Date & Time</label>
              <input type="datetime-local" v-model="matchData.match_date" required class="input-field"/>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color: var(--text-secondary);">Venue <span class="font-normal" style="color: var(--text-muted);">(optional)</span></label>
              <input type="text" v-model="matchData.venue" placeholder="e.g. Haile Court" class="input-field"/>
            </div>
          </div>

          <!-- Feedback -->
          <div v-if="errorMsg" class="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
            {{ errorMsg }}
          </div>
          <div v-if="successMsg" class="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>
            {{ successMsg }}
          </div>

          <!-- Action Row -->
          <div class="flex items-center justify-between pt-4" style="border-top: 1px solid var(--border);">
            <p class="text-[10px]" style="color: var(--text-muted);">Assigned to Round {{ league.activeRound?.round_number }}</p>
            <button type="submit" :disabled="submitting || !league.activeRound" class="btn-primary min-w-[140px]">
              <span v-if="submitting">Scheduling…</span>
              <span v-else>Schedule Match</span>
            </button>
          </div>

        </form>
      </div>

      <!-- Recent Sidebar -->
      <div class="lg:col-span-4">
        <div class="card overflow-hidden h-full flex flex-col">
          <div class="px-5 py-4 flex items-center gap-2" style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border);">
            <svg class="w-3.5 h-3.5" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--text-secondary);">Recent Fixtures</p>
          </div>

          <div class="flex-1 divide-y" style="border-color: var(--border);">
            <div v-for="match in recentSchedules" :key="match.id" class="px-5 py-3.5 hover:bg-slate-500/5 transition-colors">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase" :class="statusBadge(match.status)">
                  {{ match.status }}
                </span>
                <span class="text-[10px]" style="color: var(--text-muted);">
                  {{ match.match_date ? new Date(match.match_date).toLocaleDateString() : '—' }}
                </span>
              </div>
              <p class="text-xs font-bold" style="color: var(--text-primary);">
                {{ match.home_team?.name }} <span style="color: var(--text-muted);">vs</span> {{ match.away_team?.name }}
              </p>
              <p v-if="match.venue" class="text-[10px] mt-1" style="color: var(--text-muted);">📍 {{ match.venue }}</p>
            </div>
            <div v-if="!recentSchedules.length" class="py-10 text-center text-xs" style="color: var(--text-muted);">No fixtures yet.</div>
          </div>

          <div class="px-5 py-3.5" style="background-color: var(--bg-surface); border-top: 1px solid var(--border);">
            <RouterLink to="/matches" class="text-xs font-bold text-blue-500 flex items-center gap-1">
              View full calendar →
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
