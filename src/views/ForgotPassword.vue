<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import LandingFooter from '@/components/LandingFooter.vue'
import LandingNavbar from '@/components/LandingNavbar.vue'
import Footer from '@/components/Footer.vue'
import router from '@/router'
import { useSonnerStore } from '@/stores/sonner'
import { useResetStore } from '@/stores/reset'

const reset = useResetStore()
const sonner = useSonnerStore()
const email = ref('')

onMounted(() => sonner.setTheme('dark'))
onBeforeUnmount(() => sonner.setTheme('light'))
</script>

<template>
  <div class="min-h-screen w-screen scroll-smooth">
    <LandingNavbar class="bg-[#121A1D] static border-b border-[#D3D3D3]/30" />
    <div class="bg-[#0A1316] grid place-items-center p-45 py-25">
      <div class="h-[70vh] w-[63vw] overflow-hidden flex justify-center items-center">
        <div
          class="flex flex-col justify-center items-center h-full w-7/13 bg-[#192327] text-lg px-16 rounded-xl"
        >
          <div class="size-20 bg-primary grid place-items-center rounded-2xl my-3">
            <span class="text-white icon-[fluent--key-16-filled] size-12"></span>
          </div>
          <div class="flex flex-col items-center gap-2 my-3">
            <div class="text-white font-bold text-3xl">Forgot Password?</div>
            <div class="text-[#797B78] text-base px-20 text-center">
              No worries! Enter your email and we'll send you a reset link.
            </div>
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label for="email" class="text-white">Email Address</label>
            <input
              v-model="email"
              type="text"
              placeholder="Enter your Email"
              class="placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
            />
          </div>

          <button
            @click="reset.requestReset(email)"
            :disabled="reset.isLoading"
            class="flex justify-center items-center gap-2 w-full bg-primary my-3 p-3 text-white rounded-md disabled:brightness-70 disabled:cursor-auto transition-all duration-300"
          >
            <span
              v-if="reset.isLoading"
              class="icon-[ri--loader-4-fill] animate-spin size-6"
            ></span>
            Send Reset Link
          </button>

          <div class="w-full flex items-center justify-center gap-2 my-3">
            <span class="text-[#797B78]">Remember your password?</span>
            <button @click="router.push('/signin')" class="text-primary">Sign In</button>
          </div>
        </div>
      </div>
    </div>
    <Footer :copyright-only="true" />
  </div>
</template>
