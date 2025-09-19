<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const user = ref({ ...auth.user })

const displayName = computed(() => user.value?.name || user.value?.userName || user.value?.username || '')

const preview = ref<string | null>(user.value?.profileImage || null)

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result as string
    user.value.profileImage = preview.value
  }
  reader.readAsDataURL(file)
}

const save = () => {
  // Update auth store and localStorage; replace with API call when available
  auth.user = { ...auth.user, ...user.value }
  localStorage.setItem('user', JSON.stringify(auth.user))
  alert('Profile updated')
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-gray-900 shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-2">
            <img src="/src/assets/logo.png" alt="Cebu Crust" class="h-8 w-auto">
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-28 h-28 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
            <img v-if="preview" :src="preview" alt="profile" class="w-full h-full object-cover" />
            <div v-else class="text-gray-300">No Image</div>
          </div>
          <div>
            <h2 class="text-2xl font-semibold">Account Settings</h2>
            <p class="text-gray-600">Manage your profile information</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700">First / Full name</label>
            <input v-model="user.name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input v-model="user.email" type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input v-model="user.phone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Address</label>
            <input v-model="user.address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Profile Picture</label>
            <div class="mt-2 flex items-center gap-4">
              <input type="file" accept="image/*" @change="onFileChange" />
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button @click="save" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">Save Changes</button>
        </div>
      </div>
    </main>
  </div>
</template>
