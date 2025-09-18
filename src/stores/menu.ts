import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  image: string
  isAvailable: boolean
  rating: number
  createdAt: string
  updatedAt: string
}

export interface MenuItemInput {
  name: string
  description: string
  category: string
  price: number
  image: File | null
  rating: number
  isAvailable: boolean
}

export const useMenuStore = defineStore('menu', () => {
  // Initialize with sample data for testing
  const menuItems = ref<MenuItem[]>([
    {
      id: '1',
      name: 'Classic Margherita',
      description: 'Fresh mozzarella, vine-ripened tomatoes, and aromatic basil on our signature thin crust',
      category: 'Veggie',
      price: 695,
      image: '/pizza-margherita.jpg',
      isAvailable: true,
      rating: 4.8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Pepperoni Supreme',
      description: 'Premium pepperoni, mozzarella cheese, and our signature tomato sauce',
      category: 'Meat Lovers',
      price: 485,
      image: '/pizza-pepperoni.jpg',
      isAvailable: true,
      rating: 4.9,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'BBQ Chicken Deluxe',
      description: 'Grilled chicken, red onions, bell peppers, and tangy BBQ sauce',
      category: 'Premium Specials',
      price: 795,
      image: '/pizza-bbq-chicken.jpg',
      isAvailable: true,
      rating: 4.7,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'Hawaiian Paradise',
      description: 'Ham, pineapple, mozzarella cheese, and sweet tomato sauce',
      category: 'Seasonal Picks',
      price: 625,
      image: '/pizza-hawaiian.jpg',
      isAvailable: true,
      rating: 4.6,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '5',
      name: 'Veggie Supreme',
      description: 'Bell peppers, mushrooms, onions, olives, and fresh tomatoes',
      category: 'Veggie',
      price: 575,
      image: '/pizza-veggie.jpg',
      isAvailable: true,
      rating: 4.5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '6',
      name: 'Meat Lovers Feast',
      description: 'Pepperoni, sausage, ham, bacon, and ground beef with mozzarella',
      category: 'Meat Lovers',
      price: 825,
      image: '/pizza-meat-lovers.jpg',
      isAvailable: true,
      rating: 4.8,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '7',
      name: 'Truffle Mushroom',
      description: 'Wild mushrooms, truffle oil, arugula, and parmesan cheese',
      category: 'Premium Specials',
      price: 925,
      image: '/pizza-truffle.jpg',
      isAvailable: true,
      rating: 4.9,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '8',
      name: 'Spicy Jalapeño',
      description: 'Jalapeños, pepperoni, mozzarella, and spicy tomato sauce',
      category: 'Seasonal Picks',
      price: 655,
      image: '/pizza-spicy.jpg',
      isAvailable: true,
      rating: 4.4,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ])
  const searchQuery = ref('')
  const selectedCategory = ref('All Pizzas')

  const filteredMenuItems = computed(() => {
    let filtered = menuItems.value

    if (searchQuery.value) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    if (selectedCategory.value !== 'All Pizzas') {
      filtered = filtered.filter(item => item.category === selectedCategory.value)
    }

    return filtered
  })

  const categories = computed(() => {
    return ['All Pizzas', 'Veggie', 'Meat Lovers', 'Premium Specials', 'Seasonal Picks']
  })

  const fetchMenuItems = async () => {
    try {
      // TODO: Replace with actual API call
      // Example API integration:
      // const response = await fetch('/api/menu/items')
      // const data = await response.json()
      // menuItems.value = data.items

      console.log('Menu items will be fetched from API')
    } catch (error) {
      console.error('Error fetching menu items:', error)
    }
  }

  const addMenuItem = async (itemData: MenuItemInput) => {
    try {
      // TODO: Replace with actual API call
      // Example API integration:
      // const formData = new FormData()
      // formData.append('name', itemData.name)
      // formData.append('description', itemData.description)
      // formData.append('category', itemData.category)
      // formData.append('price', itemData.price.toString())
      // formData.append('rating', itemData.rating.toString())
      // formData.append('isAvailable', itemData.isAvailable.toString())
      // if (itemData.image) {
      //   formData.append('image', itemData.image)
      // }
      //
      // const response = await fetch('/api/menu/items', {
      //   method: 'POST',
      //   body: formData
      // })
      // const newItem = await response.json()
      // menuItems.value.push(newItem)

      console.log('Menu item will be added via API:', itemData)
    } catch (error) {
      console.error('Error adding menu item:', error)
    }
  }

  const updateMenuItem = async (id: string, updates: Partial<MenuItemInput>) => {
    try {
      // TODO: Replace with actual API call
      // Example API integration:
      // const formData = new FormData()
      // Object.keys(updates).forEach(key => {
      //   if (updates[key as keyof MenuItemInput] !== undefined) {
      //     formData.append(key, updates[key as keyof MenuItemInput]?.toString() || '')
      //   }
      // })
      // if (updates.image) {
      //   formData.append('image', updates.image)
      // }
      //
      // const response = await fetch(`/api/menu/items/${id}`, {
      //   method: 'PUT',
      //   body: formData
      // })
      // const updatedItem = await response.json()
      //
      // const index = menuItems.value.findIndex(item => item.id === id)
      // if (index !== -1) {
      //   menuItems.value[index] = updatedItem
      // }

      console.log('Menu item will be updated via API:', id, updates)
    } catch (error) {
      console.error('Error updating menu item:', error)
    }
  }

  const deleteMenuItem = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      // Example API integration:
      // await fetch(`/api/menu/items/${id}`, {
      //   method: 'DELETE'
      // })
      // menuItems.value = menuItems.value.filter(item => item.id !== id)

      console.log('Menu item will be deleted via API:', id)
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  return {
    menuItems,
    searchQuery,
    selectedCategory,
    filteredMenuItems,
    categories,
    fetchMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem
  }
})
