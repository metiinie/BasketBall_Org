<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLeagueStore } from '@/stores/league.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const league = useLeagueStore()

const genderTab = ref('Male')
const showForm = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const formLoading = ref(false)
const deleteLoading = ref(false)
const formError = ref('')

const form = ref({ name: '', gender: 'Male', logo_url: '' })

const filteredTeams = computed(() =>
  league.teams.filter(t => t.gender === genderTab.value)
)

onMounted(() => league.fetchTeams())

function openAddForm() {
  editTarget.value = null
  form.value = { name: '', gender: genderTab.value, logo_url: '' }
  formError.value = ''
  showForm.value = true
}

function openEditForm(team) {
  editTarget.value = team
  form.value = { name: team.name, gender: team.gender, logo_url: team.logo_url || '' }
  formError.value = ''
  showForm.value = true
}

function closeForm() { showForm.value = false; editTarget.value = null }

async function handleSubmit() {
  if (!form.value.name.trim()) { formError.value = 'Team name is required.'; return }
  formLoading.value = true
  formError.value = ''
  try {
    if (editTarget.value) {
      await league.updateTeam(editTarget.value.id, {
        name: form.value.name.trim(),
        gender: form.value.gender,
        logo_url: form.value.logo_url || null,
      })
    } else {
      await league.createTeam({
        name: form.value.name.trim(),
        gender: form.value.gender,
        logo_url: form.value.logo_url || null,
      })
    }
    closeForm()
    await league.fetchTeams()
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
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">Team Manager</h1>
        <p class="text-gray-500 text-sm mt-1">Manage league teams by gender division</p>
      </div>
      <RouterLink to="/admin" class="btn-ghost text-sm py-2 px-3">← Back</RouterLink>
    </div>

    <!-- Gender Tab -->
    <div class="flex gap-2">
      <button v-for="g in ['Male', 'Female']" :key="g"
        @click="genderTab = g; league.fetchTeams(g)"
        :class="[
          'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
          genderTab === g
            ? 'bg-ebf-orange text-white border-ebf-orange shadow-lg shadow-ebf-orange/25'
            : 'bg-navy-800/60 text-gray-400 border-navy-600 hover:text-white'
        ]">
        {{ g === 'Male' ? '♂' : '♀' }} {{ g }}
      </button>
    </div>

    <!-- Add Team Button -->
    <button @click="openAddForm" class="btn-primary w-full flex items-center justify-center gap-2">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Add {{ genderTab }} Team
    </button>

    <!-- Error -->
    <div v-if="formError" class="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
      {{ formError }}
    </div>

    <!-- Team List -->
    <div v-if="league.loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-16 rounded-xl bg-navy-800/60 animate-pulse" />
    </div>

    <div v-else-if="filteredTeams.length > 0" class="space-y-2">
      <div v-for="team in filteredTeams" :key="team.id"
        class="card px-4 py-3 flex items-center gap-3 group">
        <!-- Avatar -->
        <div class="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-sm font-black text-ebf-orange flex-shrink-0 overflow-hidden">
          <img v-if="team.logo_url" :src="team.logo_url" class="w-full h-full object-cover" />
          <span v-else>{{ teamInitial(team) }}</span>
        </div>
        <!-- Name -->
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-white truncate">{{ team.name }}</p>
          <p class="text-xs text-gray-500">{{ team.gender }} Division</p>
        </div>
        <!-- Actions -->
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openEditForm(team)"
            class="p-1.5 rounded-lg text-gray-500 hover:text-ebf-orange hover:bg-ebf-orange/10 transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button @click="deleteTarget = team"
            class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="card p-10 text-center">
      <p class="text-gray-500">No {{ genderTab }} teams yet. Add one above.</p>
    </div>

    <!-- Add / Edit Form Modal -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="closeForm">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeForm" />
        <div class="relative card p-6 w-full max-w-sm animate-slide-up space-y-4">
          <h3 class="text-lg font-bold text-white">{{ editTarget ? 'Edit Team' : 'Add New Team' }}</h3>

          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Team Name *</label>
            <input v-model="form.name" type="text" placeholder="e.g. Hawassa City" class="input-field" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Division</label>
            <select v-model="form.gender" class="input-field">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1.5">Logo URL (optional)</label>
            <input v-model="form.logo_url" type="url" placeholder="https://..." class="input-field" />
          </div>

          <div v-if="formError" class="text-red-400 text-sm px-3 py-2 rounded-lg bg-red-500/10">{{ formError }}</div>

          <div class="flex gap-3 pt-2">
            <button @click="closeForm" class="flex-1 btn-ghost" :disabled="formLoading">Cancel</button>
            <button @click="handleSubmit" class="flex-1 btn-primary" :disabled="formLoading">
              <span v-if="formLoading">Saving...</span>
              <span v-else>{{ editTarget ? 'Save Changes' : 'Add Team' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <ConfirmDialog
      v-if="deleteTarget"
      title="Delete Team?"
      :message="`'${deleteTarget?.name}' will be permanently removed. Match history referencing this team may be affected.`"
      confirm-label="Delete"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
