<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatEthiopian } from '@/utils/dateFormatter'
import { getTeamName } from '@/utils/teamName'
import TeamLogo from '@/components/TeamLogo.vue'

const props = defineProps({
  match: { type: Object, required: true },
})

const { t } = useI18n()


const roundLabel = computed(() => 
  props.match.round?.round_number 
    ? t('matches.round', { num: props.match.round.round_number }) 
    : t('nav.standings')
)

const statusLabel = computed(() => {
  if (props.match.status === 'Completed') return t('matches.completed')
  if (props.match.status === 'Forfeited') return t('matches.forfeited')
  return t('matches.scheduled')
})

const displayDate = computed(() => {
  const ethDate = formatEthiopian(props.match.match_date)
  if (props.match.status !== 'Completed' && props.match.match_date) {
    const timeStr = new Date(props.match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${ethDate} ${timeStr}`
  }
  return ethDate
})

</script>

<template>
  <div class="card overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
    <div class="flex flex-row h-full">
      
      <!-- Left: Teams & Scores -->
      <div class="flex-1 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <!-- Home Team -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <TeamLogo :team="match.home_team" size="w-8 h-8 sm:w-10 sm:h-10" rounded="rounded-lg sm:rounded-xl" class="group-hover:scale-105 transition-transform" />
            <span class="text-[11px] sm:text-sm font-bold tracking-tight truncate transition-colors" 
                  :style="match.status === 'Completed' && match.home_score > match.away_score ? 'color: var(--text-primary);' : 'color: var(--text-secondary);'">
              {{ getTeamName(match.home_team) }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span class="text-sm sm:text-lg font-black tabular-nums" 
                  :style="match.home_score > match.away_score ? 'color: var(--text-heading);' : 'color: var(--text-muted);'">
              {{ match.home_score }}
            </span>
            <svg v-if="match.home_score > match.away_score" class="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        <!-- Away Team -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <TeamLogo :team="match.away_team" size="w-8 h-8 sm:w-10 sm:h-10" rounded="rounded-lg sm:rounded-xl" class="group-hover:scale-105 transition-transform" />
            <span class="text-xs sm:text-sm font-bold tracking-tight truncate transition-colors" 
                  :style="match.status === 'Completed' && match.away_score > match.home_score ? 'color: var(--text-primary);' : 'color: var(--text-secondary);'">
              {{ getTeamName(match.away_team) }}
            </span>
          </div>
          <div v-if="match.status === 'Completed'" class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span class="text-base sm:text-lg font-black tabular-nums" 
                  :style="match.away_score > match.home_score ? 'color: var(--text-heading);' : 'color: var(--text-muted);'">
              {{ match.away_score }}
            </span>
            <svg v-if="match.away_score > match.home_score" class="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Right: Meta & Game Story -->
      <div class="w-20 sm:w-32 flex-shrink-0 border-l flex flex-col items-center justify-center text-center p-1.5 sm:p-2 relative overflow-hidden"
           style="border-color: var(--border); background-color: var(--bg-surface);">
        <!-- Subtle NBA-style background gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-red-600/5 opacity-50 dark:opacity-20"></div>
        
        <div class="relative z-10 space-y-0.5">
          <p class="text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-none" style="color: var(--text-muted);">
            {{ match.status === 'Completed' ? roundLabel : statusLabel }}
          </p>
          <p class="text-[10px] sm:text-[11px] font-black tabular-nums" style="color: var(--text-primary);">
            {{ displayDate }}
          </p>
        </div>

        <!-- Game Story Button -->
        <div class="mt-2.5 sm:mt-3 relative z-10 w-full px-1 sm:px-2">
          <div class="h-8 sm:h-10 rounded-lg overflow-hidden relative cursor-pointer group/story shadow-sm border"
               style="border-color: var(--border);">
            <div class="absolute inset-0 bg-gradient-to-tr from-blue-600/90 to-blue-800/90 group-hover/story:from-blue-500 group-hover/story:to-blue-700 transition-all"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[8px] sm:text-[9px] font-black text-white leading-none capitalize">{{ t('matches.story') }}</span>
              <span v-if="match.round?.round_number" class="text-[6px] sm:text-[7px] font-bold uppercase tracking-wider text-white/50 mt-0.5">R{{ match.round.round_number }}</span>
            </div>
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
