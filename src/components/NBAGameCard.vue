<script setup>
const props = defineProps({
  match: { type: Object, required: true },
})

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
  <div class="card overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
    <div class="flex">
      
      <!-- Left: Teams & Scores -->
      <div class="flex-1 p-4 space-y-3">
        <!-- Home Team -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border"
                 style="background-color: var(--bg-surface); border-color: var(--border);">
              <img v-if="match.home_team?.logo_url" :src="match.home_team.logo_url" class="w-full h-full object-cover"/>
              <span v-else class="text-[10px] font-black" style="color: var(--text-muted);">{{ teamInitial(match.home_team) }}</span>
            </div>
            <span class="text-sm font-bold tracking-tight transition-colors" 
                  :style="match.status === 'Completed' && match.home_score > match.away_score ? 'color: var(--text-primary);' : 'color: var(--text-secondary);'">
              {{ match.home_team?.name }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
            <span class="text-lg font-black tabular-nums" 
                  :style="match.home_score > match.away_score ? 'color: var(--text-heading);' : 'color: var(--text-muted);'">
              {{ match.home_score }}
            </span>
            <svg v-if="match.home_score > match.away_score" class="w-2.5 h-2.5" style="color: var(--text-heading);" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        <!-- Away Team -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border"
                 style="background-color: var(--bg-surface); border-color: var(--border);">
              <img v-if="match.away_team?.logo_url" :src="match.away_team.logo_url" class="w-full h-full object-cover"/>
              <span v-else class="text-[10px] font-black" style="color: var(--text-muted);">{{ teamInitial(match.away_team) }}</span>
            </div>
            <span class="text-sm font-bold tracking-tight transition-colors" 
                  :style="match.status === 'Completed' && match.away_score > match.home_score ? 'color: var(--text-primary);' : 'color: var(--text-secondary);'">
              {{ match.away_team?.name }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-2">
            <span class="text-lg font-black tabular-nums" 
                  :style="match.away_score > match.home_score ? 'color: var(--text-heading);' : 'color: var(--text-muted);'">
              {{ match.away_score }}
            </span>
            <svg v-if="match.away_score > match.home_score" class="w-2.5 h-2.5" style="color: var(--text-heading);" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Right: Meta & Game Story -->
      <div class="w-32 border-l flex flex-col items-center justify-center text-center p-2 relative overflow-hidden"
           style="border-color: var(--border); background-color: var(--bg-surface);">
        <!-- Subtle NBA-style background gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-red-600/5 opacity-50 dark:opacity-20 animate-pulse"></div>
        
        <div class="relative z-10 space-y-0.5">
          <p class="text-[10px] font-black uppercase tracking-widest" style="color: var(--text-muted);">
            {{ match.status === 'Completed' ? (match.status === 'Forfeited' ? 'Forfeit' : roundLabel) : 'Scheduled' }}
          </p>
          <p class="text-[11px] font-black" style="color: var(--text-primary);">
            {{ match.status === 'Completed' ? formatDateDisplay(match.match_date) : formatTime(match.match_date) }}
          </p>
        </div>

        <!-- Game Story Button (Visual Only Placeholder) -->
        <div class="mt-3 relative z-10 w-full px-2">
          <div class="h-10 rounded-lg overflow-hidden relative cursor-pointer group/story shadow-sm border"
               style="border-color: var(--border);">
            <div class="absolute inset-0 bg-gradient-to-tr from-blue-600 to-red-600 opacity-90 group-hover/story:opacity-100 transition-opacity"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[7px] font-black uppercase tracking-[0.2em] text-white/60 leading-none mb-0.5">MATCH</span>
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
  background-color: var(--bg-card);
  border: 1px solid var(--border);
}
</style>
