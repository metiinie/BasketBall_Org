<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useLeagueStore } from '@/stores/league.js'
import GlobalFilter from '@/components/GlobalFilter.vue'

const auth = useAuthStore()
const league = useLeagueStore()
const scheduleFilter = ref('week')

async function initDashboard() {
  await league.fetchRounds(league.selectedSeason)
  const roundId = league.activeRound ? league.activeRound.id : (league.rounds.length > 0 ? league.rounds[0].id : null)
  
  if (roundId) {
    await Promise.all([
      league.fetchTeams(league.selectedGender),
      league.fetchMatches(roundId),
    ])
  } else {
    // Just fetch teams if no round exists
    await league.fetchTeams(league.selectedGender)
  }
}

onMounted(initDashboard)

// Watch for global navigation changes
watch([() => league.selectedGender, () => league.selectedSeason], initDashboard)

const completedMatches = computed(() => league.matches.filter(m => m.status === 'Completed').length)
const totalMatches = computed(() => league.matches.length)
const completionPct = computed(() =>
  totalMatches.value ? Math.round((completedMatches.value / totalMatches.value) * 100) : 0
)

const top3Standings = computed(() =>
  [...league.standings]
    .sort((a, b) => b.leaguePts - a.leaguePts || b.ptsDiff - a.ptsDiff)
    .slice(0, 3)
)

const upcomingMatches = computed(() => {
  if (scheduleFilter.value === 'today') {
    const todayStr = new Date().toDateString()
    return league.matches
      .filter(m => m.status === 'Scheduled' && m.match_date && new Date(m.match_date).toDateString() === todayStr)
      .slice(0, 5)
  }
  return league.matches.filter(m => m.status === 'Scheduled').slice(0, 5)
})

const matchOfTheWeek = computed(() => upcomingMatches.value.length > 0 ? upcomingMatches.value[0] : null)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
          <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Admin Dashboard</p>
          <h1 class="text-2xl font-bold tracking-tight" style="color: var(--text-heading);">Welcome, League Admin</h1>
          <div class="mt-2.5">
            <GlobalFilter />
          </div>
          <p class="text-sm mt-3 font-medium" style="color: var(--text-muted);">
            Managing {{ league.activeRound ? `Match Round ${league.activeRound.round_number}` : 'the next season operations' }}.
          </p>
      </div>
      <div class="card px-4 py-2 rounded-full inline-flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full" :class="league.activeRound ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'"></span>
        <span class="text-sm font-bold tracking-wide" style="color: var(--text-primary);">
          {{ league.activeRound ? `Round ${league.activeRound.round_number} — Active` : 'No Active Round' }}
        </span>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

      <!-- Left: Quick Actions + Top 3 -->
      <div class="lg:col-span-4 flex flex-col gap-5">

        <!-- Quick Actions -->
        <div class="card rounded-2xl p-5">
          <h2 class="text-[10px] font-bold uppercase tracking-widest mb-4" style="color: var(--text-muted);">Quick Actions</h2>
          <div class="space-y-2.5">
            <RouterLink to="/admin/scores"
              class="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide rounded-lg shadow-sm shadow-blue-600/20 transition-all">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Enter Scores
            </RouterLink>
            <RouterLink to="/admin/scheduler"
              class="block w-full text-center py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold tracking-wide rounded-lg transition-all">
              Schedule Matches
            </RouterLink>
          </div>

          <!-- Progress -->
          <div class="mt-6 pt-5" style="border-top: 1px solid var(--border);">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-semibold" style="color: var(--text-muted);">Round Completion</span>
              <span class="text-[10px] font-bold" :class="completionPct < 100 ? 'text-blue-500' : 'text-emerald-500'">{{ completionPct }}%</span>
            </div>
            <div class="w-full h-1.5 rounded-full overflow-hidden" style="background-color: var(--bg-surface);">
              <div class="h-full transition-all duration-700"
                :class="completionPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'"
                :style="{ width: `${completionPct}%` }"/>
            </div>
            <p class="text-[10px] mt-1.5" style="color: var(--text-muted);">{{ completedMatches }} of {{ totalMatches }} matches completed</p>
          </div>
        </div>

        <!-- Top 3 -->
        <div class="card rounded-2xl p-5 flex-1">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-[10px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">Top 3 Standings</h2>
            <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div class="space-y-3">
            <div v-for="(entry, index) in top3Standings" :key="entry.team.id"
              class="flex items-center justify-between pb-3 last:pb-0"
              :style="index < top3Standings.length - 1 ? 'border-bottom: 1px solid var(--border);' : ''">
              <div class="flex items-center gap-3">
                <span class="text-lg font-black italic w-6" :class="index === 0 ? 'text-amber-400' : 'text-slate-400'">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <div>
                  <p class="text-sm font-bold" style="color: var(--text-primary);">{{ entry.team.name }}</p>
                  <p class="text-[10px] font-medium mt-0.5" style="color: var(--text-muted);">{{ entry.wins }}W – {{ entry.losses }}L</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-black text-blue-500">{{ entry.leaguePts }} PTS</p>
                <p class="text-[10px] font-bold mt-0.5" style="color: var(--text-muted);">{{ entry.ptsDiff > 0 ? '+' : '' }}{{ entry.ptsDiff }} PD</p>
              </div>
            </div>
            <div v-if="!top3Standings.length" class="py-4 text-center text-xs" style="color: var(--text-muted);">No standings data yet</div>
          </div>
        </div>
      </div>

      <!-- Right: Match of Week + Schedule + Admin Links -->
      <div class="lg:col-span-8 flex flex-col gap-5">

        <!-- Featured Match -->
        <div class="card rounded-2xl p-7 relative overflow-hidden min-h-[240px] flex flex-col justify-between">
          <!-- Subtle gradient orb -->
          <div class="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue-600/5 blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between mb-5">
            <span class="px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-blue-500/10 border border-blue-500/20 text-blue-500">
              Next Scheduled Match
            </span>
            <span v-if="matchOfTheWeek" class="px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-black tracking-widest rounded-full uppercase">
              Scheduled
            </span>
          </div>

          <div v-if="matchOfTheWeek" class="flex-1 flex items-center justify-center">
            <div class="flex items-center justify-between w-full max-w-md">
              <!-- Home -->
              <div class="flex flex-col items-center gap-3">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border shadow-lg transition-transform hover:scale-105"
                  style="background-color: var(--bg-surface); border-color: var(--border);">
                  <img v-if="matchOfTheWeek.home_team?.logo_url" :src="matchOfTheWeek.home_team.logo_url" class="w-14 h-14 object-contain transition-all duration-300"/>
                  <span v-else class="text-3xl font-black italic" style="color: var(--text-muted);">{{ matchOfTheWeek.home_team?.name?.charAt(0) }}</span>
                </div>
                <h3 class="text-sm font-black uppercase tracking-widest text-center max-w-[130px] truncate" style="color: var(--text-heading);">{{ matchOfTheWeek.home_team?.name }}</h3>
              </div>

              <div class="text-3xl font-black italic px-4" style="color: var(--text-muted); opacity: 0.3;">VS</div>

              <!-- Away -->
              <div class="flex flex-col items-center gap-3">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border shadow-lg transition-transform hover:scale-105"
                  style="background-color: var(--bg-surface); border-color: var(--border);">
                  <img v-if="matchOfTheWeek.away_team?.logo_url" :src="matchOfTheWeek.away_team.logo_url" class="w-14 h-14 object-contain transition-all duration-300"/>
                  <span v-else class="text-3xl font-black italic" style="color: var(--text-muted);">{{ matchOfTheWeek.away_team?.name?.charAt(0) }}</span>
                </div>
                <h3 class="text-sm font-black uppercase tracking-widest text-center max-w-[130px] truncate" style="color: var(--text-heading);">{{ matchOfTheWeek.away_team?.name }}</h3>
              </div>
            </div>
          </div>

          <div v-else class="flex-1 flex items-center justify-center py-6">
            <p class="text-xs font-black uppercase tracking-widest opacity-40" style="color: var(--text-muted);">No upcoming scheduled matches</p>
          </div>

          <div class="flex justify-center gap-3 mt-5">
            <RouterLink to="/admin/scores" class="btn-primary px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Enter Score</RouterLink>
            <RouterLink to="/matches" class="btn-ghost px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">View Schedule</RouterLink>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

          <!-- Upcoming Schedule -->
          <div class="card rounded-2xl p-5">
            <div class="flex justify-between items-center mb-5">
              <h2 class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">Upcoming Lineup</h2>
              <div class="flex rounded-lg p-0.5" style="background-color: var(--bg-surface);">
                <button @click="scheduleFilter = 'today'"
                  :class="scheduleFilter === 'today' ? 'bg-blue-600/20 text-blue-500' : ''"
                  :style="scheduleFilter !== 'today' ? 'color: var(--text-muted);' : ''"
                  class="px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all">Today</button>
                <button @click="scheduleFilter = 'week'"
                  :class="scheduleFilter === 'week' ? 'bg-blue-600/20 text-blue-500' : ''"
                  :style="scheduleFilter !== 'week' ? 'color: var(--text-muted);' : ''"
                  class="px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all">Week</button>
              </div>
            </div>

            <div class="space-y-4">
              <div v-for="(match, index) in upcomingMatches" :key="match.id" class="flex gap-4 items-center group">
                <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border"
                     style="background-color: var(--bg-surface); border-color: var(--border);">
                  <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-7 h-7 object-contain"/>
                  <span v-else class="text-[10px] font-black" style="color: var(--text-muted);">{{ match.home_team?.name?.charAt(0) }}</span>
                </div>
                <div class="flex-1 relative">
                  <p class="text-[11px] font-black uppercase tracking-tight" style="color: var(--text-primary);">
                    {{ match.home_team?.name }} <span class="opacity-30 mx-1">vs</span> {{ match.away_team?.name }}
                  </p>
                  <p class="text-[9px] font-black uppercase tracking-[0.1em] text-blue-500 mt-1 opacity-70">{{ match.venue || 'Center Court' }} • {{ match.match_date ? new Date(match.match_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA' }}</p>
                </div>
              </div>
              <div v-if="!upcomingMatches.length" class="py-10 text-center">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-30" style="color: var(--text-muted);">No matches listed</p>
              </div>
            </div>
          </div>

          <!-- League Administration -->
          <div class="card flex flex-col justify-between rounded-2xl p-5">
            <div>
              <h2 class="text-[10px] font-bold uppercase tracking-widest mb-2" style="color: var(--text-muted);">League Administration</h2>
              <p class="text-xs font-medium mb-5 leading-relaxed" style="color: var(--text-muted);">Configure teams and manage tournament round progression.</p>
            </div>
            <div class="space-y-2.5">
              <RouterLink to="/admin/teams"
                class="w-full flex items-center justify-between p-3 rounded-lg border transition-colors group"
                style="background-color: var(--bg-surface); border-color: var(--border);"
                @mouseenter="$event.currentTarget.style.borderColor = '#3b82f6'"
                @mouseleave="$event.currentTarget.style.borderColor = 'var(--border)'">
                <span class="text-xs font-bold group-hover:text-blue-500 transition-colors" style="color: var(--text-secondary);">Team Manager</span>
                <span class="text-blue-500 font-bold text-sm">→</span>
              </RouterLink>
              <RouterLink to="/admin/rounds"
                class="w-full flex items-center justify-between p-3 rounded-lg border transition-colors group"
                style="background-color: var(--bg-surface); border-color: var(--border);"
                @mouseenter="$event.currentTarget.style.borderColor = '#3b82f6'"
                @mouseleave="$event.currentTarget.style.borderColor = 'var(--border)'">
                <span class="text-xs font-bold group-hover:text-blue-500 transition-colors" style="color: var(--text-secondary);">Round Manager</span>
                <span class="text-blue-500 font-bold text-sm">→</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
