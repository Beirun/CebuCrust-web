<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMenuStore, type MenuItem, type MenuItemInput } from '@/stores/menu'
import { Plus, Search, Filter, Edit, Trash2, Star, ChevronLeft, ChevronRight, Bell, ChevronDown } from 'lucide-vue-next'

const menuStore = useMenuStore()

const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const editingItem = ref<MenuItem | null>(null)

// Form data for adding/editing items
const formData = ref<MenuItemInput>({
  name: '',
  description: '',
  category: '',
  price: 0,
  image: null,
  isAvailable: true,
  rating: 4.5
})

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    category: '',
    price: 0,
    image: null,
    isAvailable: true,
    rating: 4.5
  }
}

const openAddModal = () => {
  resetForm()
  isAddModalOpen.value = true
}

const openEditModal = (item: MenuItem) => {
  editingItem.value = item
  formData.value = {
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price,
    image: null,
    isAvailable: item.isAvailable,
    rating: item.rating
  }
  isEditModalOpen.value = true
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.image = target.files[0]
  }
}

const handleSubmit = () => {
  if (isAddModalOpen.value) {
    menuStore.addMenuItem(formData.value)
    isAddModalOpen.value = false
  } else if (isEditModalOpen.value && editingItem.value) {
    menuStore.updateMenuItem(editingItem.value!.id, formData.value)
    isEditModalOpen.value = false
  }
  resetForm()
}

const handleDelete = (id: string) => {
  if (confirm('Are you sure you want to delete this menu item?')) {
    menuStore.deleteMenuItem(id)
  }
}

const toggleAvailability = (item: MenuItem) => {
  menuStore.updateMenuItem(item.id, { isAvailable: !item.isAvailable })
}

// Pagination
const currentPage = ref(1)
const itemsPerPage = 8

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return menuStore.filteredMenuItems.slice(start, end)
})

// Always show multiple pages like in the GUI (minimum 3 pages)
const totalPages = computed(() => {
  const actualPages = Math.ceil(menuStore.filteredMenuItems.length / itemsPerPage)
  return Math.max(actualPages, 3) // Always show at least 3 pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= 12) {
    currentPage.value = page
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-[#121A1D] text-white">
      <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div class="flex justify-between items-center h-20 py-4">
          <!-- Logo -->
          <div class="flex items-center">
            <div>
              <img src="@/assets/logo.png" alt="Cebu Crust" />
            </div>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex space-x-10">
            <router-link to="/admin" class="text-gray-300 hover:text-white font-medium px-3 py-2">Dashboard</router-link>
            <router-link to="/admin/menu" class="text-orange-400 font-medium px-3 py-2">Menu</router-link>
            <router-link to="/admin/orders" class="text-gray-300 hover:text-white font-medium px-3 py-2">Orders</router-link>
          </nav>

          <!-- User & Notifications -->
          <div class="flex items-center space-x-6">
            <div class="relative">
              <button class="text-gray-300 hover:text-white relative p-2">
                <Bell class="h-6 w-6" />
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </button>
            </div>
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium">MS</span>
              </div>
              <span class="text-gray-300 font-medium">Maria Santos</span>
              <ChevronDown class="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p class="text-gray-600">Add, edit, and manage your pizza menu items</p>
        </div>
        <button
          @click="openAddModal"
          class="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus class="h-4 w-4" />
          Add New Pizza
        </button>
      </div>

      <!-- Category Filters and Search Controls -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div class="flex flex-wrap gap-2">
          <button
                v-for="category in menuStore.categories"
                :key="category"
            @click="menuStore.selectedCategory = category"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              menuStore.selectedCategory === category
                ? 'bg-orange-400 text-white'
                : 'text-gray-700 hover:text-gray-900'
            ]"
              >
                {{ category }}
          </button>
          </div>

        <!-- Search and Controls -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative">
            <input
              v-model="menuStore.searchQuery"
              type="text"
              placeholder="Search orders..."
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64"
            />
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <button class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter class="h-4 w-4" />
            <span>Filter</span>
          </button>

          <button class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span>Sort</span>
          </button>
        </div>
      </div>

      <!-- Menu Items Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div
          v-for="item in paginatedItems"
          :key="item.id"
          class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div class="h-48 bg-gray-700 flex items-center justify-center relative">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.name"
              class="w-full h-full object-cover"
              @error="$event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkLU8L3RleHQ+Cjwvc3ZnPg=='"
            />
            <div v-else class="text-6xl">🍕</div>
          </div>

          <div class="p-4">
            <h3 class="text-lg font-semibold text-orange-400 mb-1">{{ item.name }}</h3>
            <p class="text-gray-300 text-sm mb-3 line-clamp-2">{{ item.description }}</p>

            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-1">
                <Star class="h-4 w-4 text-yellow-400 fill-current" />
                <span class="text-white text-sm">{{ item.rating }} (124)</span>
              </div>
              <span class="text-xl font-bold text-orange-400">₱{{ item.price }}</span>
            </div>

            <div class="flex justify-between items-center">
              <div class="flex gap-2">
                <button
                  @click="openEditModal(item)"
                  class="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <button
                  @click="handleDelete(item.id)"
                  class="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>

              <button
                @click="toggleAvailability(item)"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-800',
                  item.isAvailable ? 'bg-orange-400' : 'bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="menuStore.filteredMenuItems.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🍕</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No menu items found</h3>
        <p class="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
        <button
          @click="openAddModal"
          class="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors"
        >
          Add Your First Pizza
        </button>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center items-center space-x-2">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>

        <button
          v-for="page in 3"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPage === page
              ? 'bg-orange-400 text-white'
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          {{ page }}
        </button>

        <span class="px-2 text-gray-500">...</span>

        <button
          @click="goToPage(12)"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPage === 12
              ? 'bg-orange-400 text-white'
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          12
        </button>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </main>

    <!-- Footer from Landing Page -->
    <div class="bg-[#121A1D] h-70 w-screen flex flex-col px-30 pt-8 text-[#797B78] justify-between">
      <div class="flex w-full justify-between gap-40">
        <div class="w-150 flex flex-col gap-2">
          <div>
            <img src="@/assets/logo.png" alt="" />
          </div>
          <div>
            Lorem ipsum dolor sit amet consectetur. Tristique cursus morbi nibh nec et vulputate.
            Turpis tortor nisi imperdiet quis accumsan. Ligula netus amet leo ultricies. Neque
            venenatis magnis amet eget sagittis leo enim.
          </div>
        </div>

        <div class="flex flex-col w-120 gap-6">
          <div class="text-white text-xl font-bold">Opening Time</div>
          <div>Mon - Wed: 09:00am - 10:00pm</div>
          <div>Thu - Sat: 09:00am - 9:00pm</div>
          <div>Sun: Closed</div>
        </div>

        <div class="flex flex-col w-100 gap-6">
          <div class="text-white text-xl font-bold">User Link</div>
          <div>About Us</div>
          <div>Contact Us</div>
          <div>Order Delivery</div>
        </div>

        <div class="flex flex-col w-100 gap-6">
          <div class="text-white text-xl font-bold">Contact Us</div>
          <div>
            <div>543 Country Club Ave</div>
            <div>NC 27587, London, UK</div>
          </div>

          <div>+1257 6541120</div>
        </div>
      </div>
    </div>
    <div class="bg-[#121A1D] flex justify-between px-30 py-8 text-[#797B78]">
      <div class="flex w-full justify-between">
        <div>©2024 ARR, All right reserved</div>
        <div class="flex gap-8">
          <button>Privacy Policy</button>
          <button>Terms of Use</button>
        </div>
      </div>
    </div>

    <!-- Add New Pizza Modal -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Add New Pizza</h2>
              <p class="text-sm text-gray-600 mt-1">Create a new pizza item for your menu</p>
            </div>
            <button
              @click="isAddModalOpen = false"
              class="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left Column -->
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Pizza Name<span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
              <input
                v-model="formData.name"
                type="text"
                      placeholder="e.g. Supreme Margherita"
                maxlength="50"
                      class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    />
                    <div class="absolute right-3 top-2 text-xs text-gray-500">
                      {{ formData.name.length }}/50
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Pizza Description<span class="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    v-model="formData.description"
                    placeholder="Fresh mozzarella, vine-ripened tomatoes, and aromatic basil on our signature thin crust"
                    maxlength="200"
                    rows="4"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none"
                  ></textarea>
                  <div class="flex justify-between items-center mt-1">
                    <span class="text-xs text-gray-500">Describe your pizza's unique flavors and ingredients</span>
                    <span class="text-xs text-gray-500">{{ formData.description.length }}/200</span>
                  </div>
            </div>

            <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Category<span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
              <select
                v-model="formData.category"
                      class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 appearance-none bg-white"
              >
                <option value="">Select a category</option>
                <option
                  v-for="category in menuStore.categories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
            </div>
          </div>
          </div>
        </div>

            <!-- Right Column -->
            <div class="space-y-6">
        <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  Pizza Image<span class="text-red-500 ml-1">*</span>
                </h3>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors bg-gray-50">
            <input
              type="file"
              @change="handleImageUpload"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              id="image-upload"
            />
                  <label for="image-upload" class="cursor-pointer flex flex-col items-center">
                    <div class="w-16 h-16 mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p class="text-gray-600 font-medium text-center">Drag & drop an image here, or click to browse</p>
                    <p class="text-sm text-gray-500 mt-2">JPG, PNG, WEBP (Max 5MB)</p>
            </label>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Pricing & Availability</h3>
            <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Pizza Price<span class="text-red-500 ml-1">*</span>
                  </label>
              <div class="relative">
                    <span class="absolute left-3 top-2 text-gray-500 font-medium">₱</span>
                <input
                  v-model.number="formData.price"
                  type="number"
                  placeholder="695"
                      class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    />
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="isAddModalOpen = false"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
            class="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500 transition-colors flex items-center gap-2"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Menu
        </button>
        </div>
      </div>
    </div>

    <!-- Edit Pizza Modal -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Edit Pizza</h2>
            <button
              @click="isEditModalOpen = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pizza Name</label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="e.g., Supreme Margherita"
                maxlength="50"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p class="text-xs text-gray-500 mt-1">{{ formData.name.length }}/50</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                v-model="formData.category"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select a category</option>
                <option
                  v-for="category in menuStore.categories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Pizza Description</label>
            <textarea
              v-model="formData.description"
              placeholder="Fresh mozzarella, vine-ripened tomatoes, and aromatic basil on our signature thin crust"
              maxlength="200"
              rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">{{ formData.description.length }}/200</p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Pizza Image</h3>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              @change="handleImageUpload"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              id="edit-image-upload"
            />
            <label for="edit-image-upload" class="cursor-pointer">
              <div class="text-4xl mb-2">📷</div>
              <p class="text-gray-600">Drag & drop an image here, or click to browse</p>
              <p class="text-sm text-gray-500 mt-1">JPG, PNG, WEBP, Max 5MB</p>
            </label>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Pricing & Availability</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pizza Price</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">₱</span>
                <input
                  v-model.number="formData.price"
                  type="number"
                  placeholder="695"
                      class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            <div class="flex items-center">
              <input
                v-model="formData.isAvailable"
                type="checkbox"
                id="edit-available"
                    class="h-4 w-4 text-orange-400 focus:ring-orange-400 border-gray-300 rounded"
              />
              <label for="edit-available" class="ml-2 text-sm text-gray-700">Available for order</label>
                </div>
            </div>
          </div>
        </div>
      </div>

        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
        <button
          @click="isEditModalOpen = false"
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
            class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Update Pizza
        </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
