<script setup>
import { ref, watch, computed } from 'vue'

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
  { time: '04:45', team: props.match?.home_team?.name || 'Home', desc: '#12 3-POINTER MADE' },
  { time: '05:12', team: props.match?.away_team?.name || 'Away', desc: '#05 FREE THROW SUCCESSFUL' },
]
</script>

<template>
  <Teleport to="body">
    <div v-if="match"
      class="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto"
      style="background-color: rgba(15,23,42,0.75);"
      @click.self="emit('close')"
    >
      <!-- Close -->
      <button @click="emit('close')"
        class="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all z-50 btn-icon">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Modal Container -->
      <div class="w-full max-w-5xl animate-slide-up flex flex-col gap-6 py-8 relative">

        <!-- Header -->
        <div class="text-center">
          <p class="text-xs font-bold tracking-widest uppercase text-blue-500 mb-2">
            {{ match.venue || 'TBA' }} • {{ match.match_date ? new Date(match.match_date).toLocaleDateString() : 'No Date' }}
          </p>
          <h1 class="text-3xl md:text-4xl font-black tracking-tight leading-none" style="color: var(--text-heading);">Score Entry</h1>
        </div>

        <!-- Score Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- Home Team -->
          <div class="card p-6 flex flex-col items-center rounded-2xl">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-xl font-bold"
              style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-secondary);">
              {{ teamInitial(match.home_team) }}
            </div>
            <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color: var(--text-muted);">Home Squad</p>
            <h2 class="text-lg font-bold text-center mb-6" style="color: var(--text-heading);">{{ match.home_team?.name }}</h2>

            <input v-model="homeScore" type="number"
              class="w-full rounded-2xl text-center text-6xl py-5 font-black tabular-nums transition-all outline-none"
              style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
              @focus="$event.target.style.borderColor = 'var(--border-focus)'; $event.target.style.boxShadow = 'var(--ring-focus)'"
              @blur="$event.target.style.borderColor = 'var(--border)'; $event.target.style.boxShadow = 'none'"
            />
            <div class="flex justify-center gap-4 mt-4 w-full">
              <button @click="decreaseHome"
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-semibold transition-all active:scale-95"
                style="background-color: var(--bg-surface); color: var(--text-secondary);">−</button>
              <button @click="increaseHome"
                class="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold shadow-md shadow-blue-600/30 transition-all active:scale-95">+</button>
            </div>
          </div>

          <!-- Middle: Game Info + Submit -->
          <div class="flex flex-col gap-4">

            <!-- Game Progress -->
            <div class="card p-5 rounded-2xl flex-shrink-0">
              <h3 class="text-[10px] font-bold uppercase tracking-widest mb-4" style="color: var(--text-muted);">Game Progress</h3>
              <div class="flex items-center justify-between mb-4 pb-4" style="border-bottom: 1px solid var(--border);">
                <span class="text-xs font-semibold" style="color: var(--text-muted);">Period</span>
                <div class="flex gap-1.5">
                  <span v-for="q in ['1Q','2Q','3Q','OT']" :key="q"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all"
                    style="background-color: var(--bg-surface); color: var(--text-muted);">{{ q }}</span>
                  <span class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">4Q</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold" style="color: var(--text-muted);">Game Clock</span>
                <span class="text-2xl font-black tabular-nums font-mono" style="color: var(--text-primary);">FI:NAL</span>
              </div>
            </div>

            <!-- Play by Play -->
            <div class="card p-5 rounded-2xl flex-1 space-y-2">
              <h3 class="text-[10px] font-bold uppercase tracking-widest mb-3" style="color: var(--text-muted);">Play by Play</h3>
              <div v-for="(play, i) in fakePlayByPlay" :key="i"
                class="p-3 rounded-xl flex items-start gap-3"
                style="background-color: var(--bg-surface);">
                <span class="text-[10px] font-bold text-blue-500 pt-0.5 flex-shrink-0">{{ play.time }}</span>
                <div>
                  <h4 class="text-xs font-bold" style="color: var(--text-primary);">{{ play.team }}</h4>
                  <p class="text-[9px] font-bold uppercase tracking-widest mt-0.5" style="color: var(--text-muted);">{{ play.desc }}</p>
                </div>
              </div>
            </div>

            <!-- Submit -->
            <div class="flex flex-col gap-2">
              <Transition name="fade">
                <div v-if="error" class="px-4 py-2 rounded-full text-xs font-bold text-center bg-red-500/10 border border-red-500/30 text-red-400">
                  {{ error }}
                </div>
              </Transition>
              <button @click="handleSave" :disabled="saving"
                class="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold tracking-widest uppercase transition-all shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="saving" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Saving…
                </span>
                <span v-else>Save Match Result</span>
              </button>
            </div>
          </div>

          <!-- Away Team -->
          <div class="card p-6 flex flex-col items-center rounded-2xl">
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-xl font-bold"
              style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-secondary);">
              {{ teamInitial(match.away_team) }}
            </div>
            <p class="text-[10px] font-bold uppercase tracking-widest mb-1" style="color: var(--text-muted);">Challenger</p>
            <h2 class="text-lg font-bold text-center mb-6" style="color: var(--text-heading);">{{ match.away_team?.name }}</h2>

            <input v-model="awayScore" type="number"
              class="w-full rounded-2xl text-center text-6xl py-5 font-black tabular-nums transition-all outline-none"
              style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-primary);"
              @focus="$event.target.style.borderColor = 'var(--border-focus)'; $event.target.style.boxShadow = 'var(--ring-focus)'"
              @blur="$event.target.style.borderColor = 'var(--border)'; $event.target.style.boxShadow = 'none'"
            />
            <div class="flex justify-center gap-4 mt-4 w-full">
              <button @click="decreaseAway"
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-semibold transition-all active:scale-95"
                style="background-color: var(--bg-surface); color: var(--text-secondary);">−</button>
              <button @click="increaseAway"
                class="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold shadow-md shadow-blue-600/30 transition-all active:scale-95">+</button>
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
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
</style>
