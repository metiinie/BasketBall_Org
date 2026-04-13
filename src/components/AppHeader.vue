<script setup>
import { ref, onMounted } from 'vue'

const isDarkMode = ref(false)

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('ebf-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('ebf-theme', 'light')
  }
}

onMounted(() => {
  if (localStorage.getItem('ebf-theme') === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <header class="h-20 flex items-center justify-between px-8 border-b border-slate-200 bg-white">
    <!-- Context / Top Nav Area -->
    <div class="flex items-center space-x-6">
      <RouterLink to="/" class="text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block hover:text-blue-600 cursor-pointer transition-colors">Standings</RouterLink>
      <RouterLink to="/matches" class="text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block hover:text-blue-600 cursor-pointer transition-colors">Matches</RouterLink>
    </div>

    <!-- Actions / Toggles -->
    <div class="flex items-center space-x-5">
      <!-- Dark mode toggle -->
      <button @click="toggleTheme" class="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all" title="Toggle Theme">
        <svg v-if="!isDarkMode" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>

      <!-- Simple Auth profile placeholder -->
      <div class="w-10 h-10 rounded-full border-2 border-slate-200 p-0.5">
        <div class="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-900">
          <svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
        </div>
      </div>
    </div>
  </header>
</template>
