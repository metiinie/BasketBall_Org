<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

async function handleSignOut() {
  await authStore.signOut()
  router.push({ name: 'standings' })
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-navy-700/60">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-ebf flex items-center justify-center shadow-lg shadow-ebf-orange/30 group-hover:shadow-ebf-orange/50 transition-shadow">
            <svg viewBox="0 0 32 32" class="w-5 h-5 fill-white">
              <circle cx="16" cy="16" r="12" fill="none" stroke="white" stroke-width="1.5"/>
              <path d="M16 4 Q21 10 21 16 Q21 22 16 28" stroke="white" stroke-width="1.5" fill="none"/>
              <path d="M16 4 Q11 10 11 16 Q11 22 16 28" stroke="white" stroke-width="1.5" fill="none"/>
              <line x1="4" y1="16" x2="28" y2="16" stroke="white" stroke-width="1.5"/>
            </svg>
          </div>
          <div>
            <span class="font-bold text-white text-sm leading-none">EBF League</span>
            <span class="block text-xs text-gray-500 leading-none">Management System</span>
          </div>
        </RouterLink>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="link in publicLinks" :key="link.to"
            :to="link.to"
            class="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-navy-700/60 transition-all duration-200"
            active-class="text-white bg-navy-700/80"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <!-- Auth Controls -->
        <div class="hidden md:flex items-center gap-3">
          <template v-if="authStore.isAuthenticated">
            <RouterLink to="/admin"
              class="px-4 py-2 rounded-xl text-sm font-medium text-ebf-orange hover:bg-ebf-orange/10 transition-all">
              Admin Panel
            </RouterLink>
            <button @click="handleSignOut"
              class="btn-ghost text-sm py-2 px-4">
              Sign Out
            </button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="btn-primary text-sm py-2 px-5">
              Controller Login
            </RouterLink>
          </template>
        </div>

        <!-- Mobile menu toggle -->
        <button @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-navy-700/60 transition-all">
          <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <Transition name="slide-down">
        <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-navy-700/60 pt-3 space-y-1">
          <RouterLink v-for="link in publicLinks" :key="link.to" :to="link.to"
            @click="mobileMenuOpen = false"
            class="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-navy-700/60 transition-all"
            active-class="text-white bg-navy-700/80">
            {{ link.label }}
          </RouterLink>
          <div class="pt-2 border-t border-navy-700/60 mt-2">
            <template v-if="authStore.isAuthenticated">
              <RouterLink to="/admin" @click="mobileMenuOpen = false"
                class="block px-4 py-2.5 rounded-xl text-sm font-medium text-ebf-orange">
                Admin Panel
              </RouterLink>
              <button @click="handleSignOut; mobileMenuOpen = false"
                class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white">
                Sign Out
              </button>
            </template>
            <RouterLink v-else to="/login" @click="mobileMenuOpen = false"
              class="block px-4 py-2.5 rounded-xl text-sm font-semibold text-center bg-gradient-ebf text-white rounded-xl">
              Controller Login
            </RouterLink>
          </div>
        </div>
      </Transition>
    </div>
  </header>
</template>

<script>
export default {
  data: () => ({
    publicLinks: [
      { to: '/', label: 'Standings' },
      { to: '/matches', label: 'Matches' },
    ],
  }),
}
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
