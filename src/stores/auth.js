import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  /** Initialize auth state from current session and listen for changes */
  async function initAuth() {
    loading.value = true
    try {
      const { data } = await supabase.auth.getSession()
      user.value = data.session?.user ?? null
    } finally {
      loading.value = false
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  /** Sign in with email/password */
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    return data.user
  }

  /** Sign out the current user */
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  return { user, loading, isAuthenticated, initAuth, signIn, signOut }
})
