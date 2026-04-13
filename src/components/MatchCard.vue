<script setup>
const props = defineProps({
  match: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
})
const emit = defineEmits(['edit-score'])

const statusConfig = {
  Scheduled:  { label: 'Scheduled', cls: 'badge-pending' },
  Completed:  { label: 'Final',     cls: 'badge-completed' },
  Forfeited:  { label: 'Forfeit',   cls: 'badge-loss' },
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

function formattedDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="card p-4 hover:border-navy-600 transition-all duration-200 group">
    <div class="flex items-center gap-3">

      <!-- Home Team -->
      <div class="flex-1 flex flex-col items-end gap-1.5">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-white text-right leading-tight">
            {{ match.home_team?.name || '—' }}
          </span>
          <div class="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-navy-700 flex items-center justify-center font-bold text-sm text-ebf-orange">
            <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover" />
            <span v-else>{{ teamInitial(match.home_team) }}</span>
          </div>
        </div>
      </div>

      <!-- Score / VS -->
      <div class="flex flex-col items-center gap-1 flex-shrink-0 min-w-[80px]">
        <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
          <span class="text-2xl font-black text-white tabular-nums">{{ match.home_score }}</span>
          <span class="text-gray-500 font-bold text-lg">–</span>
          <span class="text-2xl font-black text-white tabular-nums">{{ match.away_score }}</span>
        </div>
        <div v-else class="text-lg font-bold text-gray-500">VS</div>
        <span :class="statusConfig[match.status]?.cls || 'badge-pending'" class="text-[10px] px-2 py-0.5 rounded-full font-bold">
          {{ statusConfig[match.status]?.label || match.status }}
        </span>
        <span v-if="formattedDate(match.match_date)" class="text-[10px] text-gray-600">
          {{ formattedDate(match.match_date) }}
        </span>
      </div>

      <!-- Away Team -->
      <div class="flex-1 flex flex-col items-start gap-1.5">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-navy-700 flex items-center justify-center font-bold text-sm text-ebf-orange">
            <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover" />
            <span v-else>{{ teamInitial(match.away_team) }}</span>
          </div>
          <span class="text-sm font-semibold text-white leading-tight">
            {{ match.away_team?.name || '—' }}
          </span>
        </div>
      </div>

    </div>

    <!-- Edit button (admin only) -->
    <div v-if="showActions" class="mt-3 pt-3 border-t border-navy-700/60 flex justify-center">
      <button
        @click="emit('edit-score', match)"
        class="text-xs font-semibold text-ebf-orange hover:text-ebf-orange-light transition-colors flex items-center gap-1.5"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Enter Score
      </button>
    </div>
  </div>
</template>
