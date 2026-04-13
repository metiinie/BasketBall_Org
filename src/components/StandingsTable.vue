<script setup>
import { computed } from 'vue'
import { exportStandingsPdf } from '@/utils/exportPdf.js'
import { exportStandingsImage } from '@/utils/exportImage.js'

const props = defineProps({
  standings: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  roundLabel: { type: String, default: 'Round' },
  gender: { type: String, default: '' },
  seasonYear: { type: [String, Number], default: '' },
  showExports: { type: Boolean, default: true },
  isGlobal: { type: Boolean, default: false },
})

// Detect ties: teams that share rank-adjacent league points
const standingsWithTie = computed(() => {
  return props.standings.map((entry, i, arr) => {
    const prev = arr[i - 1]
    const next = arr[i + 1]
    const tied = (prev && prev.leaguePts === entry.leaguePts)
               || (next && next.leaguePts === entry.leaguePts)
    return { ...entry, isTied: tied }
  })
})

function rowClass(rank) {
  if (rank === 1) return 'bg-ebf-gold/10 border-l-[3px] border-ebf-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
  if (rank === 2) return 'bg-gray-400/5 border-l-[3px] border-gray-400'
  if (rank === 3) return 'bg-ebf-orange/5 border-l-[3px] border-ebf-orange/40'
  return 'border-l-[3px] border-transparent'
}

function rankBadgeClass(rank) {
  if (rank === 1) return 'bg-ebf-gold text-navy-950 font-black'
  if (rank === 2) return 'bg-gray-400 text-navy-950 font-black'
  if (rank === 3) return 'bg-ebf-orange/80 text-white font-black'
  return 'bg-navy-700 text-gray-400 font-semibold'
}

function pdClass(pd) {
  if (pd > 0) return 'text-green-400'
  if (pd < 0) return 'text-red-400'
  return 'text-gray-500'
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

async function handleExportPdf() {
  await exportStandingsPdf(props.standings, {
    roundLabel: props.roundLabel,
    gender: props.gender,
    seasonYear: props.seasonYear,
  })
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
        class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-gray-300 hover:text-white transition-all">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        PNG
      </button>
      <button @click="handleExportPdf"
        class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ebf-orange/20 hover:bg-ebf-orange/30 text-ebf-orange transition-all">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        PDF
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i"
        class="h-14 rounded-xl bg-navy-800/60 animate-pulse" :style="`opacity: ${1 - i * 0.12}`"/>
    </div>

    <!-- Standings Table -->
    <div v-else-if="standings.length > 0" id="standings-social-card"
      class="rounded-3xl overflow-hidden glass-panel">

      <!-- Social Card Header (visible in PNG export) -->
      <div class="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg viewBox="0 0 32 32" class="w-5 h-5 fill-none stroke-blue-600" stroke-width="2">
              <circle cx="16" cy="16" r="10" />
              <path d="M16 6 Q20 11 20 16 Q20 21 16 26" />
              <path d="M16 6 Q12 11 12 16 Q12 21 16 26" />
              <line x1="6" y1="16" x2="26" y2="16" />
            </svg>
          </div>
          <div>
            <div class="text-sm font-bold text-slate-900 leading-none">EBF League</div>
            <div class="text-xs text-slate-500 leading-none mt-1">{{ gender }} Division</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-blue-600">{{ roundLabel }}</div>
          <div class="text-xs text-slate-500 mt-1">Season {{ seasonYear }}</div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto pb-2">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">Rank</th>
              <th class="py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Team</th>
              <th class="py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-12">GP</th>
              <th class="py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-12">W</th>
              <th class="py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-12">L</th>
              <th class="py-4 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-14">PD</th>
              <th class="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-16">Pts</th>
              <th class="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Form</th>
            </tr>
          </thead>

          <TransitionGroup name="standing-row" tag="tbody">
            <tr
              v-for="(entry, index) in standingsWithTie"
              :key="entry.team.id"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
            >
              <!-- Rank -->
              <td class="py-4 px-4 text-center">
                <span class="text-sm font-bold text-slate-600">
                  {{ index < 9 ? '0' + (index + 1) : (index + 1) }}
                </span>
              </td>

              <!-- Team -->
              <td class="py-4 px-2">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                    <img v-if="entry.team.logo_url" :src="entry.team.logo_url" class="w-full h-full object-cover" />
                    <span v-else>{{ teamInitial(entry.team) }}</span>
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="font-bold text-slate-900 text-sm truncate leading-tight group-hover:text-blue-600 transition-colors">
                      {{ entry.team.name }}
                    </span>
                    <span class="text-xs text-slate-500 mt-0.5" v-if="entry.isTied">Tied</span>
                  </div>
                </div>
              </td>

              <!-- GP -->
              <td class="py-4 px-2 text-right text-slate-600 tabular-nums">{{ entry.played }}</td>

              <!-- W -->
              <td class="py-4 px-2 text-right text-slate-900 font-semibold tabular-nums">{{ entry.wins }}</td>

              <!-- L -->
              <td class="py-4 px-2 text-right text-slate-600 font-medium tabular-nums">{{ entry.losses }}</td>

              <!-- PD -->
              <td class="py-4 px-3 text-right font-semibold tabular-nums text-slate-900">
                {{ entry.ptsDiff > 0 ? '+' : '' }}{{ entry.ptsDiff }}
              </td>

              <!-- PTS -->
              <td class="py-4 px-4 text-right">
                <span class="text-base font-bold text-blue-600 tabular-nums">{{ entry.leaguePts }}</span>
              </td>
              
              <!-- FORM Record -->
              <td class="py-4 px-4">
                <div class="flex justify-center gap-1.5 w-full">
                  <template v-for="(result, fIndex) in entry.form" :key="'f-'+fIndex">
                    <div class="w-2.5 h-6 rounded-sm transition-all"
                         :class="result === 'W' ? 'bg-emerald-500' : 'bg-rose-500'"
                         :title="result">
                    </div>
                  </template>
                  <!-- Pad empty blocks if played less than 5 -->
                  <template v-for="empty in Math.max(0, 5 - entry.form.length)" :key="'e-'+empty">
                    <div class="w-2.5 h-6 rounded-sm bg-slate-200"></div>
                  </template>
                </div>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <!-- Trophy Winner Banner (Global view, rank 1) -->
      <div v-if="isGlobal && standings.length > 0"
        class="px-4 py-3 bg-gradient-to-r from-ebf-gold/20 to-transparent border-t border-ebf-gold/30 flex items-center gap-3">
        <svg class="w-5 h-5 text-ebf-gold flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="text-sm font-bold text-ebf-gold">
          Season Champion: <span class="text-white">{{ standings[0]?.team?.name }}</span>
        </span>
        <span class="ml-auto text-xs text-gray-500">{{ standings[0]?.leaguePts }} pts total</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel p-16 flex flex-col items-center text-center gap-5 rounded-3xl">
      <div class="w-16 h-16 rounded-2xl bg-navy-700/60 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <div>
        <p class="text-gray-400 font-semibold">No standings available</p>
        <p class="text-gray-600 text-sm mt-1">Matches will appear here once scores are entered.</p>
      </div>
    </div>
  </div>
</template>
