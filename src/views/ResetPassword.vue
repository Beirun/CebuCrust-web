<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import LandingFooter from '@/components/LandingFooter.vue'
import LandingNavbar from '@/components/LandingNavbar.vue'
import router from '@/router'
import { useSonnerStore } from '@/stores/sonner'
import { useRoute } from 'vue-router'
import { useResetStore } from '@/stores/reset'

const route = useRoute()
const code = route.params.code
const reset = useResetStore()
const sonner = useSonnerStore()
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const form = reactive({
  newPassword: '',
  confirmPassword: '',
})

const togglePassword = () => (showPassword.value = !showPassword.value)
const toggleConfirmPassword = () => (showConfirmPassword.value = !showConfirmPassword.value)

onBeforeMount(async () => {
  await reset.verifyReset(code as string)
})
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
            <div class="text-white font-bold text-3xl">Reset Your Password</div>
            <div class="text-[#797B78] text-base px-20 text-center">
              Create a new password for your CebuCrust account.
            </div>
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label class="text-white">Password</label>
            <div class="relative flex w-full">
              <input
                v-model="form.newPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a Password"
                class="w-full placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
              />
              <span
                @click="togglePassword"
                v-if="showPassword"
                class="icon-[fa7-solid--eye-slash] absolute right-4 bottom-4 text-[#ADAEBC]"
              ></span>
              <span
                v-else
                @click="togglePassword"
                class="icon-[fa7-solid--eye] absolute right-4 bottom-4 text-[#ADAEBC]"
              ></span>
            </div>
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label class="text-white">Confirm Password</label>
            <div class="relative flex w-full">
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Enter your Confirm Password"
                class="w-full placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
              />
              <span
                @click="toggleConfirmPassword"
                v-if="showConfirmPassword"
                class="icon-[fa7-solid--eye-slash] absolute right-4 bottom-4 text-[#ADAEBC]"
              ></span>
              <span
                @click="toggleConfirmPassword"
                v-else
                class="icon-[fa7-solid--eye] absolute right-4 bottom-4 text-[#ADAEBC]"
              ></span>
            </div>
          </div>

          <button
            @click="reset.resetPassword(code as string, form)"
            :disabled="reset.isLoading"
            class="flex justify-center items-center gap-2 w-full bg-primary my-3 p-3 text-white rounded-md disabled:brightness-70 disabled:cursor-auto transition-all duration-300"
          >
            <span
              v-if="reset.isLoading"
              class="icon-[ri--loader-4-fill] animate-spin size-6"
            ></span>
            Reset Password
          </button>

          <div class="w-full flex items-center justify-center gap-2 my-3">
            <span class="text-[#797B78]">Remember your password?</span>
            <button @click="router.push('/signin')" class="text-primary">Sign In</button>
          </div>
        </div>
      </div>
    </div>
    <LandingFooter />
  </div>
</template>
