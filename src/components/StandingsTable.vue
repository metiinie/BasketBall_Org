import { computed, ref } from 'vue'
import { exportStandingsImage } from '@/utils/exportImage.js'

const props = defineProps({
  standings:   { type: Array,          default: () => [] },
  loading:     { type: Boolean,        default: false },
  roundLabel:  { type: String,         default: 'Round' },
  gender:      { type: String,         default: '' },
  seasonYear:  { type: [String, Number], default: '' },
  showExports: { type: Boolean,        default: true },
  isGlobal:    { type: Boolean,        default: false },
})

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

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

async function handleShare() {
  const shareData = {
    title: `EBF League Standings - ${props.roundLabel}`,
    text: `Check out the high-stakes standings for the EBF ${props.seasonYear} season - ${props.gender} Division!`,
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
        class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all btn-ghost">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        PNG
      </button>
      <button @click="handleShare"
        class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 transition-all">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
        </svg>
        {{ shareSuccess ? 'Link Copied!' : 'Share' }}
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
            <div class="text-sm font-bold leading-none" style="color: var(--text-primary);">EBF League</div>
            <div class="text-xs mt-1 leading-none" style="color: var(--text-muted);">{{ gender }} Division</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-blue-500">{{ roundLabel }}</div>
          <div class="text-xs mt-1" style="color: var(--text-muted);">Season {{ seasonYear }}</div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th class="py-3 px-4 text-[9px] font-black uppercase tracking-wider text-center w-10" style="color: var(--text-muted);" title="Rank">#</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-left"         style="color: var(--text-muted);">Team</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-10"  style="color: var(--text-muted);" title="Wins">W</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-10"  style="color: var(--text-muted);" title="Losses">L</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-14"  style="color: var(--text-muted);" title="Winning Percentage">PCT</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-11"  style="color: var(--text-muted);" title="Games Behind">GB</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-center w-16" style="color: var(--text-muted);" title="Home Record">Home</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-center w-16" style="color: var(--text-muted);" title="Road Record">Road</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-11"  style="color: var(--text-muted);" title="Points For (Mark)">PF</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-11"  style="color: var(--text-muted);" title="Points Against">PA</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-10"  style="color: var(--text-muted);" title="Point Difference">PD</th>
              <th class="py-3 px-2 text-[9px] font-black uppercase tracking-wider text-right w-14"  style="color: var(--text-muted);" title="Current Streak">Strk</th>
              <th class="py-3 px-4 text-[9px] font-black uppercase tracking-wider text-right w-11"  style="color: var(--text-muted);" title="League Points">Pts</th>
            </tr>
          </thead>

          <TransitionGroup name="standing-row" tag="tbody">
            <tr
              v-for="(entry, index) in standingsWithTie"
              :key="entry.team.id"
              class="group transition-colors"
              :style="`border-bottom: 1px solid var(--border);`"
              @mouseenter="$event.currentTarget.style.backgroundColor = 'var(--bg-surface)'"
              @mouseleave="$event.currentTarget.style.backgroundColor = ''"
            >
              <!-- Rank -->
              <td class="py-3.5 px-4 text-center">
                <span class="text-sm font-bold" style="color: var(--text-secondary);">
                  {{ index < 9 ? '0' + (index + 1) : (index + 1) }}
                </span>
              </td>

              <!-- Team -->
              <td class="py-3.5 px-2">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0"
                    style="background-color: var(--bg-surface); border: 1px solid var(--border); color: var(--text-muted);">
                    <img v-if="entry.team.logo_url" :src="entry.team.logo_url" class="w-full h-full object-cover"/>
                    <span v-else>{{ teamInitial(entry.team) }}</span>
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="font-bold text-sm truncate leading-tight group-hover:text-blue-500 transition-colors" style="color: var(--text-primary);">
                      {{ entry.team.name }}
                    </span>
                    <span v-if="entry.isTied" class="text-xs mt-0.5" style="color: var(--text-muted);">Tied</span>
                  </div>
                </div>
              </td>

              <!-- Stats Columns -->
              <td class="py-3.5 px-2 text-right font-semibold tabular-nums" style="color: var(--text-primary);" title="Wins">{{ entry.wins }}</td>
              <td class="py-3.5 px-2 text-right font-medium tabular-nums" style="color: var(--text-secondary);" title="Losses">{{ entry.losses }}</td>
              
              <td class="py-3.5 px-2 text-right tabular-nums text-xs font-bold" style="color: var(--text-primary);" title="Winning Percentage">{{ entry.pct }}</td>
              <td class="py-3.5 px-2 text-right tabular-nums text-xs" style="color: var(--text-muted);" title="Games Behind">{{ entry.gb }}</td>
              
              <td class="py-3.5 px-2 text-center text-[10px] tabular-nums font-bold" style="color: var(--text-secondary);" :title="`${entry.homeW} Wins, ${entry.homeL} Losses`">
                {{ entry.homeW }}-{{ entry.homeL }}
              </td>
              <td class="py-3.5 px-2 text-center text-[10px] tabular-nums font-bold" style="color: var(--text-secondary);" :title="`${entry.roadW} Wins, ${entry.roadL} Losses`">
                {{ entry.roadW }}-{{ entry.roadL }}
              </td>

              <td class="py-3.5 px-2 text-right tabular-nums text-xs" style="color: var(--text-secondary);" title="Points For">{{ entry.ptsFor }}</td>
              <td class="py-3.5 px-2 text-right tabular-nums text-xs" style="color: var(--text-muted);" title="Points Against">{{ entry.ptsAgainst }}</td>

              <td class="py-3.5 px-2 text-right font-semibold tabular-nums text-xs"
                :title="`Point Difference: ${entry.ptsDiff}`"
                :style="entry.ptsDiff > 0 ? 'color: #10b981;' : entry.ptsDiff < 0 ? 'color: #f43f5e;' : 'color: var(--text-secondary);'">
                {{ entry.ptsDiff > 0 ? '+' : '' }}{{ entry.ptsDiff }}
              </td>

              <td class="py-3.5 px-2 text-right font-black tabular-nums text-xs"
                :style="entry.streak.startsWith('W') ? 'color: #10b981;' : 'color: #f43f5e;'">
                {{ entry.streak }}
              </td>

              <td class="py-3.5 px-4 text-right">
                <span class="text-sm font-black text-blue-500 tabular-nums">{{ entry.leaguePts }}</span>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <!-- Champion Banner -->
      <div v-if="isGlobal && standings.length > 0"
        class="px-4 py-3 flex items-center gap-3 bg-amber-500/10 border-t border-amber-500/20">
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="text-sm font-bold text-amber-400">
          Season Champion: <span style="color: var(--text-primary);">{{ standings[0]?.team?.name }}</span>
        </span>
        <span class="ml-auto text-xs" style="color: var(--text-muted);">{{ standings[0]?.leaguePts }} pts total</span>
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
        <p class="font-semibold" style="color: var(--text-secondary);">No standings available</p>
        <p class="text-sm mt-1" style="color: var(--text-muted);">Matches will appear here once scores are entered.</p>
      </div>
    </div>

  </div>
</template>
