<script setup>
const props = defineProps({
  match: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
})
const emit = defineEmits(['edit-score'])

const statusConfig = {
  Scheduled: { label: 'SCHEDULED', cls: 'badge-pending' },
  Pending:   { label: 'SCHEDULED', cls: 'badge-pending' },
  Completed: { label: 'FINAL',     cls: 'badge-completed' },
  Forfeited: { label: 'FORFEIT',   cls: 'badge-loss' },
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

function formattedDateTime(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
}
</script>

<template>
  <div class="card p-5 hover:border-blue-500/30 transition-all duration-300 group cursor-default relative overflow-hidden">
    
    <!-- Subtle Background Pattern/Glow -->
    <div class="absolute -right-10 -top-10 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>

    <div class="flex items-center justify-between relative z-10">
      
      <!-- Home Team -->
      <div class="flex-1 flex flex-col items-center gap-2">
        <div class="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border-2 transition-transform group-hover:scale-105"
          style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-heading);">
          <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
          <span v-else class="text-xl font-black">{{ teamInitial(match.home_team) }}</span>
        </div>
        <span class="text-xs font-black uppercase tracking-tight text-center max-w-[100px] leading-tight" style="color: var(--text-primary);">
          {{ match.home_team?.name || '—' }}
        </span>
      </div>

      <!-- Center Score / VS Block -->
      <div class="flex flex-col items-center gap-2 flex-shrink-0 min-w-[120px]">
        <div v-if="match.status === 'Completed'" class="flex items-center gap-4">
          <span class="text-3xl font-black tabular-nums tracking-tighter" style="color: var(--text-heading);">{{ match.home_score }}</span>
          <div class="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          <span class="text-3xl font-black tabular-nums tracking-tighter" style="color: var(--text-heading);">{{ match.away_score }}</span>
        </div>
        <div v-else class="text-sm font-black tracking-widest text-slate-500 italic">VS</div>
        
        <div class="flex flex-col items-center">
          <span :class="statusConfig[match.status]?.cls || 'badge-pending'" 
            class="text-[9px] px-3 py-0.5 rounded-full font-black tracking-[0.1em]">
            {{ statusConfig[match.status]?.label || match.status }}
          </span>
          <div v-if="formattedDateTime(match.match_date)" class="mt-2 flex items-center gap-2 text-[10px] font-bold" style="color: var(--text-muted);">
            <span>{{ formattedDateTime(match.match_date).date }}</span>
            <div class="w-1 h-1 rounded-full bg-slate-700"></div>
            <span>{{ formattedDateTime(match.match_date).time }}</span>
          </div>
        </div>
      </div>

      <!-- Away Team -->
      <div class="flex-1 flex flex-col items-center gap-2">
        <div class="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border-2 transition-transform group-hover:scale-105"
          style="background-color: var(--bg-surface); border-color: var(--border); color: var(--text-heading);">
          <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
          <span v-else class="text-xl font-black">{{ teamInitial(match.away_team) }}</span>
        </div>
        <span class="text-xs font-black uppercase tracking-tight text-center max-w-[100px] leading-tight" style="color: var(--text-primary);">
          {{ match.away_team?.name || '—' }}
        </span>
      </div>

    </div>

    <!-- Actions Section -->
    <div v-if="showActions" class="mt-6 pt-4 flex flex-col items-center gap-3 border-t" style="border-color: var(--border);">
      <button
        @click="emit('edit-score', match)"
        class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black tracking-[0.2em] text-white uppercase transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group/btn"
      >
        <svg class="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
        Edit Official Result
      </button>
      
      <div v-if="match.venue" class="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest" style="color: var(--text-muted);">
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        </svg>
        {{ match.venue }}
      </div>
    </div>

  </div>
</template>
