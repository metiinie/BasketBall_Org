<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()

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
    <AppSidebar />
    <div class="flex-1 flex flex-col h-screen overflow-y-auto w-full">
      <AppHeader />
      <main class="flex-1 p-6 lg:p-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style>
.page-enter-active, .page-leave-active { transition: all 0.25s ease; }
.page-enter-from  { opacity: 0; transform: translateY( 10px); }
.page-leave-to    { opacity: 0; transform: translateY(-10px); }
</style>
