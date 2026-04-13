<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ match: { type: Object, default: null } })
const emit = defineEmits(['save', 'close'])

const homeScore = ref(0)
const awayScore = ref(0)
const saving = ref(false)
const error = ref('')

watch(() => props.match, (m) => {
  if (m) {
    homeScore.value = m.home_score ?? 0
    awayScore.value = m.away_score ?? 0
    error.value = ''
  }
}, { immediate: true })

function increaseHome() { homeScore.value = parseInt(homeScore.value || 0) + 1 }
function decreaseHome() { homeScore.value = Math.max(0, parseInt(homeScore.value || 0) - 1) }
function increaseAway() { awayScore.value = parseInt(awayScore.value || 0) + 1 }
function decreaseAway() { awayScore.value = Math.max(0, parseInt(awayScore.value || 0) - 1) }

function validate() {
  const h = parseInt(homeScore.value), a = parseInt(awayScore.value)
  if (isNaN(h) || isNaN(a)) return 'Both scores required.'
  if (h < 0 || a < 0) return 'Negative scores invalid.'
  if (h === a) return 'Basketball games must have a winner.'
  return ''
}

async function handleSave() {
  const vErr = validate()
  if (vErr) { error.value = vErr; return }
  saving.value = true
  try {
    await emit('save', {
      matchId: props.match.id,
      homeScore: parseInt(homeScore.value),
      awayScore: parseInt(awayScore.value),
    })
  } finally {
    saving.value = false
  }
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="match"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      style="background-color: rgba(15,23,42,0.75);"
      @click.self="emit('close')"
    >
      <!-- Smaller, Compact Container -->
      <div class="card w-full max-w-2xl animate-slide-up flex flex-col overflow-hidden">
        
        <!-- Compact Header -->
        <div class="px-5 py-3.5 flex items-center justify-between border-b" style="border-color: var(--border);">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold" style="color: var(--text-heading);">Log Official Score</h2>
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">• {{ match.venue || 'Neutral' }}</span>
          </div>
          <button @click="emit('close')" class="btn-icon w-8 h-8">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6">
          <div class="flex flex-col md:flex-row items-center gap-6 justify-between">
            
            <!-- Home Team -->
            <div class="flex-1 w-full flex flex-col items-center gap-3">
              <div class="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden"
                style="background-color: var(--bg-surface); border-color: var(--border);">
                <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
                <span v-else class="text-xl font-bold" style="color: var(--text-muted);">{{ teamInitial(match.home_team) }}</span>
              </div>
              <h3 class="text-sm font-bold text-center leading-tight h-8 flex items-center" style="color: var(--text-heading);">{{ match.home_team?.name }}</h3>
              
              <div class="w-full space-y-3">
                <input v-model="homeScore" type="number" 
                  class="w-full rounded-lg text-center text-4xl font-bold py-3 outline-none transition-all"
                  style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
                />
                <div class="flex gap-1.5">
                  <button @click="decreaseHome" class="flex-1 btn-ghost py-2 text-lg">−</button>
                  <button @click="increaseHome" class="flex-1 btn-primary py-2 text-lg">+</button>
                </div>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="flex flex-col items-center gap-1 opacity-20">
              <span class="text-[10px] font-bold italic tracking-widest px-4">VS</span>
            </div>

            <!-- Away Team -->
            <div class="flex-1 w-full flex flex-col items-center gap-3">
              <div class="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden"
                style="background-color: var(--bg-surface); border-color: var(--border);">
                <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
                <span v-else class="text-xl font-bold" style="color: var(--text-muted);">{{ teamInitial(match.away_team) }}</span>
              </div>
              <h3 class="text-sm font-bold text-center leading-tight h-8 flex items-center" style="color: var(--text-heading);">{{ match.away_team?.name }}</h3>
              
              <div class="w-full space-y-3">
                <input v-model="awayScore" type="number" 
                  class="w-full rounded-lg text-center text-4xl font-bold py-3 outline-none transition-all"
                  style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
                />
                <div class="flex gap-1.5">
                  <button @click="decreaseAway" class="flex-1 btn-ghost py-2 text-lg">−</button>
                  <button @click="increaseAway" class="flex-1 btn-primary py-2 text-lg">+</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Compact Footer -->
        <div class="px-5 py-4 border-t flex flex-col md:flex-row items-center justify-between gap-4" 
             style="background-color: var(--bg-surface); border-color: var(--border);">
          <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Authority Verification: Required</span>
          <div class="flex items-center gap-2 w-full md:w-auto">
            <button @click="emit('close')" class="flex-1 md:flex-none btn-ghost text-xs px-5 py-2">Cancel</button>
            <button @click="handleSave" :disabled="saving" class="flex-1 md:flex-none btn-primary text-xs px-6 py-2">
              {{ saving ? 'Syncing...' : 'Confirm Score' }}
            </button>
          </div>
        </div>
        
        <p v-if="error" class="bg-red-500 text-white text-[10px] font-bold py-1 px-4 text-center uppercase tracking-widest">{{ error }}</p>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
</style>
