<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
onMounted(() => authStore.initAuth())
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-navy">
    <AppNavbar />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <footer class="border-t border-navy-700/40 py-4 text-center text-xs text-gray-600">
      EBF League Management System &copy; {{ new Date().getFullYear() }} — Ethiopian Basketball Federation
    </footer>
  </div>
</template>


