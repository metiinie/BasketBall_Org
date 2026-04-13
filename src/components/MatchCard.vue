<script setup>
const props = defineProps({
  match: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
})
const emit = defineEmits(['edit-score'])

const statusConfig = {
  Scheduled: { label: 'Scheduled', cls: 'badge-pending' },
  Pending:   { label: 'Scheduled', cls: 'badge-pending' },
  Completed: { label: 'Final',     cls: 'badge-completed' },
  Forfeited: { label: 'Forfeit',   cls: 'badge-loss' },
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

function formattedDateTime(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="card p-4 hover:shadow-md transition-all duration-200 group">
    <div class="flex items-center gap-3">

      <!-- Home Team -->
      <div class="flex-1 flex flex-col items-end gap-1.5">
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-right leading-tight" style="color: var(--text-primary);">
            {{ match.home_team?.name || '—' }}
          </span>
          <div class="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm"
            style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-muted);">
            <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
            <span v-else>{{ teamInitial(match.home_team) }}</span>
          </div>
        </div>
      </div>

      <!-- Score / VS -->
      <div class="flex flex-col items-center gap-1 flex-shrink-0 min-w-[80px]">
        <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
          <span class="text-2xl font-black tabular-nums" style="color: var(--text-primary);">{{ match.home_score }}</span>
          <span class="font-bold text-lg" style="color: var(--text-muted);">–</span>
          <span class="text-2xl font-black tabular-nums" style="color: var(--text-primary);">{{ match.away_score }}</span>
        </div>
        <div v-else class="text-base font-bold" style="color: var(--text-muted);">VS</div>
        <span :class="statusConfig[match.status]?.cls || 'badge-pending'" class="text-[10px] px-2 py-0.5 rounded-full font-bold">
          {{ statusConfig[match.status]?.label || match.status }}
        </span>
        <div class="flex flex-col items-center mt-1">
          <span v-if="formattedDateTime(match.match_date)" class="text-[10px] font-medium" style="color: var(--text-secondary);">
            {{ formattedDateTime(match.match_date) }}
          </span>
          <span v-if="match.venue" class="text-[10px] mt-0.5 flex items-center gap-0.5" style="color: var(--text-muted);">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {{ match.venue }}
          </span>
        </div>
      </div>

      <!-- Away Team -->
      <div class="flex-1 flex flex-col items-start gap-1.5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-sm"
            style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-muted);">
            <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
            <span v-else>{{ teamInitial(match.away_team) }}</span>
          </div>
          <span class="text-sm font-bold leading-tight" style="color: var(--text-primary);">
            {{ match.away_team?.name || '—' }}
          </span>
        </div>
      </div>

    </div>

    <!-- Edit Button -->
    <div v-if="showActions" class="mt-4 pt-3 flex justify-center" style="border-top: 1px solid var(--border);">
      <button
        @click="emit('edit-score', match)"
        class="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Enter Score
      </button>
    </div>
  </div>
</template>
