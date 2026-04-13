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
  if (h === a) return 'Basketball games must have a winner (Overtime Rule).'
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
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300"
      style="background-color: rgba(10, 15, 30, 0.8);"
      @click.self="emit('close')"
    >
      <div class="card w-full max-w-4xl animate-slide-up flex flex-col relative overflow-hidden rounded-[2rem] border-0 shadow-2xl">
        
        <!-- Subtle Animated Ambient Glow -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none animate-pulse"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 blur-[100px] pointer-events-none animate-pulse"></div>

        <!-- Header -->
        <div class="px-8 py-6 flex items-center justify-between border-b relative z-10" style="border-color: var(--border);">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <div>
              <h2 class="text-lg font-bold tracking-tight" style="color: var(--text-heading);">Live Score Submission</h2>
              <p class="text-[10px] font-bold uppercase tracking-[0.2em]" style="color: var(--text-muted);">
                {{ match.venue }} • Official Session Log
              </p>
            </div>
          </div>
          <button @click="emit('close')" class="btn-icon w-10 h-10 rounded-xl hover:rotate-90 transition-transform">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-10 relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            
            <!-- Home Team Block -->
            <div class="md:col-span-4 flex flex-col items-center gap-8">
              <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-20 group-hover:opacity-40 transition-opacity blur-sm"></div>
                <div class="w-28 h-28 rounded-[2.2rem] flex items-center justify-center overflow-hidden border-4 relative"
                  style="background-color: var(--bg-card); border-color: var(--bg-surface);">
                  <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
                  <span v-else class="text-3xl font-black" style="color: var(--text-muted);">{{ teamInitial(match.home_team) }}</span>
                </div>
              </div>

              <div class="text-center space-y-1">
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Home Squad</span>
                <h3 class="text-xl font-black tracking-tight" style="color: var(--text-heading);">{{ match.home_team?.name }}</h3>
              </div>
              
              <div class="w-full space-y-6">
                <!-- Score Display -->
                <div class="relative px-4">
                  <input v-model="homeScore" type="number" 
                    class="w-full rounded-[2rem] text-center text-6xl font-black py-8 bg-slate-900/40 border-2 border-transparent focus:border-blue-500/50 outline-none transition-all tabular-nums"
                    style="color: var(--text-primary); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"
                  />
                </div>
                <!-- Control Buttons -->
                <div class="flex gap-4 px-2">
                  <button @click="decreaseHome" class="flex-1 h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-3xl font-light transition-all border border-slate-700/30 active:scale-95 text-white">−</button>
                  <button @click="increaseHome" class="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-3xl font-light text-white transition-all shadow-lg shadow-blue-600/30 active:scale-95">+</button>
                </div>
              </div>
            </div>

            <!-- VS Visual Divider -->
            <div class="md:col-span-3 flex flex-col items-center justify-center gap-4 py-8">
              <div class="flex flex-col items-center gap-4 px-6 py-10 rounded-full border border-dashed border-slate-700/50">
                <div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-[.5em] rotate-90 my-2">VERSUS</span>
                <div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              </div>
            </div>

            <!-- Away Team Block -->
            <div class="md:col-span-4 flex flex-col items-center gap-8">
              <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-[2.5rem] opacity-20 group-hover:opacity-40 transition-opacity blur-sm"></div>
                <div class="w-28 h-28 rounded-[2.2rem] flex items-center justify-center overflow-hidden border-4 relative"
                  style="background-color: var(--bg-card); border-color: var(--bg-surface);">
                  <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
                  <span v-else class="text-3xl font-black" style="color: var(--text-muted);">{{ teamInitial(match.away_team) }}</span>
                </div>
              </div>

              <div class="text-center space-y-1">
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Challenger</span>
                <h3 class="text-xl font-black tracking-tight" style="color: var(--text-heading);">{{ match.away_team?.name }}</h3>
              </div>
              
              <div class="w-full space-y-6">
                <!-- Score Display -->
                <div class="relative px-4">
                  <input v-model="awayScore" type="number" 
                    class="w-full rounded-[2rem] text-center text-6xl font-black py-8 bg-slate-900/40 border-2 border-transparent focus:border-blue-500/50 outline-none transition-all tabular-nums"
                    style="color: var(--text-primary); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"
                  />
                </div>
                <!-- Control Buttons -->
                <div class="flex gap-4 px-2">
                  <button @click="decreaseAway" class="flex-1 h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 text-3xl font-light transition-all border border-slate-700/30 active:scale-95 text-white">−</button>
                  <button @click="increaseAway" class="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-3xl font-light text-white transition-all shadow-lg shadow-blue-600/30 active:scale-95">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-8 py-8 border-t relative z-10" style="background-color: var(--bg-surface); border-color: var(--border);">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <p class="text-[10px] font-bold uppercase tracking-widest leading-none" style="color: var(--text-muted);">Secure Official Data Sync Active</p>
            </div>
            
            <div class="flex items-center gap-4 w-full md:w-auto">
              <button @click="emit('close')" class="flex-1 md:flex-none btn-ghost px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all">Discard</button>
              <button @click="handleSave" :disabled="saving" 
                class="flex-1 md:flex-none btn-primary px-12 py-4 rounded-2xl font-bold uppercase tracking-[0.1em] text-[11px] shadow-xl shadow-blue-600/30 hover:-translate-y-1 active:translate-y-0 transition-all">
                {{ saving ? 'Processing…' : 'Finalize Official Score' }}
              </button>
            </div>
          </div>
          <Transition name="fade">
            <p v-if="error" class="mt-4 text-center text-[10px] font-bold text-red-500 uppercase tracking-widest">{{ error }}</p>
          </Transition>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }

/* Custom animate-slide-up enhancement */
.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
