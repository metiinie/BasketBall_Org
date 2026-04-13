<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeagueStore } from '@/stores/league.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const league = useLeagueStore()

const genderTab = ref('ወንድ')
const editTarget = ref(null)
const deleteTarget = ref(null)
const formLoading = ref(false)
const deleteLoading = ref(false)
const formError = ref('')
const formSuccess = ref('')
const showForm = ref(false)

const form = ref({ name: '', gender: 'ወንድ', logo_url: '' })

const filteredTeams = computed(() =>
  league.teams.filter(t => t.gender === genderTab.value)
)

const menCount = computed(() => league.teams.filter(t => t.gender === 'ወንድ').length)
const womenCount = computed(() => league.teams.filter(t => t.gender === 'ሴት').length)

onMounted(() => league.fetchTeams())

function startAdd() {
  editTarget.value = null
  form.value = { name: '', gender: genderTab.value, logo_url: '' }
  formError.value = ''
  formSuccess.value = ''
  showForm.value = true
}

function startEdit(team) {
  editTarget.value = team
  form.value = { name: team.name, gender: team.gender, logo_url: team.logo_url || '' }
  formError.value = ''
  formSuccess.value = ''
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelForm() {
  editTarget.value = null
  showForm.value = false
  form.value = { name: '', gender: genderTab.value, logo_url: '' }
  formError.value = ''
}

async function handleSubmit() {
  if (!form.value.name.trim()) { formError.value = 'Team name is required.'; return }
  formLoading.value = true
  formError.value = ''
  formSuccess.value = ''
  try {
    if (editTarget.value) {
      await league.updateTeam(editTarget.value.id, {
        name: form.value.name.trim(),
        gender: form.value.gender,
        logo_url: form.value.logo_url || null,
      })
      formSuccess.value = 'Team updated.'
    } else {
      await league.createTeam({
        name: form.value.name.trim(),
        gender: form.value.gender,
        logo_url: form.value.logo_url || null,
      })
      formSuccess.value = 'Team added to the league.'
    }
    cancelForm()
    await league.fetchTeams()
    setTimeout(() => formSuccess.value = '', 3000)
  } catch (e) {
    formError.value = e.message || 'Failed to save team.'
  } finally {
    formLoading.value = false
  }
}

async function handleDelete() {
  deleteLoading.value = true
  try {
    await league.deleteTeam(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (e) {
    formError.value = e.message
  } finally {
    deleteLoading.value = false
  }
}

function teamInitial(team) {
  return team?.name?.charAt(0)?.toUpperCase() ?? '?'
}

// Color palette for team avatars
const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
]
function avatarColor(team) {
  const idx = (team.name?.charCodeAt(0) ?? 0) % avatarColors.length
  return avatarColors[idx]
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 animate-fade-in">

    <!-- ── Page Header ── -->
    <div class="flex items-start justify-between mb-8">
      <div class="flex items-center gap-3">
        <button @click="router.back()" class="btn-icon mt-0.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Team Manager</h1>
          <p class="text-xs text-slate-400 mt-0.5">Manage league teams and divisions</p>
        </div>
      </div>

      <button @click="startAdd" class="btn-primary gap-2 px-4 py-2 shadow-sm shadow-blue-600/20">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Team
      </button>
    </div>

    <!-- ── Stats Row ── -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card p-4 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-lg font-bold text-slate-900 leading-none">{{ league.teams.length }}</p>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Teams</p>
        </div>
      </div>

      <div class="card p-4 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
          <span class="text-sm font-bold text-indigo-600">♂</span>
        </div>
        <div>
          <p class="text-lg font-bold text-slate-900 leading-none">{{ menCount }}</p>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Men's Division</p>
        </div>
      </div>

      <div class="card p-4 flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
          <span class="text-sm font-bold text-rose-500">♀</span>
        </div>
        <div>
          <p class="text-lg font-bold text-slate-900 leading-none">{{ womenCount }}</p>
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Women's Division</p>
        </div>
      </div>
    </div>

    <!-- ── Add/Edit Form Drawer ── -->
    <Transition name="slide-form">
      <div v-if="showForm" class="mb-6">
        <div class="card p-5 border-blue-200 bg-blue-50/30">
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg v-if="!editTarget" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900">{{ editTarget ? `Editing "${editTarget.name}"` : 'Add New Team' }}</p>
                <p class="text-[10px] text-slate-500">{{ editTarget ? 'Update the details below' : 'Fill in the team details' }}</p>
              </div>
            </div>
            <button @click="cancelForm" class="btn-icon w-7 h-7 rounded-md">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="flex flex-col sm:flex-row gap-4 items-end">
            <!-- Name -->
            <div class="flex-1 min-w-0">
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Team Name</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Hawassa City BC"
                class="input-field"
                autofocus
              />
            </div>

            <!-- Division -->
            <div class="flex-shrink-0">
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Division</label>
              <div class="flex gap-1.5">
                <button
                  type="button"
                  @click="form.gender = 'ወንድ'"
                  :class="[
                    'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
                    form.gender === 'ወንድ'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  ]"
                >♂ Men</button>
                <button
                  type="button"
                  @click="form.gender = 'ሴት'"
                  :class="[
                    'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
                    form.gender === 'ሴት'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  ]"
                >♀ Women</button>
              </div>
            </div>

            <!-- Logo URL -->
            <div class="flex-1 min-w-0">
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Logo URL <span class="text-slate-400 font-normal">(optional)</span></label>
              <input
                v-model="form.logo_url"
                type="url"
                placeholder="https://..."
                class="input-field"
              />
            </div>

            <!-- Submit -->
            <div class="flex gap-2 flex-shrink-0">
              <button type="submit" :disabled="formLoading" class="btn-primary px-4 py-2 shadow-sm shadow-blue-600/20">
                <svg v-if="formLoading" class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ formLoading ? 'Saving…' : (editTarget ? 'Save' : 'Add') }}
              </button>
            </div>
          </form>

          <!-- Feedback -->
          <Transition name="fade">
            <p v-if="formError" class="mt-3 text-xs text-red-600 font-medium">⚠ {{ formError }}</p>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- ── Division Tabs + Team List ── -->
    <div class="card overflow-hidden">

      <!-- Tab Bar -->
      <div class="flex border-b border-slate-200 bg-slate-50">
        <button
          @click="genderTab = 'ወንድ'"
          :class="[
            'flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-px',
            genderTab === 'ወንድ'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          ]"
        >
          ♂ Men's Division
          <span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold" :class="genderTab === 'ወንድ' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'">{{ menCount }}</span>
        </button>
        <button
          @click="genderTab = 'ሴት'"
          :class="[
            'flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-px',
            genderTab === 'ሴት'
              ? 'border-rose-500 text-rose-600 bg-white'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          ]"
        >
          ♀ Women's Division
          <span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold" :class="genderTab === 'ሴት' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'">{{ womenCount }}</span>
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="league.loading" class="p-4 space-y-2">
        <div v-for="i in 5" :key="i"
          class="h-14 rounded-lg bg-slate-100 animate-pulse"/>
      </div>

      <!-- Team Table -->
      <div v-else-if="filteredTeams.length > 0">
        <div
          v-for="(team, index) in filteredTeams"
          :key="team.id"
          :class="[
            'flex items-center px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group',
            editTarget?.id === team.id ? 'bg-blue-50' : ''
          ]"
        >
          <!-- Rank Number -->
          <span class="w-6 text-xs font-bold text-slate-300 mr-4 text-right flex-shrink-0">{{ index + 1 }}</span>

          <!-- Avatar + Name -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div :class="['w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden text-white', team.logo_url ? '' : avatarColor(team)]">
              <img v-if="team.logo_url" :src="team.logo_url" :alt="team.name" class="w-full h-full object-cover rounded-lg"/>
              <span v-else class="text-xs font-bold">{{ teamInitial(team) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ team.name }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ team.gender === 'ወንድ' ? "Men's Division" : "Women's Division" }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="startEdit(team)"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              Edit
            </button>
            <button
              @click="deleteTarget = team"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-16 flex flex-col items-center text-center gap-3 bg-white">
        <div class="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
          <svg class="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-500">No teams in this division</p>
          <p class="text-xs text-slate-400 mt-0.5">Click <strong>Add Team</strong> above to get started</p>
        </div>
      </div>

    </div>

    <!-- ── Delete Confirm ── -->
    <ConfirmDialog
      v-if="deleteTarget"
      title="Remove Team?"
      :message="`Remove '${deleteTarget?.name}' from the league? This may affect associated match records.`"
      confirm-label="Remove"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-form-enter-active { transition: all 0.25s ease-out; }
.slide-form-leave-active { transition: all 0.2s ease-in; }
.slide-form-enter-from { opacity: 0; transform: translateY(-8px); }
.slide-form-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
