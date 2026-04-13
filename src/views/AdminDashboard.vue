<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useLeagueStore } from '@/stores/league.js'

const auth = useAuthStore()
const league = useLeagueStore()

const scheduleFilter = ref('week') // 'today' | 'week'

onMounted(async () => {
  await league.fetchRounds()
  if (league.activeRound) {
    await Promise.all([
      league.fetchTeams('ወንድ'),
      league.fetchMatches(league.activeRound.id),
    ])
  } else if (league.rounds.length > 0) {
    await Promise.all([
      league.fetchTeams('ወንድ'),
      league.fetchMatches(league.rounds[0].id),
    ])
  }
})

const completedMatches = computed(() =>
  league.matches.filter(m => m.status === 'Completed').length
)
const totalMatches = computed(() => league.matches.length)
const completionPct = computed(() =>
  totalMatches.value ? Math.round((completedMatches.value / totalMatches.value) * 100) : 0
)

const top3Standings = computed(() => {
  return [...league.standings]
    .sort((a, b) => b.leaguePts - a.leaguePts || b.ptsDiff - a.ptsDiff)
    .slice(0, 3)
})

const upcomingMatches = computed(() => {
  if (scheduleFilter.value === 'today') {
    const todayStr = new Date().toDateString()
    return league.matches
      .filter(m => m.status === 'Scheduled' && m.match_date && new Date(m.match_date).toDateString() === todayStr)
      .slice(0, 5)
  }
  return league.matches
    .filter(m => m.status === 'Scheduled')
    .slice(0, 5)
})

const matchOfTheWeek = computed(() => upcomingMatches.value.length > 0 ? upcomingMatches.value[0] : null)

</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Admin Dashboard</p>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Welcome, League Admin</h1>
        <p class="text-sm text-slate-500 mt-1 font-medium">Managing {{ league.activeRound ? `Match Round ${league.activeRound.round_number}` : 'the next season operations' }}.</p>
      </div>

      <div v-if="league.activeRound" class="card px-4 py-2 rounded-full inline-flex items-center space-x-3">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-sm font-bold text-slate-900 tracking-wide">Round {{ league.activeRound.round_number }} - Active</span>
      </div>
      <div v-else class="card px-4 py-2 rounded-full inline-flex items-center space-x-3">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
        <span class="text-sm font-bold text-slate-900 tracking-wide">No Active Round</span>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Left Column: Global Action -->
      <div class="lg:col-span-4 flex flex-col gap-6">
        <div class="card rounded-2xl p-6">
          <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Quick Actions</h2>
          
          <div class="space-y-3">
            <RouterLink to="/admin/scores" class="flex items-center justify-center gap-2 w-full text-center py-3 bg-blue-600 text-white text-sm font-bold tracking-wide rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all duration-200">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              ENTER SCORES
            </RouterLink>

            <RouterLink to="/admin/scheduler" class="block w-full text-center py-3 bg-amber-400 text-gray-900 text-sm font-bold tracking-wide rounded-lg shadow-sm hover:bg-amber-500 active:scale-95 transition-all duration-200">
              SCHEDULE MATCHES
            </RouterLink>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-semibold text-slate-500">Round Completion</span>
              <span class="text-[10px] font-bold" :class="completionPct < 100 ? 'text-blue-600' : 'text-emerald-600'">{{ completionPct }}%</span>
            </div>
            <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-600 transition-all" :style="{ width: `${completionPct}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Top 3 Standings -->
        <div class="card rounded-2xl p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top 3 Standings</h2>
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>

          <div class="space-y-4">
            <div v-for="(entry, index) in top3Standings" :key="entry.team.id" class="flex flex-col border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-xl font-black italic" :class="index === 0 ? 'text-amber-500' : 'text-slate-400'">0{{ index + 1 }}</span>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ entry.team.name }}</p>
                    <p class="text-[10px] text-slate-500 font-medium">{{ entry.wins }}W - {{ entry.losses }}L</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-black text-blue-600">{{ entry.leaguePts }} PTS</p>
                  <p class="text-[10px] font-bold text-slate-500 mt-0.5">{{ entry.ptsDiff > 0 ? '+' : '' }}{{ entry.ptsDiff }} PD</p>
                </div>
              </div>
            </div>
            <div v-if="!top3Standings.length" class="text-center py-4 text-xs text-slate-400 font-medium">No standings data yet</div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="lg:col-span-8 flex flex-col gap-6">
        
        <!-- Match of the Week Area -->
        <div class="card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
          <div class="flex items-start w-full relative z-20 mb-6">
            <div class="w-full flex justify-center">
              <span class="px-3 py-1 bg-blue-50 text-[10px] text-blue-600 font-bold tracking-widest rounded-lg border border-blue-200 uppercase">Next Scheduled Match</span>
            </div>
            <div v-if="matchOfTheWeek" class="absolute right-0 top-0">
              <span class="px-2.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black tracking-widest rounded-full uppercase">
                {{ matchOfTheWeek.status === 'Pending' ? 'SCHEDULED' : matchOfTheWeek.status }}
              </span>
            </div>
          </div>

          <div v-if="matchOfTheWeek" class="flex-1 flex flex-col items-center justify-center relative z-10 w-full mb-6">
            <div class="flex items-center justify-between w-full max-w-lg mb-6">
              <div class="flex flex-col items-center">
                <div class="w-20 h-20 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center mb-4 overflow-hidden">
                  <img v-if="matchOfTheWeek.home_team?.logo_url" :src="matchOfTheWeek.home_team.logo_url" class="w-full h-full object-cover" />
                  <div v-else class="text-2xl font-black text-slate-500">{{ matchOfTheWeek.home_team?.name?.charAt(0) }}</div>
                </div>
                <h3 class="text-base font-bold text-slate-900 text-center truncate max-w-[120px]">{{ matchOfTheWeek.home_team?.name }}</h3>
              </div>

              <div class="text-3xl font-black text-slate-300 italic px-4">VS</div>

              <div class="flex flex-col items-center">
                <div class="w-20 h-20 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center mb-4 overflow-hidden">
                  <img v-if="matchOfTheWeek.away_team?.logo_url" :src="matchOfTheWeek.away_team.logo_url" class="w-full h-full object-cover" />
                  <div v-else class="text-2xl font-black text-slate-500">{{ matchOfTheWeek.away_team?.name?.charAt(0) }}</div>
                </div>
                <h3 class="text-base font-bold text-slate-900 text-center truncate max-w-[120px]">{{ matchOfTheWeek.away_team?.name }}</h3>
              </div>
            </div>
          </div>

          <div v-else class="flex-1 flex items-center justify-center pb-8">
            <p class="text-slate-500 font-medium text-sm">No upcoming scheduled matches</p>
          </div>

          <div class="flex justify-center gap-4 relative z-10 w-full mt-auto">
            <RouterLink to="/admin/scores" class="btn-primary px-8 py-3 rounded-full text-xs tracking-widest">ENTER SCORE</RouterLink>
            <RouterLink to="/matches" class="btn-ghost px-8 py-3 rounded-full text-xs tracking-widest">VIEW MATCHES</RouterLink>
          </div>
        </div>

        <!-- Bottom Cards Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Upcoming Schedule -->
          <div class="card rounded-2xl p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upcoming Schedule</h2>
              <div class="flex bg-slate-100 rounded-full p-0.5">
                <button @click="scheduleFilter = 'today'" :class="scheduleFilter === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'" class="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors">TODAY</button>
                <button @click="scheduleFilter = 'week'" :class="scheduleFilter === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'" class="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-colors">WEEK</button>
              </div>
            </div>
            <div class="space-y-3">
              <div v-for="(match, index) in upcomingMatches" :key="match.id" class="flex gap-4 items-start">
                <div class="text-center pt-1 text-slate-400 w-8 flex-shrink-0">
                  <p class="text-[10px] font-bold uppercase tracking-widest">Sch</p>
                  <p class="text-lg font-black text-slate-900">{{ index + 1 }}</p>
                </div>
                <div class="border-l border-slate-200 pl-4 w-full relative">
                  <span class="absolute right-0 top-0 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase"
                        :class="match.status === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'">
                    {{ match.status }}
                  </span>
                  <p class="text-sm font-bold text-slate-900">{{ match.home_team?.name }} <span class="text-[10px] text-slate-400 mx-0.5">vs</span></p>
                  <p class="text-sm font-bold text-slate-900">{{ match.away_team?.name }}</p>
                  <p class="text-[10px] font-medium text-blue-600 mt-1">{{ match.venue || 'TBA' }} • {{ match.match_date ? new Date(match.match_date).toLocaleDateString() : 'TBA' }}</p>
                </div>
              </div>
              <div v-if="!upcomingMatches.length" class="py-4 text-center text-xs text-slate-400">No upcoming scheduled matches</div>
            </div>
          </div>

          <!-- League Administration setup -->
          <div class="card flex flex-col justify-between rounded-2xl p-6">
            <div>
              <h2 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">League Administration</h2>
              <p class="text-xs font-medium text-slate-500 mb-6 leading-relaxed">Configure participating teams and setup the tournament round progression here.</p>
            </div>
            
            <div class="space-y-3">
              <RouterLink to="/admin/teams" class="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                <span class="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Team Manager</span>
                <span class="text-slate-400 group-hover:text-blue-600 transition-colors">→</span>
              </RouterLink>
              <RouterLink to="/admin/rounds" class="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                <span class="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Round Manager</span>
                <span class="text-slate-400 group-hover:text-blue-600 transition-colors">→</span>
              </RouterLink>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional component-specific scopes are optional given Tailwind rules */
</style>
