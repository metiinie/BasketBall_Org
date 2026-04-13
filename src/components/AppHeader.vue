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
  isDarkMode.value = localStorage.getItem('ebf-theme') === 'dark'
  if (isDarkMode.value) document.documentElement.classList.add('dark')
})
</script>

<template>
  <header
    class="h-16 flex items-center justify-between px-6 border-b transition-colors duration-300"
    style="background-color: var(--bg-card); border-color: var(--border);"
  >
    <!-- Nav Links -->
    <div class="flex items-center gap-6">
      <RouterLink
        to="/"
        class="text-xs font-bold uppercase tracking-widest hidden md:inline-block transition-colors"
        style="color: var(--text-muted);"
        active-class="!text-blue-500"
      >Standings</RouterLink>
      <RouterLink
        to="/matches"
        class="text-xs font-bold uppercase tracking-widest hidden md:inline-block transition-colors"
        style="color: var(--text-muted);"
        active-class="!text-blue-500"
      >Matches</RouterLink>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-3">

      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="btn-icon w-9 h-9"
        :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <!-- Moon (show when light → can switch to dark) -->
        <svg v-if="!isDarkMode" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
        <!-- Sun (show when dark → can switch to light) -->
        <svg v-else class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      </button>

      <!-- Avatar -->
      <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background-color: var(--bg-surface); border: 1px solid var(--border);">
        <svg class="w-4 h-4" style="color: var(--text-muted);" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        </svg>
      </div>
    </div>
  </header>
</template>
