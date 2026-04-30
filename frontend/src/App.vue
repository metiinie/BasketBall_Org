<script setup>
import { RouterView } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()
const isMenuOpen = ref(false)

const isUrlMissing = ref(
  !import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co'
)
const isKeyMissing = ref(!import.meta.env.VITE_SUPABASE_ANON_KEY)
const isConfigMissing = ref(isUrlMissing.value || isKeyMissing.value)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

// Close menu when route changes
watch(() => route.path, () => {
  isMenuOpen.value = false
})

onMounted(() => {
  authStore.initAuth()
  // Restore saved theme on app boot
  const saved = localStorage.getItem('ebf-theme')
  if (saved === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col md:flex-row w-full overflow-hidden transition-colors duration-300"
    style="background-color: var(--bg-app); color: var(--text-primary);"
  >
    <!-- Mobile Backdrop — only shown when sidebar is open (admin only) -->
    <Transition name="fade">
      <div 
        v-if="isMenuOpen && authStore.isAuthenticated" 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        @click="isMenuOpen = false"
      ></div>
    </Transition>

    <div v-if="isConfigMissing" class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1b2a] p-4 text-white">
      <div class="max-w-md w-full bg-[#162534] rounded-2xl p-8 border border-red-500/30 shadow-2xl text-center">
        <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold mb-4">Configuration Error</h1>
        <p class="text-gray-400 mb-8 leading-relaxed">
          The Supabase environment variables are missing. If this is a production deployment, please add <code class="text-blue-400">VITE_SUPABASE_URL</code> and <code class="text-blue-400">VITE_SUPABASE_ANON_KEY</code> to your Vercel settings.
        </p>
        <div class="bg-black/30 rounded-lg p-4 text-left text-sm font-mono mb-8 border border-white/5 overflow-x-auto">
          <div class="text-blue-300"># Missing Keys:</div>
          <div v-if="isUrlMissing" class="text-red-400">- VITE_SUPABASE_URL</div>
          <div v-if="isKeyMissing" class="text-red-400">- VITE_SUPABASE_ANON_KEY</div>
        </div>
        <button 
          @click="window.location.reload()"
          class="w-full py-3 px-4 bg-white/10 hover:bg-white/20 transition-colors rounded-xl font-semibold border border-white/10"
        >
          Check Again
        </button>
      </div>
    </div>

    <AppSidebar 
      v-if="authStore.isAuthenticated && !isConfigMissing"
      :is-open="isMenuOpen" 
      @close="isMenuOpen = false" 
    />

    <div v-if="!isConfigMissing" class="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
      <AppHeader @toggle-menu="toggleMenu" />
      <main class="flex-1 p-2 sm:p-6 lg:p-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style>
.page-enter-active, .page-leave-active { transition: all 0.15s ease-out; }
.page-enter-from  { opacity: 0; transform: translateY(4px); }
.page-leave-to    { opacity: 0; transform: translateY(-4px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
