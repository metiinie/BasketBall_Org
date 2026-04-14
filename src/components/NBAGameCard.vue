<script setup>
const props = defineProps({
  match: { type: Object, required: true },
})

const statusConfig = {
  Scheduled: { label: 'Scheduled', cls: 'text-slate-400' },
  Pending:   { label: 'Scheduled', cls: 'text-slate-400' },
  Completed: { label: 'Final',     cls: 'text-amber-500' },
  Forfeited: { label: 'Forfeit',   cls: 'text-red-500' },
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

function formatTime(dateStr) {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'TBA'
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

const roundLabel = props.match.round?.round_number ? `Round ${props.match.round.round_number}` : 'League Match'
</script>

<template>
  <div class="card overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
    <div class="flex">
      
      <!-- Left: Teams & Scores -->
      <div class="flex-1 p-4 space-y-3">
        <!-- Home Team -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
              <span v-else class="text-[10px] font-black text-slate-500">{{ teamInitial(match.home_team) }}</span>
            </div>
            <span class="text-sm font-bold tracking-tight" :class="match.status === 'Completed' && match.home_score > match.away_score ? 'text-white' : 'text-slate-300'">
              {{ match.home_team?.name }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
            <span class="text-lg font-black tabular-nums" :class="match.home_score > match.away_score ? 'text-white' : 'text-slate-500'">
              {{ match.home_score }}
            </span>
            <svg v-if="match.home_score > match.away_score" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>

        <!-- Away Team -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
              <span v-else class="text-[10px] font-black text-slate-500">{{ teamInitial(match.away_team) }}</span>
            </div>
            <span class="text-sm font-bold tracking-tight" :class="match.status === 'Completed' && match.away_score > match.home_score ? 'text-white' : 'text-slate-300'">
              {{ match.away_team?.name }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
            <span class="text-lg font-black tabular-nums" :class="match.away_score > match.home_score ? 'text-white' : 'text-slate-500'">
              {{ match.away_score }}
            </span>
            <svg v-if="match.away_score > match.home_score" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>

      <!-- Right: Meta & Game Story -->
      <div class="w-32 border-l border-slate-800 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
        <!-- Subtle NBA-style background gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-red-600/5 opacity-50"></div>
        
        <div class="relative z-10 space-y-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {{ match.status === 'Completed' ? roundLabel : 'Scheduled' }}
          </p>
          <p class="text-[11px] font-bold text-slate-300">
            {{ match.status === 'Completed' ? formatDateDisplay(match.match_date) : formatTime(match.match_date) }}
          </p>
        </div>

        <!-- Game Story Button (Visual Only Placeholder) -->
        <div class="mt-3 relative z-10 w-full px-2">
          <div class="h-10 rounded-lg overflow-hidden relative cursor-pointer group/story shadow-lg border border-white/5">
            <div class="absolute inset-0 bg-gradient-to-tr from-blue-900 to-red-900 opacity-80 group-hover/story:opacity-100 transition-opacity"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[7px] font-black uppercase tracking-[0.2em] text-white/50 leading-none mb-0.5">MATCH</span>
              <span class="text-[9px] font-black text-white leading-none">STORY</span>
            </div>
            <!-- Interactive Dot -->
            <div class="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: #111111;
  border: 1px solid #222222;
}
</style>
