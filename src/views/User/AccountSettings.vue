<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toBase64 } from '@/plugins/convert'
import UserHeader from '@/components/UserHeader.vue'
const auth = useAuthStore()
const router = useRouter()

// Use the auth store's user directly so the UI reflects the currently logged in user
// Make a local editable copy to avoid mutating the store directly until Save is clicked
const user = ref(auth.user ? { ...auth.user } : {})

const preview = ref<string | null>(user.value?.profileImage || user.value?.profileImageUrl || null)

// Keep local user in sync if auth.user changes (e.g. login/logout elsewhere)
watch(
  () => auth.user,
  (val) => {
    user.value = val ? { ...val } : {}
    preview.value = user.value?.profileImage || user.value?.profileImageUrl || null
  },
  { immediate: true },
)

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result as string
    // set a preview value and store it on the local user object
    user.value.profileImage = preview.value
  }
  reader.readAsDataURL(file)
}

const save = async () => {
  // Prepare updates to send to the store / API. Map possible field names used by the backend.
  const updates: Record<string, unknown> = {}
  if (user.value.firstName !== undefined) updates.firstName = user.value.firstName
  if (user.value.lastName !== undefined) updates.lastName = user.value.lastName
  if (user.value.email !== undefined) updates.email = user.value.email
  if (user.value.userEmail !== undefined) updates.email = user.value.userEmail
  if (user.value.phone !== undefined) updates.phoneNumber = user.value.phone
  if (user.value.phoneNumber !== undefined) updates.phoneNumber = user.value.phoneNumber
  if (user.value.address !== undefined) updates.address = user.value.address
  if (user.value.profileImage !== undefined) updates.profileImage = user.value.profileImage

  // Call auth.update if available to persist changes to backend
  if (typeof auth.update === 'function') {
    const success = await auth.update(updates)
    if (success) {
      // merge returned/local changes into store and localStorage
      auth.user = { ...auth.user, ...user.value }
      localStorage.setItem('user', JSON.stringify(auth.user))
      // navigate back to dashboard after save
      router.push('/dashboard')
    }
  } else {
    // fallback: update store and localStorage directly
    auth.user = { ...auth.user, ...user.value }
    localStorage.setItem('user', JSON.stringify(auth.user))
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header/Navbar (copied from Dashboard.vue) -->
    <UserHeader />

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="flex items-center gap-6 mb-8">
          <div
            class="w-28 h-28 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="preview"
              :src="toBase64(preview)"
              alt="profile"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-gray-300">No Image</div>
          </div>
          <div>
            <h2 class="text-2xl font-semibold">Account Settings</h2>
            <p class="text-gray-600">Manage your profile information</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700">First name</label>
            <input
              v-model="user.firstName"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700">Last name</label>
            <input
              v-model="user.lastName"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="user.email"
              type="email"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input
              v-model="user.phoneNo"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Profile Picture</label>
            <div class="mt-2 flex items-center gap-4">
              <input type="file" accept="image/*" @change="onFileChange" />
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button
            @click="save"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
