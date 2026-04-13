<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.signIn(email.value.trim(), password.value)
    const redirect = route.query.redirect || '/admin'
    router.push(redirect)
  } catch (e) {
    error.value = e.message || 'Invalid credentials. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 -left-32 w-96 h-96 bg-ebf-orange/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-ebf-orange/5 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-sm animate-slide-up">
      <!-- Logo + Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-ebf shadow-xl shadow-ebf-orange/30 mb-4 animate-pulse-glow">
          <svg viewBox="0 0 64 64" class="w-9 h-9" fill="none" stroke="white" stroke-width="2.5">
            <circle cx="32" cy="32" r="20"/>
            <path d="M32 12 Q40 22 40 32 Q40 42 32 52"/>
            <path d="M32 12 Q24 22 24 32 Q24 42 32 52"/>
            <line x1="12" y1="32" x2="52" y2="32"/>
          </svg>
        </div>
        <h1 class="text-2xl font-black text-white">League Controller</h1>
        <p class="text-gray-500 text-sm mt-1">Sign in to manage the EBF League</p>
      </div>

      <!-- Glass Card -->
      <form @submit.prevent="handleLogin" class="card p-6 backdrop-blur-xl space-y-5">
        <!-- Error Alert -->
        <Transition name="fade">
          <div v-if="error"
            class="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30">
            <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>
        </Transition>

        <!-- Email -->
        <div>
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
          <input v-model="email" type="email" placeholder="controller@ebf.et"
            class="input-field" @keyup.enter="$refs.pwInput.focus()" />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
          <div class="relative">
            <input ref="pwInput" v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-field pr-11" />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button type="submit" :disabled="loading" class="btn-primary w-full py-3">
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Signing in...
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="text-center text-xs text-gray-600 mt-6">
        Public viewer?
        <RouterLink to="/" class="text-ebf-orange hover:underline">View Standings →</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
