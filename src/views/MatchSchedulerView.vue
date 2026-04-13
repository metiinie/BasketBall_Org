<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeagueStore } from '@/stores/league.js'

const router = useRouter()
const league = useLeagueStore()

const matchData = ref({
  gender: 'ወንድ', // default to Men, 'ሴት' for Women
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
})

const filteredTeams = computed(() => {
  return league.teams.filter(t => t.gender === matchData.value.gender)
})

const recentSchedules = computed(() => {
  return league.matches
    .filter(m => m.status === 'Pending' || m.status === 'Scheduled' || m.status === 'Completed')
    .slice(0, 5)
})

async function scheduleMatch() {
  if (!league.activeRound) {
    errorMsg.value = 'No active round found to schedule this match in.'
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
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const matchDateIso = new Date(matchData.value.match_date).toISOString()

    await league.createMatch({
      round_id: league.activeRound.id,
      home_team_id: matchData.value.home_team_id,
      away_team_id: matchData.value.away_team_id,
      match_date: matchDateIso,
      venue: matchData.value.venue,
      status: 'Pending'
    })

    successMsg.value = 'Match scheduled successfully! Wait a moment for UI refresh.'
    
    // Reset form partially
    matchData.value.home_team_id = ''
    matchData.value.away_team_id = ''
  } catch (err) {
    errorMsg.value = err.message || 'Failed to schedule match.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-12">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-4">
      <button @click="router.back()" class="p-2 -ml-2 rounded-xl hover:bg-tertiary text-muted hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-3xl font-black text-primary tracking-tight">Match Scheduler</h1>
        <p class="text-muted text-sm mt-1 font-medium">Organize upcoming fixtures and manage the league's competitive rhythm.</p>
      </div>
    </div>

    <div v-if="league.loading && league.teams.length === 0" class="glass-panel p-16 flex flex-col items-center justify-center text-muted rounded-3xl">
      <div class="w-10 h-10 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin mb-4"></div>
      Loading league data...
    </div>

    <!-- Main Grid Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Left Column: Form -->
      <div class="lg:col-span-8">
        <form @submit.prevent="scheduleMatch" class="glass-panel p-8 space-y-12 rounded-[2rem] border border-teal-500/10 shadow-2xl relative overflow-hidden">
          
          <div class="flex justify-between items-center border-b border-teal-500/10 pb-4">
            <h2 class="text-base font-black text-neon-green tracking-widest uppercase">Create Upcoming Matches</h2>
            <span class="px-3 py-1 bg-tertiary border border-teal-500/20 text-[10px] text-muted font-bold tracking-widest rounded-full uppercase">Official Entry</span>
          </div>

          <!-- Current Active Round Indicator -->
          <div v-if="league.activeRound" class="p-4 rounded-xl bg-tertiary/50 border border-teal-500/10 flex items-center justify-between shadow-inner">
            <div>
              <span class="text-[10px] font-black text-neon-green uppercase tracking-widest mb-1 block">Target Round</span>
              <p class="text-sm font-bold text-primary tracking-wide">Round {{ league.activeRound.round_number }} <span class="text-muted font-medium">(Season {{ league.activeRound.season_year }})</span></p>
            </div>
            <div class="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
          <div v-else class="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-semibold text-center">
            Warning: No active round found. You cannot schedule matches until a round is active.
          </div>

          <!-- Form Grid -->
          <div class="space-y-8">
            
            <!-- Teams Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <!-- Home Team -->
              <div>
                <label class="block text-[10px] font-black text-muted mb-3 uppercase tracking-widest">Team A (Home)</label>
                <select v-model="matchData.home_team_id" required class="w-full bg-background border border-teal-500/20 rounded-xl px-5 py-4 text-primary text-sm font-bold focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner appearance-none outline-none">
                  <option value="" disabled>Select Home Team</option>
                  <option v-for="team in filteredTeams" :key="team.id" :value="team.id" :disabled="team.id === matchData.away_team_id" class="bg-secondary text-primary font-bold">
                    {{ team.name }}
                  </option>
                </select>
              </div>

              <!-- Away Team -->
              <div>
                <label class="block text-[10px] font-black text-muted mb-3 uppercase tracking-widest">Team B (Away)</label>
                <select v-model="matchData.away_team_id" required class="w-full bg-background border border-teal-500/20 rounded-xl px-5 py-4 text-primary text-sm font-bold focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner appearance-none outline-none">
                  <option value="" disabled>Select Away Team</option>
                  <option v-for="team in filteredTeams" :key="team.id" :value="team.id" :disabled="team.id === matchData.home_team_id" class="bg-secondary text-primary font-bold">
                    {{ team.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Date and Venue Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <!-- Match Date & Time -->
              <div>
                <label class="block text-[10px] font-black text-muted mb-3 uppercase tracking-widest">Date and Time</label>
                <input type="datetime-local" v-model="matchData.match_date" required class="w-full bg-background border border-teal-500/20 rounded-xl px-5 py-4 text-primary text-sm font-bold focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner outline-none" />
              </div>

              <!-- Venue -->
              <div>
                <label class="block text-[10px] font-black text-muted mb-3 uppercase tracking-widest">Venue Selection</label>
                <div class="relative">
                  <input type="text" v-model="matchData.venue" placeholder="e.g. Haile Resort Court" class="w-full bg-background border border-teal-500/20 rounded-xl px-5 py-4 pr-12 text-primary text-sm font-bold focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner placeholder-muted outline-none" />
                  <svg class="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>
            </div>

            <!-- Category (Gender) -->
            <div>
              <label class="block text-[10px] font-black text-muted mb-3 uppercase tracking-widest">Gender Category</label>
              <div class="grid grid-cols-2 gap-6 relative">
                <button type="button" @click="matchData.gender = 'ወንድ'" :class="[
                  'py-4 px-6 rounded-full text-xs font-black tracking-widest transition-all uppercase flex justify-center items-center gap-2 border',
                  matchData.gender === 'ወንድ' ? 'bg-secondary border-neon-green text-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-background border-transparent text-muted hover:text-white'
                ]">
                  <svg v-if="matchData.gender === 'ወንድ'" class="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m12-11a2 2 0 110-4 2 2 0 010 4z" /></svg> Men
                </button>
                <button type="button" @click="matchData.gender = 'ሴት'" :class="[
                  'py-4 px-6 rounded-full text-xs font-black tracking-widest transition-all uppercase flex justify-center items-center gap-2 border',
                  matchData.gender === 'ሴት' ? 'bg-secondary border-neon-green text-primary shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-background border-transparent text-muted hover:text-white'
                ]">
                  <svg v-if="matchData.gender === 'ሴት'" class="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m12-11a2 2 0 110-4 2 2 0 010 4z" /></svg> Women
                </button>
              </div>
            </div>

          </div>

          <!-- Messaging -->
          <div v-if="errorMsg" class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl text-center">
            {{ errorMsg }}
          </div>
          <div v-if="successMsg" class="p-4 bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-bold rounded-xl text-center">
            {{ successMsg }}
          </div>

          <!-- Submit -->
          <div class="pt-4">
            <button type="submit" :disabled="submitting || !league.activeRound" class="w-full py-5 rounded-full bg-gradient-neon text-white font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group">
              <span v-if="submitting" class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span v-else class="text-xs">Publish Match Schedule</span>
            </button>
          </div>

        </form>
      </div>

      <!-- Right Column: Recent Schedules Sidebar -->
      <div class="lg:col-span-4">
        <div class="glass-panel p-6 space-y-6 rounded-[2rem] border border-teal-500/10 shadow-lg min-h-full">
          
          <div class="flex items-center gap-2 mb-6">
            <svg class="w-5 h-5 text-ebf-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <h2 class="text-base font-black text-primary tracking-wide">Recent Schedules</h2>
          </div>

          <div class="space-y-4">
            <div v-for="match in recentSchedules" :key="match.match_id" class="p-4 rounded-xl border border-teal-500/20 bg-background/50 hover:bg-background transition-colors relative overflow-hidden group">
              
              <div class="absolute inset-y-0 left-0 w-1 rounded-l-xl" :class="match.status === 'Completed' ? 'bg-yellow-500' : (match.status === 'Pending' ? 'bg-neon-green' : 'bg-gray-500')"></div>
              
              <div class="flex justify-between items-center mb-3">
                <span class="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase" :class="match.status === 'Completed' ? 'bg-yellow-500/20 text-yellow-500' : (match.status === 'Pending' ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-500/20 text-gray-400')">
                  {{ match.status === 'Pending' ? 'SCHEDULED' : match.status }}
                </span>
                <span class="text-[9px] text-muted font-bold">{{ match.match_date ? new Date(match.match_date).toLocaleString('en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '' }}</span>
              </div>

              <div class="flex justify-between items-center">
                <p class="text-xs font-black text-primary leading-tight text-right w-[40%]">{{ match.home_team.team_name }}</p>
                <span class="text-[9px] text-muted italic font-black w-[10%] text-center">VS</span>
                <p class="text-xs font-black text-primary leading-tight w-[40%] text-left">{{ match.away_team.team_name }}</p>
              </div>

              <div class="mt-4 flex items-center gap-1 opacity-70">
                <svg class="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span class="text-[9px] font-bold text-muted truncate">{{ match.venue || 'No Venue' }}</span>
              </div>
            </div>

            <div v-if="!recentSchedules.length" class="text-center py-6 text-xs text-muted font-medium">
              No recent schedules exist to display.
            </div>
          </div>
          
          <div class="pt-6 border-t border-teal-500/10 flex justify-center">
             <RouterLink to="/matches" class="text-[10px] font-bold text-muted hover:text-white uppercase tracking-widest transition-colors py-2 px-6 rounded-full border border-teal-500/20 hover:border-teal-500/50">View Full League Calendar</RouterLink>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
