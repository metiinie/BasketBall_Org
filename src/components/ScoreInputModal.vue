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
      <div class="card w-full max-w-4xl animate-slide-up flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 flex items-center justify-between border-b" style="border-color: var(--border);">
          <div>
            <h2 class="text-base font-bold" style="color: var(--text-heading);">Official Score Entry</h2>
            <p class="text-[10px] uppercase font-bold tracking-widest mt-0.5" style="color: var(--text-muted);">
              {{ match.venue }} • {{ match.match_date ? new Date(match.match_date).toLocaleDateString() : '' }}
            </p>
          </div>
          <button @click="emit('close')" class="btn-icon">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <!-- Home -->
            <div class="md:col-span-5 flex flex-col items-center gap-6">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border shadow-sm"
                style="background-color: var(--bg-surface); border-color: var(--border);">
                <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
                <span v-else class="text-2xl font-bold" style="color: var(--text-muted);">{{ teamInitial(match.home_team) }}</span>
              </div>
              <div class="text-center">
                <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color: var(--text-muted);">Home Team</p>
                <h3 class="text-lg font-bold" style="color: var(--text-heading);">{{ match.home_team?.name }}</h3>
              </div>
              
              <div class="w-full space-y-4">
                <input v-model="homeScore" type="number" 
                  class="w-full rounded-xl text-center text-5xl font-bold py-6 outline-none transition-all"
                  style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
                />
                <div class="flex gap-2">
                  <button @click="decreaseHome" class="flex-1 btn-ghost py-3 text-xl">−</button>
                  <button @click="increaseHome" class="flex-1 btn-primary py-3 text-xl">+</button>
                </div>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="md:col-span-2 flex flex-col items-center gap-2">
              <div class="w-px h-12" style="background-color: var(--border);"></div>
              <span class="text-xs font-black text-slate-500 uppercase italic">VS</span>
              <div class="w-px h-12" style="background-color: var(--border);"></div>
            </div>

            <!-- Away -->
            <div class="md:col-span-5 flex flex-col items-center gap-6">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border shadow-sm"
                style="background-color: var(--bg-surface); border-color: var(--border);">
                <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
                <span v-else class="text-2xl font-bold" style="color: var(--text-muted);">{{ teamInitial(match.away_team) }}</span>
              </div>
              <div class="text-center">
                <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color: var(--text-muted);">Away Team</p>
                <h3 class="text-lg font-bold" style="color: var(--text-heading);">{{ match.away_team?.name }}</h3>
              </div>
              
              <div class="w-full space-y-4">
                <input v-model="awayScore" type="number" 
                  class="w-full rounded-xl text-center text-5xl font-bold py-6 outline-none transition-all"
                  style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
                />
                <div class="flex gap-2">
                  <button @click="decreaseAway" class="flex-1 btn-ghost py-3 text-xl">−</button>
                  <button @click="increaseAway" class="flex-1 btn-primary py-3 text-xl">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-5 border-t" style="background-color: var(--bg-surface); border-color: var(--border);">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-[10px] font-bold" style="color: var(--text-muted);">AUTHORITY: EBF SEASON OFFICIAL</p>
            <div class="flex items-center gap-3 w-full md:w-auto">
              <button @click="emit('close')" class="flex-1 md:flex-none btn-ghost px-6">Cancel</button>
              <button @click="handleSave" :disabled="saving" class="flex-1 md:flex-none btn-primary px-8">
                {{ saving ? 'Saving…' : 'Apply Final Score' }}
              </button>
            </div>
          </div>
          <p v-if="error" class="mt-3 text-center text-xs font-bold text-red-500">{{ error }}</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
</style>
