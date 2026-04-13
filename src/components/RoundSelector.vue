<script setup>
defineProps({
  rounds: { type: Array, default: () => [] },
  modelValue: { type: String, default: null }, // selected round id or 'global'
  showGlobal: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const statusColors = {
  Active: 'text-green-400 border-green-400/40',
  Completed: 'text-blue-400 border-blue-400/40',
  Pending: 'text-gray-500 border-gray-600',
}
</script>

<template>
  <div class="w-full">
    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
      <!-- Round Pills -->
      <button
        v-for="round in rounds"
        :key="round.id"
        @click="emit('update:modelValue', round.id)"
        :class="[
          'snap-start flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200',
          modelValue === round.id
            ? 'bg-ebf-orange text-white border-ebf-orange shadow-lg shadow-ebf-orange/30'
            : 'bg-navy-800/60 border-navy-600 text-gray-400 hover:border-ebf-orange/50 hover:text-white',
        ]"
      >
        <span class="text-xs font-medium">{{ round.season_year }}</span>
        <span class="font-bold">Round {{ round.round_number }}</span>
        <span :class="['text-[11px] mt-0.5', modelValue === round.id ? 'text-white/80' : statusColors[round.status] || 'text-gray-500']">
          {{ round.status }}
        </span>
      </button>

      <!-- Global Season -->
      <button
        v-if="showGlobal"
        @click="emit('update:modelValue', 'global')"
        :class="[
          'snap-start flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200',
          modelValue === 'global'
            ? 'bg-ebf-gold text-navy-950 border-ebf-gold shadow-lg shadow-ebf-gold/30'
            : 'bg-navy-800/60 border-navy-600 text-gray-400 hover:border-ebf-gold/50 hover:text-white',
        ]"
      >
        <svg class="w-4 h-4 mb-0.5" :class="modelValue === 'global' ? 'text-navy-950' : 'text-ebf-gold'"
          fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="font-bold">Global</span>
        <span class="text-[11px] mt-0.5 opacity-70">Season</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
