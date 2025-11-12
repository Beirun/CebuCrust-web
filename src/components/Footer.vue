<template>
  <div class="bg-[#121A1D] w-screen px-4 sm:px-8 lg:px-30 py-6 sm:py-8 text-[#797B78]">
    <div
      v-if="!copyrightOnly"
      class="flex w-full justify-between gap-8 sm:gap-16 lg:gap-40 flex-col sm:flex-row mb-6"
    >
      <div class="w-full sm:w-150 flex flex-col gap-2">
        <div>
          <img src="@/assets/logo.png" alt="" class="w-40 sm:w-45 lg:w-55" />
        </div>
        <div class="text-sm sm:text-base">
          Cebu Crust brings authentic Italian pizza to Cebu City. We use traditional wood-fired
          ovens and premium ingredients. Located near University of Cebu Main Campus, we're your
          go-to destination for delicious and fresh pizza.
        </div>
      </div>

      <div class="flex flex-col w-full sm:w-120 gap-4 sm:gap-6">
        <div class="text-white text-lg sm:text-xl font-bold">Opening Time</div>
        <div class="text-sm sm:text-base">Mon - Wed: 09:00am - 10:00pm</div>
        <div class="text-sm sm:text-base">Thu - Sat: 09:00am - 9:00pm</div>
        <div class="text-sm sm:text-base">Sun: Closed</div>
      </div>

      <div class="flex flex-col w-full sm:w-100 gap-4 sm:gap-6">
        <div class="text-white text-lg sm:text-xl font-bold">User Link</div>
        <button
          class="text-sm sm:text-base hover:text-white transition-colors text-left"
          @click="scrollToSection('about')"
        >
          About Us
        </button>
        <button
          class="text-sm sm:text-base hover:text-white transition-colors text-left"
          @click="scrollToSection('contact')"
        >
          Contact Us
        </button>
        <button
          class="text-sm sm:text-base hover:text-white transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isAdmin"
          @click="handleOrderDelivery"
        >
          Order Delivery
        </button>
      </div>

      <div class="flex flex-col w-full sm:w-100 gap-4 sm:gap-6">
        <div class="text-white text-lg sm:text-xl font-bold">Contact Us</div>
        <div class="text-sm sm:text-base">
          <div>University of Cebu Main Campus</div>
          <div>Sanciangko Street, Cebu City</div>
        </div>

        <div class="text-sm sm:text-base">+1257 6541120</div>
      </div>
    </div>

    <!-- Separator -->
    <div v-if="!copyrightOnly" class="border-b border-dashed border-[#797B78] mb-4"></div>

    <!-- Copyright Section -->
    <div class="flex justify-center">
      <div class="text-sm sm:text-base text-center">©2025 CebuCrust, All right reserved</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface Props {
  copyrightOnly?: boolean
}

defineProps<Props>()

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { isAdmin, isAuthenticated } = storeToRefs(auth)

const scrollToSection = async (sectionId: string) => {
  const selector = `#${sectionId}`
  if (route.name !== 'Landing') {
    await router.push({ name: 'Landing', hash: selector })
    requestAnimationFrame(() => {
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
    })
  } else {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleOrderDelivery = () => {
  if (!isAuthenticated.value) {
    sessionStorage.setItem('redirectAfterLogin', '/menu')
    router.push('/signin')
    return
  }

  if (isAdmin.value) return

  router.push('/menu')
}
</script>
