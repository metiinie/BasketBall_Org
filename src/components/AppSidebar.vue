<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

async function handleSignOut() {
  await authStore.signOut()
  router.push({ name: 'standings' })
}

const navLinks = computed(() => {
  if (authStore.isAuthenticated) {
    return [
      { name: 'Dashboard', to: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { name: 'Schedule Matches', to: '/admin/scheduler', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Score Entry', to: '/admin/scores', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { name: 'Round Manager', to: '/admin/rounds', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      { name: 'Team Manager', to: '/admin/teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    ]
  } else {
    return [
      { name: 'Standings', to: '/', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Matches', to: '/matches', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ]
  }
})
</script>

<template>
  <aside class="hidden md:flex w-64 bg-white flex-shrink-0 border-r border-slate-200 flex-col min-h-screen">
    <!-- Logo Area -->
    <div class="h-20 flex items-center px-6 border-b border-slate-100">
      <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30 mr-3">
        <svg viewBox="0 0 32 32" class="w-5 h-5 fill-white">
          <circle cx="16" cy="16" r="12" fill="none" stroke="white" stroke-width="1.5"/>
          <path d="M16 4 Q21 10 21 16 Q21 22 16 28" stroke="white" stroke-width="1.5" fill="none"/>
          <path d="M16 4 Q11 10 11 16 Q11 22 16 28" stroke="white" stroke-width="1.5" fill="none"/>
          <line x1="4" y1="16" x2="28" y2="16" stroke="white" stroke-width="1.5"/>
        </svg>
      </div>
      <div>
        <h1 class="text-slate-900 font-black text-lg tracking-wider leading-none">EBF LEAGUE</h1>
        <p class="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-1">Management Console</p>
      </div>
    </div>

    <!-- Navigation Area -->
    <nav class="flex-1 px-4 py-6 space-y-2">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group"
        :class="[
          route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to))
            ? 'bg-blue-50 text-blue-600'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        ]"
      >
        <svg class="w-5 h-5 transition-colors" :class="[
          route.path === link.to || (link.to !== '/' && route.path.startsWith(link.to)) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
        ]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
        </svg>
        <span class="font-medium text-sm">{{ link.name }}</span>
      </RouterLink>
    </nav>

    <!-- Bottom Action Area -->
    <div class="px-4 pb-6 space-y-4">
      <div v-if="!authStore.isAuthenticated" class="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 class="text-xs font-bold text-slate-900 mb-1">ADMIN ACCESS</h4>
        <p class="text-[10px] text-slate-500 mb-3 leading-tight">Login to manage teams, matches, and enter scores.</p>
        <RouterLink to="/login" class="block w-full py-2 bg-blue-600 text-white text-xs font-bold text-center rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
          LOGIN
        </RouterLink>
      </div>

      <button v-if="authStore.isAuthenticated" @click="handleSignOut" class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group">
        <svg class="w-5 h-5 text-slate-400 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="font-medium text-sm">Logout</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Scoped adjustments if any */
</style>
