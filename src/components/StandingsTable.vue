<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { exportStandingsImage } from '@/utils/exportImage.js'
import { getTeamName } from '@/utils/teamName.js'
import TeamLogo from '@/components/TeamLogo.vue'

const props = defineProps({
  standings:   { type: Array,            default: () => [] },
  loading:     { type: Boolean,          default: false },
  roundLabel:  { type: String,           default: 'Round' },
  gender:      { type: String,           default: '' }, // raw DB value: 'ወንድ' or 'ሴት'
  seasonYear:  { type: [String, Number], default: '' },
  showExports: { type: Boolean,          default: true },
  isGlobal:    { type: Boolean,          default: false },
})

const { t } = useI18n()
const shareSuccess = ref(false)

const standingsWithTie = computed(() => {
  return props.standings.map((entry, i, arr) => {
    const prev = arr[i - 1]
    const next = arr[i + 1]
    const tied = (prev && prev.leaguePts === entry.leaguePts)
              || (next && next.leaguePts === entry.leaguePts)
    return { ...entry, isTied: tied }
  })
})

// Fix: compare against raw DB Amharic gender values, not English strings
const localizedGender = computed(() => {
  if (props.gender === 'ወንድ') return t('gender.men')
  if (props.gender === 'ሴት')  return t('gender.women')
  return props.gender
})


async function handleShare() {
  const shareData = {
    title: `EBF League Standings - ${props.roundLabel}`,
    text: `Check out the high-stakes standings for the EBF ${props.seasonYear} season - ${localizedGender.value} Division!`,
    url: window.location.href,
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      shareSuccess.value = true
      setTimeout(() => shareSuccess.value = false, 3000)
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err)
    }
  }
}

async function handleExportImage() {
  await exportStandingsImage(
    'standings-social-card',
    `EBF_${props.roundLabel.replace(/\s+/g, '_')}_${props.seasonYear}.png`
  )
}
</script>

<template>
  <div class="w-full">

    <!-- Export Controls -->
    <div v-if="showExports && standings.length > 0" class="flex justify-end gap-2 mb-3">
      <button @click="handleExportImage"
        class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all btn-ghost uppercase tracking-widest">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        PNG
      </button>
      <button @click="handleShare"
        class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 transition-all uppercase tracking-widest">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
        </svg>
        {{ shareSuccess ? t('admin.saved') : t('global.share') }}
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i"
        class="h-14 rounded-xl animate-pulse"
        :style="`background-color: var(--bg-surface); opacity: ${1 - i * 0.1}`"/>
    </div>

    <!-- Standings Table -->
    <div v-else-if="standings.length > 0" id="standings-social-card"
      class="card rounded-2xl overflow-hidden">

      <!-- Header -->
      <div class="px-5 py-4 flex items-center justify-between" style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border);">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-600/15 flex items-center justify-center">
            <svg viewBox="0 0 32 32" class="w-5 h-5 fill-none stroke-blue-500" stroke-width="2">
              <circle cx="16" cy="16" r="10"/>
              <path d="M16 6 Q20 11 20 16 Q20 21 16 26"/>
              <path d="M16 6 Q12 11 12 16 Q12 21 16 26"/>
              <line x1="6" y1="16" x2="26" y2="16"/>
            </svg>
          </div>
          <div>
            <div class="text-sm font-bold leading-none" style="color: var(--text-primary);">{{ t('global.league') }}</div>
            <div class="text-xs mt-1 leading-none uppercase tracking-widest font-black opacity-60" style="color: var(--text-muted);">{{ localizedGender }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-blue-500">{{ roundLabel }}</div>
          <div class="text-xs mt-1" style="color: var(--text-muted);">{{ t('global.season') }} {{ seasonYear }}</div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto relative shadow-sm">
        <table class="w-full text-left border-collapse min-w-[580px] lg:min-w-[900px]">
          <thead>
            <tr class="transition-colors" style="background-color: var(--bg-surface); border-bottom: 2px solid var(--border);">
              <th class="sticky left-0 z-20 py-3 sm:py-4 px-3 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center w-10 sm:w-12" 
                  style="background-color: var(--bg-card); color: var(--text-muted); border-right: 1px solid var(--border);" :title="t('standings.tooltips.rank')">{{ t('standings.pos') }}</th>
              <th class="sticky left-10 sm:left-12 z-20 py-3 sm:py-4 px-2 sm:px-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-left min-w-[120px] sm:min-w-[180px]" 
                  style="background-color: var(--bg-card); color: var(--text-muted); border-right: 1px solid var(--border);">{{ t('standings.team') }}</th>
              <th class="py-3 sm:py-4 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-right w-10 sm:w-12"  style="color: var(--text-muted);" :title="t('standings.tooltips.wins')">{{ t('standings.w') }}</th>
              <th class="py-3 sm:py-4 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-right w-10 sm:w-12"  style="color: var(--text-muted);" :title="t('standings.tooltips.losses')">{{ t('standings.l') }}</th>
              <!-- PCT column — calculated in standings engine -->
              <th class="hidden md:table-cell py-4 px-2 text-[10px] font-black uppercase tracking-wider text-right w-14" style="color: var(--text-muted);" :title="t('standings.pct')">{{ t('standings.pct') }}</th>
              <!-- GB column -->
              <th class="hidden md:table-cell py-4 px-2 text-[10px] font-black uppercase tracking-wider text-right w-10" style="color: var(--text-muted);" :title="t('standings.gb')">{{ t('standings.gb') }}</th>

              <th class="hidden lg:table-cell py-4 px-2 text-[10px] font-black uppercase tracking-wider text-center w-20" style="color: var(--text-muted);" :title="t('standings.tooltips.home_record')">{{ t('standings.home') }}</th>
              <th class="hidden lg:table-cell py-4 px-2 text-[10px] font-black uppercase tracking-wider text-center w-20" style="color: var(--text-muted);" :title="t('standings.tooltips.road_record')">{{ t('standings.road') }}</th>
              <th class="py-3 sm:py-4 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-right w-10 sm:w-12"  style="color: var(--text-muted);" :title="t('standings.tooltips.forfeits')">F</th>
              <th class="hidden md:table-cell py-4 px-2 text-[10px] font-black uppercase tracking-wider text-right w-12"  style="color: var(--text-muted);" :title="t('standings.tooltips.points_for')">{{ t('standings.pf') }}</th>
              <th class="hidden md:table-cell py-4 px-2 text-[10px] font-black uppercase tracking-wider text-right w-12"  style="color: var(--text-muted);" :title="t('standings.tooltips.points_against')">{{ t('standings.pa') }}</th>
              <th class="py-3 sm:py-4 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-right w-10 sm:w-12"  style="color: var(--text-muted);" :title="t('standings.tooltips.point_difference')">{{ t('standings.pd') }}</th>
              <th class="py-3 sm:py-4 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-right w-14 sm:w-16"  style="color: var(--text-muted);" :title="t('standings.tooltips.current_streak')">{{ t('standings.strk') }}</th>
              <th class="py-3 sm:py-4 px-4 sm:px-6 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-right w-14 sm:w-16"  style="color: var(--text-muted);" :title="t('standings.tooltips.league_points')">{{ t('standings.pts') }}</th>
            </tr>
          </thead>

          <TransitionGroup name="standing-row" tag="tbody">
            <tr
              v-for="(entry, index) in standingsWithTie"
              :key="entry.team.id"
              class="group transition-colors border-b hover:bg-slate-500/5"
              style="border-color: var(--border);"
            >
              <!-- Rank (Sticky) -->
              <td class="sticky left-0 z-10 py-3 sm:py-4 px-3 sm:px-4 text-center transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"
                  style="background-color: var(--bg-card); border-right: 1px solid var(--border);">
                <span class="text-xs sm:text-sm font-black italic" :class="index < 3 ? 'text-amber-500' : ''" :style="index < 3 ? '' : 'color: var(--text-muted);'">
                  {{ index + 1 }}
                </span>
              </td>

              <!-- Team (Sticky) -->
              <td class="sticky left-10 sm:left-12 z-10 py-3 sm:py-4 px-2 sm:px-3 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.05)]" 
                  style="background-color: var(--bg-card); border-right: 1px solid var(--border);">
                <div class="flex items-center gap-2 sm:gap-3">
                  <TeamLogo :team="entry.team" size="w-7 h-7 sm:w-10 sm:h-10" rounded="rounded-lg sm:rounded-xl" />
                  <div class="flex flex-col text-left min-w-0">
                    <span class="font-black text-xs sm:text-sm truncate leading-tight transition-colors" style="color: var(--text-primary);">
                      {{ getTeamName(entry.team) }}
                    </span>
                    <span v-if="entry.isTied" class="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-blue-500 mt-0.5">{{ t('standings.statistical_tie') }}</span>
                  </div>
                </div>
              </td>

              <!-- W / L -->
              <td class="py-3 sm:py-4 px-1.5 sm:px-2 text-right font-black tabular-nums text-xs sm:text-sm" style="color: var(--text-primary);">{{ entry.wins }}</td>
              <td class="py-3 sm:py-4 px-1.5 sm:px-2 text-right font-black tabular-nums text-xs sm:text-sm" style="color: var(--text-secondary);">{{ entry.losses }}</td>

              <!-- PCT — now rendered (was calculated but missing from template) -->
              <td class="hidden md:table-cell py-4 px-2 text-right tabular-nums text-xs font-bold text-slate-400">{{ entry.pct || '.000' }}</td>
              <!-- GB -->
              <td class="hidden md:table-cell py-4 px-2 text-right tabular-nums text-xs font-bold text-slate-400">{{ entry.gb || '—' }}</td>

              <td class="hidden lg:table-cell py-4 px-2 text-center text-[11px] tabular-nums font-bold text-slate-400">
                {{ entry.homeW }}-{{ entry.homeL }}
              </td>
              <td class="hidden lg:table-cell py-4 px-2 text-center text-[11px] tabular-nums font-bold text-slate-400">
                {{ entry.roadW }}-{{ entry.roadL }}
              </td>
              <td class="py-3 sm:py-4 px-1.5 sm:px-2 text-right font-bold tabular-nums text-xs" :class="entry.forfeits > 0 ? 'text-red-500' : 'text-slate-500'">
                {{ entry.forfeits }}
              </td>

              <td class="hidden md:table-cell py-4 px-2 text-right tabular-nums text-xs font-bold text-slate-300">{{ entry.ptsFor }}</td>
              <td class="hidden md:table-cell py-4 px-2 text-right tabular-nums text-xs font-bold text-slate-500">{{ entry.ptsAgainst }}</td>

              <td class="py-3 sm:py-4 px-1.5 sm:px-2 text-right font-black tabular-nums text-xs sm:text-sm"
                :style="entry.ptsDiff > 0 ? 'color: #10b981;' : entry.ptsDiff < 0 ? 'color: #f43f5e;' : 'color: var(--text-secondary);'">
                {{ entry.ptsDiff > 0 ? '+' : '' }}{{ entry.ptsDiff }}
              </td>

              <!-- Streak — fix: empty string is neutral, only apply colors when W/L prefix exists -->
              <td class="py-3 sm:py-4 px-1.5 sm:px-2 text-right font-black tabular-nums text-[10px] sm:text-xs"
                :class="entry.streak ? (entry.streak.startsWith('W') ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-500'">
                {{ entry.streak || '—' }}
              </td>

              <td class="py-3 sm:py-4 px-4 sm:px-6 text-right">
                <span class="text-sm sm:text-base font-black text-blue-500 tabular-nums">{{ entry.leaguePts }}</span>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <!-- Champion Banner — fixed: uses proper i18n key instead of brittle string split -->
      <div v-if="isGlobal && standings.length > 0"
        class="px-4 py-3 flex items-center gap-3 bg-amber-500/10 border-t border-amber-500/20">
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="text-sm font-bold text-amber-400 overflow-hidden truncate">
          {{ t('standings.champion') }}: <span style="color: var(--text-primary);">{{ getTeamName(standings[0]?.team) }}</span>
        </span>
        <span class="ml-auto text-xs whitespace-nowrap" style="color: var(--text-muted);">{{ standings[0]?.leaguePts }} {{ t('standings.pts').toLowerCase() }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card p-14 flex flex-col items-center text-center gap-4 rounded-2xl">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background-color: var(--bg-surface);">
        <svg class="w-6 h-6" style="color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <div>
        <p class="font-semibold" style="color: var(--text-secondary);">{{ t('admin.no_standings') }}</p>
        <p class="text-sm mt-1" style="color: var(--text-muted);">{{ t('matches.check_back') }}</p>
      </div>
    </div>

  </div>
</template>
