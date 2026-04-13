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
    day: '2-digit', month: 'short', 
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="card p-4 hover:shadow-md transition-all duration-200 group">
    <div class="flex items-center gap-4">
      
      <!-- Home Team -->
      <div class="flex-1 flex items-center justify-end gap-3 min-w-0">
        <span class="text-sm font-bold truncate text-right px-1" style="color: var(--text-primary);">
          {{ match.home_team?.name || '—' }}
        </span>
        <div class="w-10 h-10 rounded-xl flex-shrink-0 border flex items-center justify-center font-bold text-xs"
          style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-muted);">
          <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover rounded-xl"/>
          <span v-else>{{ teamInitial(match.home_team) }}</span>
        </div>
      </div>

      <!-- Center Block -->
      <div class="flex flex-col items-center gap-1 flex-shrink-0 min-w-[100px]">
        <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
          <span class="text-xl font-bold tabular-nums" style="color: var(--text-heading);">{{ match.home_score }}</span>
          <span class="text-lg font-bold opacity-30" style="color: var(--text-muted);">:</span>
          <span class="text-xl font-bold tabular-nums" style="color: var(--text-heading);">{{ match.away_score }}</span>
        </div>
        <div v-else class="text-[10px] font-black tracking-widest text-slate-500 uppercase italic">VS</div>
        
        <span :class="statusConfig[match.status]?.cls || 'badge-pending'" class="text-[9px] px-2 py-0.5 rounded-full font-bold">
          {{ statusConfig[match.status]?.label || match.status }}
        </span>
      </div>

      <!-- Away Team -->
      <div class="flex-1 flex items-center justify-start gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl flex-shrink-0 border flex items-center justify-center font-bold text-xs"
          style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-muted);">
          <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover rounded-xl"/>
          <span v-else>{{ teamInitial(match.away_team) }}</span>
        </div>
        <span class="text-sm font-bold truncate px-1" style="color: var(--text-primary);">
          {{ match.away_team?.name || '—' }}
        </span>
      </div>

    </div>

    <!-- Metadata & Footer Action -->
    <div v-if="match.venue || match.match_date || showActions" class="mt-4 pt-4 border-t" style="border-color: var(--border);">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <span v-if="formattedDateTime(match.match_date)" class="text-[10px] font-bold" style="color: var(--text-muted);">
            🕒 {{ formattedDateTime(match.match_date) }}
          </span>
          <span v-if="match.venue" class="text-[10px] font-bold truncate flex items-center gap-1" style="color: var(--text-muted);">
            📍 {{ match.venue }}
          </span>
        </div>

        <button
          v-if="showActions"
          @click="emit('edit-score', match)"
          class="btn-primary btn-sm py-1.5 px-4"
        >
          Enter Score
        </button>
      </div>
    </div>
  </div>
</template>
