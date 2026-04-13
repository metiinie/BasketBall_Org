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
  if (h === a) return 'Basketball games must end with a winner (Overtime Rule).'
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
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md"
      style="background-color: rgba(10, 15, 30, 0.85);"
      @click.self="emit('close')"
    >
      
      <!-- Premium Score Panel -->
      <div class="w-full max-w-5xl animate-fade-in relative">
        
        <!-- Action Header -->
        <div class="flex items-center justify-between mb-8 px-4">
          <div>
            <span class="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Live Result Logging</span>
            <p class="text-[9px] font-bold text-slate-500 mt-1 uppercase">{{ match.venue || 'Neutral Court' }} • {{ match.match_date ? new Date(match.match_date).toLocaleDateString() : 'Active Session' }}</p>
          </div>
          <button @click="emit('close')" class="w-12 h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-white transition-all border border-slate-700/50 active:scale-90">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          <!-- Home Section -->
          <div class="lg:col-span-4 card p-8 rounded-[40px] flex flex-col items-center justify-between border-2 transition-all border-slate-800 hover:border-blue-500/20">
            <div class="text-center">
              <div class="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-2xl font-black border-2 mx-auto"
                style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-heading);">
                <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover rounded-3xl"/>
                <span v-else>{{ teamInitial(match.home_team) }}</span>
              </div>
              <h2 class="text-xl font-black tracking-tight" style="color: var(--text-heading);">{{ match.home_team?.name }}</h2>
              <p class="text-[10px] font-bold tracking-widest text-blue-500 uppercase mt-2">Home Team</p>
            </div>

            <div class="w-full mt-10 space-y-6">
              <div class="relative group">
                <input v-model="homeScore" type="number" 
                  class="w-full bg-slate-900/50 border-2 rounded-[32px] text-center text-8xl font-black tabular-nums py-10 outline-none transition-all"
                  style="border-color: var(--border); color: var(--text-primary);"
                  @focus="$event.target.style.borderColor = '#3b82f6'; $event.target.style.boxShadow = '0 0 40px rgba(59,130,246,0.15)'"
                  @blur="$event.target.style.borderColor = 'var(--border)'; $event.target.style.boxShadow = 'none'"
                />
              </div>

              <div class="flex gap-4">
                <button @click="decreaseHome" class="flex-1 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-3xl transition-all border border-slate-700 active:scale-95" style="color: var(--text-secondary);">−</button>
                <button @click="increaseHome" class="flex-1 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-3xl text-white transition-all shadow-xl shadow-blue-600/30 active:scale-95">+</button>
              </div>
            </div>
          </div>

          <!-- Center Stats / Global Control -->
          <div class="lg:col-span-4 flex flex-col gap-6">
            
            <!-- Game Status Display -->
            <div class="card p-8 rounded-[40px] border-2 border-slate-800 flex flex-col items-center justify-center text-center">
              <span class="text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase mb-4">Official Status</span>
              <div class="flex items-center gap-3">
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-sm font-black tracking-widest text-white uppercase italic">Active Match</span>
              </div>
              <div class="mt-8 pt-8 border-t border-slate-800 w-full space-y-2">
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Clock</p>
                <p class="text-4xl font-mono font-black text-blue-500 tracking-tighter">FI:NAL</p>
              </div>
            </div>

            <!-- Action Button Area -->
            <div class="flex-1 flex flex-col justify-end space-y-4">
              <Transition name="fade">
                <div v-if="error" class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black text-center uppercase tracking-wider">
                  {{ error }}
                </div>
              </Transition>
              
              <button @click="handleSave" :disabled="saving"
                class="w-full py-6 rounded-[32px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-[0.2em] uppercase transition-all shadow-2xl shadow-blue-600/40 hover:-translate-y-1 active:translate-y-0 disabled:opacity-40">
                <span v-if="saving">Synchronizing Record…</span>
                <span v-else>Apply Final Score</span>
              </button>

              <p class="text-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">Authority: EBF Season Official</p>
            </div>
          </div>

          <!-- Away Section -->
          <div class="lg:col-span-4 card p-8 rounded-[40px] flex flex-col items-center justify-between border-2 transition-all border-slate-800 hover:border-blue-500/20">
            <div class="text-center">
              <div class="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-2xl font-black border-2 mx-auto"
                style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-heading);">
                <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover rounded-3xl"/>
                <span v-else>{{ teamInitial(match.away_team) }}</span>
              </div>
              <h2 class="text-xl font-black tracking-tight" style="color: var(--text-heading);">{{ match.away_team?.name }}</h2>
              <p class="text-[10px] font-bold tracking-widest text-slate-500 uppercase mt-2">Challenger</p>
            </div>

            <div class="w-full mt-10 space-y-6">
              <div class="relative group">
                <input v-model="awayScore" type="number" 
                  class="w-full bg-slate-900/50 border-2 rounded-[32px] text-center text-8xl font-black tabular-nums py-10 outline-none transition-all"
                  style="border-color: var(--border); color: var(--text-primary);"
                  @focus="$event.target.style.borderColor = '#3b82f6'; $event.target.style.boxShadow = '0 0 40px rgba(59,130,246,0.15)'"
                  @blur="$event.target.style.borderColor = 'var(--border)'; $event.target.style.boxShadow = 'none'"
                />
              </div>

              <div class="flex gap-4">
                <button @click="decreaseAway" class="flex-1 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-3xl transition-all border border-slate-700 active:scale-95" style="color: var(--text-secondary);">−</button>
                <button @click="increaseAway" class="flex-1 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-3xl text-white transition-all shadow-xl shadow-blue-600/30 active:scale-95">+</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
</style>
