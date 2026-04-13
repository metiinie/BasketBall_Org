<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  match: { type: Object, default: null },
})
const emit = defineEmits(['save', 'close'])

const homeScore = ref(0)
const awayScore = ref(0)
const saving = ref(false)
const error = ref('')

// Sync fields when match prop changes
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
  const h = parseInt(homeScore.value)
  const a = parseInt(awayScore.value)
  if (isNaN(h) || isNaN(a)) return 'Both scores are required.'
  if (h < 0 || a < 0) return 'Scores cannot be negative.'
  if (h === a) return 'Basketball scores cannot be equal — overtime must be played.'
  if (h > 250 || a > 250) return 'Score seems unrealistically high. Please verify.'
  return ''
}

async function handleSave() {
  const validationError = validate()
  if (validationError) { error.value = validationError; return }
  saving.value = true
  error.value = ''
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

const fakePlayByPlay = [
  { time: '04:45', team: props.match?.home_team?.name || 'Home', desc: '#12 3-POINTER MADE', home: true },
  { time: '05:12', team: props.match?.away_team?.name || 'Away', desc: '#05 FREE THROW SUCCESSFUL', home: false }
]
</script>

<template>
  <Teleport to="body">
    <div v-if="match" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/90 backdrop-blur-sm p-4 overflow-y-auto" @click.self="emit('close')">
      
      <!-- Close Button Absolute -->
      <button @click="emit('close')" class="absolute top-8 right-8 w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors z-50">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <!-- Main Container wrapper -->
      <div class="w-full max-w-7xl animate-slide-up flex flex-col gap-10 py-10 relative">

        <!-- Top Overview header -->
        <div class="flex flex-col mb-4 px-4 text-center items-center">
          <p class="text-xs font-bold tracking-widest uppercase text-blue-600 mb-2">{{ match.venue || 'TBA LOCATION' }} • {{ match.match_date ? new Date(match.match_date).toLocaleDateString() : 'NO DATE' }}</p>
          <h1 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">SCORE ENTRY</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative">

          <!-- Left Column: HOME SQUAD -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center shadow-lg relative overflow-hidden group transition-all">

            <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 shadow-sm border border-slate-200 relative z-10">
              <span class="text-xl font-bold text-slate-600">{{ teamInitial(match.home_team) }}</span>
            </div>
            
            <p class="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1 relative z-10">Home Squad</p>
            <h2 class="text-2xl font-bold text-slate-900 text-center leading-tight mb-auto w-full relative z-10">{{ match.home_team?.name }}</h2>

            <div class="mt-16 flex flex-col items-center relative w-full z-10">
              <input v-model="homeScore" type="number" class="w-full bg-slate-50 border border-slate-200 rounded-2xl text-center text-7xl py-6 font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 tabular-nums transition-all" />
              
              <div class="flex justify-center gap-4 mt-6 w-full">
                <button @click="decreaseHome" class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-2xl font-semibold hover:bg-slate-200 active:scale-95 transition-all">−</button>
                <button @click="increaseHome" class="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md">+</button>
              </div>
            </div>
          </div>

          <!-- Middle Column: GAME PROGRESS -->
          <div class="flex flex-col gap-6 relative z-20 mt-12 lg:mt-0">
            <div class="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col shadow-lg relative">
              <h3 class="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-6">Game Progress</h3>
              
              <div class="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                <span class="text-xs font-bold text-slate-500">Period<br/>Selection</span>
                <div class="flex gap-2">
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer">1Q</span>
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer">2Q</span>
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer">3Q</span>
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-blue-600 shadow-md cursor-pointer">4Q</span>
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer">OT</span>
                </div>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-slate-500">Game Clock</span>
                <span class="text-3xl font-black text-slate-900 tabular-nums font-mono">FI:NAL</span>
              </div>
            </div>

            <!-- Play By Play mock -->
            <div class="flex-1 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-3 overflow-hidden shadow-lg pb-32">
              <div v-for="(play, i) in fakePlayByPlay" :key="i" class="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <span class="text-[10px] font-bold text-blue-600 pt-0.5">{{ play.time }}</span>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">{{ play.team }}</h4>
                  <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{{ play.desc }}</p>
                </div>
              </div>
            </div>

            <!-- Absolute Submit Button Overlaid between cards -->
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 z-30 flex flex-col items-center gap-3">
              <Transition name="fade">
                <div v-if="error" class="px-6 py-2 bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-full shadow-sm">
                  {{ error }}
                </div>
              </Transition>
              <button @click="handleSave" :disabled="saving" class="w-full py-4 rounded-full bg-blue-600 text-white text-sm font-bold tracking-widest uppercase transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed group">
                <span v-if="saving" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> SAVING...
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  SAVE MATCH RESULT
                </span>
              </button>
            </div>

          </div>

          <!-- Right Column: CHALLENGER SQUAD -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center shadow-lg relative overflow-hidden transition-all">

            <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 shadow-sm border border-slate-200 relative z-10">
              <span class="text-xl font-bold text-slate-600">{{ teamInitial(match.away_team) }}</span>
            </div>
            
            <p class="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1 relative z-10">Challenger</p>
            <h2 class="text-2xl font-bold text-slate-900 text-center leading-tight mb-auto w-full relative z-10">{{ match.away_team?.name }}</h2>

            <div class="mt-16 flex flex-col items-center relative w-full z-10">
              <input v-model="awayScore" type="number" class="w-full bg-slate-50 border border-slate-200 rounded-2xl text-center text-7xl py-6 font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 tabular-nums transition-all" />
              
              <div class="flex justify-center gap-4 mt-6 w-full">
                <button @click="decreaseAway" class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-2xl font-semibold hover:bg-slate-200 active:scale-95 transition-all">−</button>
                <button @click="increaseAway" class="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md">+</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
/* Remove native number input arrows */
input[type="number"]::-webkit-inner-spin-button, 
input[type="number"]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
