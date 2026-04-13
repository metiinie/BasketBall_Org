<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  match: { type: Object, default: null },
})
const emit = defineEmits(['save', 'close'])

const homeScore = ref('')
const awayScore = ref('')
const saving = ref(false)
const error = ref('')

// Sync fields when match prop changes
watch(() => props.match, (m) => {
  if (m) {
    homeScore.value = m.home_score ?? ''
    awayScore.value = m.away_score ?? ''
    error.value = ''
  }
}, { immediate: true })

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
</script>

<template>
  <Teleport to="body">
    <div v-if="match" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      @click.self="emit('close')">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />

      <!-- Modal Panel -->
      <div class="relative w-full max-w-md card p-6 animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-white">Enter Match Score</h2>
          <button @click="emit('close')" class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-navy-700 transition-all">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Teams + Score Inputs -->
        <div class="flex items-center gap-3 mb-6">
          <!-- Home Team -->
          <div class="flex-1 flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-lg font-black text-ebf-orange">
              <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover rounded-full" />
              <span v-else>{{ teamInitial(match.home_team) }}</span>
            </div>
            <span class="text-xs font-semibold text-gray-300 text-center leading-tight">{{ match.home_team?.name }}</span>
            <input
              v-model="homeScore"
              type="number" min="0" max="250"
              placeholder="0"
              class="input-field text-center text-2xl font-black tabular-nums py-4"
              @focus="$event.target.select()"
              @keyup.enter="$refs.awayInput.focus()"
            />
          </div>

          <!-- Divider -->
          <div class="flex flex-col items-center gap-1">
            <span class="text-3xl font-black text-gray-600">–</span>
            <span class="text-[10px] font-bold text-ebf-orange bg-ebf-orange/10 px-2 py-0.5 rounded-full">FINAL</span>
          </div>

          <!-- Away Team -->
          <div class="flex-1 flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-lg font-black text-ebf-orange">
              <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover rounded-full" />
              <span v-else>{{ teamInitial(match.away_team) }}</span>
            </div>
            <span class="text-xs font-semibold text-gray-300 text-center leading-tight">{{ match.away_team?.name }}</span>
            <input
              ref="awayInput"
              v-model="awayScore"
              type="number" min="0" max="250"
              placeholder="0"
              class="input-field text-center text-2xl font-black tabular-nums py-4"
              @focus="$event.target.select()"
              @keyup.enter="handleSave"
            />
          </div>
        </div>

        <!-- Error Message -->
        <Transition name="fade">
          <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
            {{ error }}
          </div>
        </Transition>

        <!-- Actions -->
        <div class="flex gap-3">
          <button @click="emit('close')" class="flex-1 btn-ghost" :disabled="saving">Cancel</button>
          <button @click="handleSave" class="flex-1 btn-primary" :disabled="saving">
            <span v-if="saving" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Saving...
            </span>
            <span v-else>Save Score</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
