<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Search, Edit, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AdminHeader from '@/components/AdminHeader.vue'
import Footer from '@/components/Footer.vue'
import { usePizzaStore } from '@/stores/pizza'
import type { Pizza } from '@/models/pizza'
import { toBase64 } from '@/plugins/convert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
const pizza = usePizzaStore()
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const deleteConfirmationOpen = ref(false)

// Form data for adding/editing items
const formData = ref<Partial<Pizza>>({
  pizzaId: null,
  pizzaName: '',
  pizzaDescription: '',
  pizzaCategory: '',
  pizzaPrice: 0,
  pizzaImage: null,
})

const resetForm = () => {
  formData.value = {
    pizzaId: null,
    pizzaName: '',
    pizzaDescription: '',
    pizzaCategory: '',
    pizzaPrice: 0,
    pizzaImage: null,
  }
}

const openAddModal = () => {
  resetForm()
  isAddModalOpen.value = true
}

const openEditModal = (item: Pizza) => {
  console.table(item)
  formData.value = {
    pizzaId: item.pizzaId,
    pizzaName: item.pizzaName,
    pizzaDescription: item.pizzaDescription,
    pizzaCategory: item.pizzaCategory,
    pizzaPrice: item.pizzaPrice,
    isAvailable: item.isAvailable,
    pizzaImage: null,
  }
  isEditModalOpen.value = true
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.pizzaImage = target.files[0]
  }
}

const handleSubmit = () => {
  if (isAddModalOpen.value) {
    isAddModalOpen.value = false
  }
  pizza.createPizza(formData.value as Partial<Pizza>)
  resetForm()
}

const handleUpdateSubmit = () => {
  if (isEditModalOpen.value) {
    isEditModalOpen.value = false
  }
  pizza.updatePizza(formData.value as Partial<Pizza>)
  resetForm()
}

const categories = computed(() => {
  return ['All Pizzas', 'Veggie', 'Meat Lovers', 'Premium Specials', 'Seasonal Picks']
})

const handleDelete = async (id: number) => {
  // if (confirm('Are you sure you want to delete this menu item?')) {
  //   menuStore.deleteMenuItem(id)
  // }
  await pizza.deletePizza(id)
  deleteConfirmationOpen.value = false
}

// const toggleAvailability = (item: MenuItem) => {
//   menuStore.updateMenuItem(item.id, { isAvailable: !item.isAvailable })
// }

// Pagination
const currentPage = ref(1)
const itemsPerPage = 8

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMenuItems.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredMenuItems.value.length / itemsPerPage)),
)

const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
const searchQuery = ref('')
const selectedCategory = ref('All Pizzas')
const sortBy = ref('')
const filteredMenuItems = computed(() => {
  let filtered = pizza.pizzas.filter((p) => !p.isDeleted)

  // Filter by search query
  if (searchQuery.value) {
    filtered = filtered.filter(
      (item) =>
        item.pizzaName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.pizzaDescription.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  // Filter by category
  if (selectedCategory.value !== 'All Pizzas') {
    filtered = filtered.filter((item) => item.pizzaCategory === selectedCategory.value)
  }

  // Sort items
  if (sortBy.value) {
    switch (sortBy.value) {
      case 'name':
        filtered.sort((a, b) => (a.pizzaName || '').localeCompare(b.pizzaName || ''))
        break
      case 'price-low':
        filtered.sort((a, b) => (a.pizzaPrice || 0) - (b.pizzaPrice || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.pizzaPrice || 0) - (a.pizzaPrice || 0))
        break
      case 'category':
        filtered.sort((a, b) => (a.pizzaCategory || '').localeCompare(b.pizzaCategory || ''))
        break
    }
  }

  return filtered
})

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = newTotal
  }
})

onMounted(async () => {
  await pizza.fetchAll()

  console.log(pizza.pizzas)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AdminHeader />

    <!-- Main Content -->
    <main class="w-screen px-4 sm:px-8 lg:px-30 py-8">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
          <p class="text-gray-600">Add, edit, and manage your pizza menu items</p>
        </div>
        <button
          @click="openAddModal"
          class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus class="h-4 w-4" />
          Add New Pizza
        </button>
      </div>

      <!-- Category Filters and Search Controls -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:text-gray-900',
            ]"
          >
            {{ category }}
          </button>
        </div>

        <!-- Search and Controls -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search pizzas..."
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div class="flex gap-2">
            <select
              v-model="sortBy"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="" disabled>Sort by</option>
              <option value="name">Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Menu Items Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div
          v-for="item in paginatedItems"
          :key="item.pizzaId!"
          class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div class="h-48 bg-gray-700 flex items-center justify-center relative">
            <img
              v-if="item.pizzaImage"
              :src="toBase64(item.pizzaImage as string)"
              :alt="item.pizzaName"
              class="w-full h-full object-cover"
              @error="
                (e: Event) => {
                  const img = e.target as HTMLImageElement
                  img.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkLU8L3RleHQ+Cjwvc3ZnPg=='
                }
              "
            />
            <div v-else class="text-6xl">🍕</div>
          </div>

          <div class="p-4">
            <h3 class="text-lg font-semibold text-primary mb-1">{{ item.pizzaName }}</h3>
            <p class="text-gray-300 text-sm mb-3 line-clamp-2">{{ item.pizzaDescription }}</p>

            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-1">
                <Star class="h-4 w-4 text-yellow-400 fill-current" />
                <span class="text-white text-sm">0 (0)</span>
              </div>
              <span class="text-xl font-bold text-primary">₱{{ item.pizzaPrice }}</span>
            </div>

            <div class="flex justify-between items-center">
              <div class="flex gap-2">
                <button
                  @click="openEditModal(item)"
                  class="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <Dialog v-model:open="deleteConfirmationOpen">
                  <DialogTrigger>
                    <button class="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cancel Order</DialogTitle>
                    </DialogHeader>
                    <div>Are you sure you want to cancel this order?</div>

                    <DialogFooter class="flex justify-end space-x-2">
                      <Button variant="outline" @click="deleteConfirmationOpen = false">No</Button>
                      <Button @click="handleDelete(item.pizzaId!)">Yes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredMenuItems.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🍕</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No menu items found</h3>
        <p class="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
        <button
          @click="openAddModal"
          class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Add Your First Pizza
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>

        <button
          v-for="page in pageNumbers"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPage === page ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ page }}
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
            <button @click="isAddModalOpen = false" class="text-gray-400 hover:text-gray-600 p-1">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
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
                      v-model="formData.pizzaName"
                      type="text"
                      placeholder="e.g. Supreme Margherita"
                      maxlength="50"
                      class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <div class="absolute right-3 top-2 text-xs text-gray-500">
                      {{ formData.pizzaName!.length }}/50
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Pizza Description<span class="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    v-model="formData.pizzaDescription"
                    placeholder="Fresh mozzarella, vine-ripened tomatoes, and aromatic basil on our signature thin crust"
                    maxlength="200"
                    rows="4"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  ></textarea>
                  <div class="flex justify-between items-center mt-1">
                    <span class="text-xs text-gray-500"
                      >Describe your pizza's unique flavors and ingredients</span
                    >
                    <span class="text-xs text-gray-500"
                      >{{ formData.pizzaDescription!.length }}/200</span
                    >
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Category<span class="text-red-500 ml-1">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.pizzaCategory"
                      class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white"
                    >
                      <option value="">Select a category</option>
                      <option v-for="category in categories" :key="category" :value="category">
                        {{ category }}
                      </option>
                    </select>
                    <div
                      class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
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
                <div
                  class="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors bg-gray-50"
                >
                  <input
                    type="file"
                    @change="handleImageUpload"
                    accept="image/jpeg,image/png,image/webp"
                    class="hidden"
                    id="image-upload"
                  />
                  <label for="image-upload" class="cursor-pointer flex flex-col items-center">
                    <div
                      class="w-16 h-16 mb-4 bg-gray-200 rounded-lg flex items-center justify-center"
                    >
                      <svg
                        class="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p class="text-gray-600 font-medium text-center">
                      Drag & drop an image here, or click to browse
                    </p>
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
                      v-model.number="formData.pizzaPrice"
                      type="number"
                      placeholder="695"
                      class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
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
            <button @click="isEditModalOpen = false" class="text-gray-400 hover:text-gray-600">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
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
                    v-model="formData.pizzaName"
                    type="text"
                    placeholder="e.g., Supreme Margherita"
                    maxlength="50"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p class="text-xs text-gray-500 mt-1">{{ formData.pizzaName!.length }}/50</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    v-model="formData.pizzaCategory"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a category</option>
                    <option v-for="category in categories" :key="category" :value="category">
                      {{ category }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Pizza Description</label
                >
                <textarea
                  v-model="formData.pizzaDescription"
                  placeholder="Fresh mozzarella, vine-ripened tomatoes, and aromatic basil on our signature thin crust"
                  maxlength="200"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formData.pizzaDescription!.length }}/200
                </p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Pizza Image</h3>
              <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              >
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
                      v-model.number="formData.pizzaPrice"
                      type="number"
                      placeholder="695"
                      class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
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
            @click="handleUpdateSubmit"
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Update Pizza
          </button>
        </div>
      </div>
    </div>
    <Footer />
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
