<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useLeagueStore } from '@/stores/league.js'

const auth = useAuthStore()
const league = useLeagueStore()

const adminCards = [
  {
    to: '/admin/scores',
    label: 'Score Entry',
    desc: 'Input match results for the active round',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: 'from-ebf-orange/20 to-ebf-orange/5 border-ebf-orange/30 hover:border-ebf-orange/60',
    iconColor: 'text-ebf-orange',
  },
  {
    to: '/admin/rounds',
    label: 'Round Manager',
    desc: 'Close rounds and advance the season',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/60',
    iconColor: 'text-blue-400',
  },
  {
    to: '/admin/teams',
    label: 'Team Manager',
    desc: 'Add, edit or remove teams from the league',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60',
    iconColor: 'text-purple-400',
  },
  {
    to: '/',
    label: 'Public Standings',
    desc: 'Preview the public live standings view',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: 'from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/60',
    iconColor: 'text-green-400',
  },
]

const completedMatches = computed(() =>
  league.matches.filter(m => m.status === 'Completed').length
)
const totalMatches = computed(() => league.matches.length)
const completionPct = computed(() =>
  totalMatches.value ? Math.round((completedMatches.value / totalMatches.value) * 100) : 0
)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

    <!-- Welcome Header -->
    <div class="card p-6 bg-gradient-to-r from-navy-800 to-navy-900 border-navy-700/60 relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-48 h-48 bg-ebf-orange/5 rounded-full blur-2xl" />
      <div class="relative">
        <p class="text-xs font-semibold text-ebf-orange mb-1 uppercase tracking-wider">League Controller Panel</p>
        <h1 class="text-2xl font-black text-white">Welcome back 👋</h1>
        <p class="text-gray-500 text-sm mt-1">{{ auth.user?.email }}</p>
      </div>
    </div>

    <!-- Active Round Status -->
    <div v-if="league.activeRound" class="card p-5 border-ebf-orange/20">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span class="text-sm font-bold text-white">
              Round {{ league.activeRound.round_number }} — Active
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">Season {{ league.activeRound.season_year }}</p>
        </div>
        <RouterLink to="/admin/scores" class="btn-primary text-xs py-1.5 px-3">
          Enter Scores →
        </RouterLink>
      </div>
      <!-- Progress bar -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs text-gray-500">
          <span>Match completion</span>
          <span>{{ completedMatches }}/{{ totalMatches }} ({{ completionPct }}%)</span>
        </div>
        <div class="h-2 rounded-full bg-navy-700 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-ebf transition-all duration-500"
            :style="`width: ${completionPct}%`"
          />
        </div>
      </div>
    </div>

    <!-- No Active Round -->
    <div v-else class="card p-5 border-yellow-500/20 flex items-center gap-4">
      <div class="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-yellow-400">No active round</p>
        <p class="text-xs text-gray-500">Use Round Manager to activate a round, or create a new season.</p>
      </div>
    </div>

    <!-- Quick Action Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RouterLink
        v-for="card in adminCards" :key="card.to"
        :to="card.to"
        :class="['card p-5 flex items-start gap-4 bg-gradient-to-br border transition-all duration-200 group', card.color]"
      >
        <div :class="['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5', card.iconColor]">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="card.icon"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="font-bold text-white group-hover:text-ebf-orange transition-colors">{{ card.label }}</p>
          <p class="text-xs text-gray-500 mt-0.5 leading-snug">{{ card.desc }}</p>
        </div>
        <svg class="w-4 h-4 text-gray-600 ml-auto flex-shrink-0 group-hover:text-ebf-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </RouterLink>
    </div>
  </div>
</template>
