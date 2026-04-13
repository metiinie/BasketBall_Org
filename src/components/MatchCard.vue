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
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + 
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="card px-4 py-2 hover:shadow-sm transition-all duration-200 group">
    <div class="flex items-center gap-3 md:gap-4 overflow-hidden">
      
      <!-- Metadata (Compact Stack) -->
      <div class="hidden sm:flex flex-col flex-shrink-0 min-w-[90px] gap-0.5 border-r pr-3" style="border-color: var(--border);">
        <span v-if="formattedDateTime(match.match_date)" class="text-[9px] font-bold whitespace-nowrap" style="color: var(--text-muted);">
          🕒 {{ formattedDateTime(match.match_date) }}
        </span>
        <span v-if="match.venue" class="text-[9px] font-bold truncate flex items-center gap-1 uppercase" style="color: var(--text-muted);">
          📍 {{ match.venue }}
        </span>
      </div>

      <!-- Main Row: Teams & Score -->
      <div class="flex-1 flex items-center gap-3 min-w-0">
        <!-- Home -->
        <div class="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span class="text-[11px] font-bold truncate text-right leading-none" style="color: var(--text-primary);">
            {{ match.home_team?.name || '—' }}
          </span>
          <div class="w-7 h-7 rounded-lg flex-shrink-0 border flex items-center justify-center font-bold text-[9px]"
            style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-muted);">
            <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover rounded-lg"/>
            <span v-else>{{ teamInitial(match.home_team) }}</span>
          </div>
        </div>

        <!-- Score/VS Block -->
        <div class="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[60px]">
          <div v-if="match.status === 'Completed'" class="flex items-center gap-1.5 leading-none mt-0.5">
            <span class="text-base font-bold tabular-nums" style="color: var(--text-heading);">{{ match.home_score }}</span>
            <span class="text-xs font-bold opacity-30" style="color: var(--text-muted);">:</span>
            <span class="text-base font-bold tabular-nums" style="color: var(--text-heading);">{{ match.away_score }}</span>
          </div>
          <div v-else class="text-[8px] font-black tracking-widest text-slate-500 uppercase italic">VS</div>
          <span :class="statusConfig[match.status]?.cls || 'badge-pending'" 
                class="text-[7.5px] leading-tight px-1.5 rounded-full font-bold uppercase -mt-0.5">
            {{ statusConfig[match.status]?.label || match.status }}
          </span>
        </div>

        <!-- Away -->
        <div class="flex-1 flex items-center justify-start gap-2 min-w-0">
          <div class="w-7 h-7 rounded-lg flex-shrink-0 border flex items-center justify-center font-bold text-[9px]"
            style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-muted);">
            <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover rounded-lg"/>
            <span v-else>{{ teamInitial(match.away_team) }}</span>
          </div>
          <span class="text-[11px] font-bold truncate leading-none" style="color: var(--text-primary);">
            {{ match.away_team?.name || '—' }}
          </span>
        </div>
      </div>

      <!-- Action Button (Horizontal Position) -->
      <div v-if="showActions" class="border-l pl-3" style="border-color: var(--border);">
        <button
          @click="emit('edit-score', match)"
          class="btn-primary py-0 px-3 text-[10px] uppercase font-bold tracking-wider rounded-lg h-7 whitespace-nowrap flex items-center transition-transform active:scale-95"
        >
          Enter Score
        </button>
      </div>

    </div>
  </div>
</template>
