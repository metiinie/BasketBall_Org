<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeagueStore } from '@/stores/league.js'

const router = useRouter()
const league = useLeagueStore()

const matchData = ref({
  gender: 'ወንድ',
  home_team_id: '',
  away_team_id: '',
  match_date: '',
  venue: ''
})

const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  await league.fetchRounds()
  await league.fetchTeams()
  if (league.activeRound) {
    await league.fetchMatches(league.activeRound.id)
  }
})

const filteredTeams = computed(() =>
  league.teams.filter(t => t.gender === matchData.value.gender)
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
    Completed: 'bg-blue-50 text-blue-700 border-blue-200',
    Scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Pending:   'bg-amber-50 text-amber-700 border-amber-200',
  }
  return map[status] ?? map.Pending
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
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">Match Scheduler</h1>
        <p class="text-xs text-slate-400 mt-0.5">Create and publish upcoming league fixtures</p>
      </div>
    </div>

    <!-- Active Round Banner -->
    <div v-if="league.activeRound" class="card px-5 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></div>
        <div>
          <p class="text-xs font-bold text-slate-900">Round {{ league.activeRound.round_number }} — Season {{ league.activeRound.season_year }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">All new fixtures will be assigned to this round</p>
        </div>
      </div>
      <span class="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span>
    </div>

    <div v-else class="card px-5 py-3.5 border-amber-200 bg-amber-50">
      <p class="text-xs text-amber-700 font-semibold">⚠ No active round found. Please activate a round in Round Manager before scheduling matches.</p>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Form Card -->
      <div class="lg:col-span-8">
        <form @submit.prevent="scheduleMatch" class="card p-6 space-y-5">

          <div class="pb-4 border-b border-slate-100">
            <h2 class="text-sm font-bold text-slate-900">New Fixture</h2>
            <p class="text-xs text-slate-400 mt-0.5">Fill in all required fields to publish the match</p>
          </div>

          <!-- Gender Division Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">Division</label>
            <div class="flex gap-2">
              <button type="button"
                @click="matchData.gender = 'ወንድ'; matchData.home_team_id = ''; matchData.away_team_id = ''"
                :class="['flex-1 py-2 rounded-lg text-xs font-semibold border transition-all',
                  matchData.gender === 'ወንድ'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300']">
                ♂ Men's Division
              </button>
              <button type="button"
                @click="matchData.gender = 'ሴት'; matchData.home_team_id = ''; matchData.away_team_id = ''"
                :class="['flex-1 py-2 rounded-lg text-xs font-semibold border transition-all',
                  matchData.gender === 'ሴት'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300']">
                ♀ Women's Division
              </button>
            </div>
          </div>

          <!-- Teams Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Home Team</label>
              <select v-model="matchData.home_team_id" required class="input-field">
                <option value="" disabled>Select home team</option>
                <option
                  v-for="team in filteredTeams" :key="team.id" :value="team.id"
                  :disabled="team.id === matchData.away_team_id"
                >{{ team.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Away Team</label>
              <select v-model="matchData.away_team_id" required class="input-field">
                <option value="" disabled>Select away team</option>
                <option
                  v-for="team in filteredTeams" :key="team.id" :value="team.id"
                  :disabled="team.id === matchData.home_team_id"
                >{{ team.name }}</option>
              </select>
            </div>
          </div>

          <!-- VS Badge (decorative) -->
          <div v-if="matchData.home_team_id && matchData.away_team_id" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
            <span class="text-xs font-bold text-slate-700 flex-1 text-right">
              {{ filteredTeams.find(t => t.id === matchData.home_team_id)?.name }}
            </span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-blue-100 text-blue-700 border border-blue-200">VS</span>
            <span class="text-xs font-bold text-slate-700 flex-1">
              {{ filteredTeams.find(t => t.id === matchData.away_team_id)?.name }}
            </span>
          </div>

          <!-- Date / Time & Venue -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Date & Time</label>
              <input type="datetime-local" v-model="matchData.match_date" required class="input-field"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Venue <span class="text-slate-400 font-normal">(optional)</span></label>
              <input type="text" v-model="matchData.venue" placeholder="e.g. Haile Resort Court" class="input-field"/>
            </div>
          </div>

          <!-- Feedback -->
          <Transition name="fade">
            <div v-if="errorMsg" class="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <p class="text-xs text-red-600 font-semibold">{{ errorMsg }}</p>
            </div>
          </Transition>
          <Transition name="fade">
            <div v-if="successMsg" class="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <p class="text-xs text-emerald-700 font-semibold">{{ successMsg }}</p>
            </div>
          </Transition>

          <!-- Submit -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100">
            <p class="text-[10px] text-slate-400">Match will be added to Round {{ league.activeRound?.round_number }}</p>
            <button
              type="submit"
              :disabled="submitting || !league.activeRound"
              class="btn-primary px-5 py-2.5 shadow-sm shadow-blue-600/20 disabled:opacity-40"
            >
              <svg v-if="submitting" class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ submitting ? 'Scheduling…' : 'Schedule Match' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Recent Schedules Sidebar -->
      <div class="lg:col-span-4">
        <div class="card overflow-hidden h-full">
          <div class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-xs font-bold text-slate-600 uppercase tracking-widest">Scheduled Fixtures</p>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="match in recentSchedules"
              :key="match.id"
              class="px-5 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center justify-between mb-1">
                <span :class="['text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest', statusBadge(match.status)]">
                  {{ match.status }}
                </span>
                <span class="text-[10px] text-slate-400">
                  {{ match.match_date ? new Date(match.match_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—' }}
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-900 leading-snug">
                {{ match.home_team?.name }} <span class="text-slate-400 font-normal">vs</span> {{ match.away_team?.name }}
              </p>
              <p v-if="match.venue" class="text-[10px] text-slate-400 mt-0.5 truncate">📍 {{ match.venue }}</p>
            </div>

            <div v-if="!recentSchedules.length" class="px-5 py-10 text-center">
              <p class="text-xs text-slate-400">No fixtures scheduled yet.</p>
            </div>
          </div>

          <div class="px-5 py-3.5 border-t border-slate-100 bg-slate-50">
            <RouterLink to="/matches" class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5">
              View full calendar
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
