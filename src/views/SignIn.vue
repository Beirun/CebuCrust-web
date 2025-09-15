<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import LandingFooter from '@/components/LandingFooter.vue'
import LandingNavbar from '@/components/LandingNavbar.vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useSonnerStore } from '@/stores/sonner'

const auth = useAuthStore()
const sonner = useSonnerStore()
const showPassword = ref(false)
const form = reactive({
  email: '',
  password: '',
})

const togglePassword = () => (showPassword.value = !showPassword.value)

onMounted(() => sonner.setTheme('dark'))
onBeforeUnmount(() => sonner.setTheme('light'))
</script>

<template>
  <div class="min-h-screen w-screen scroll-smooth">
    <LandingNavbar class="bg-[#121A1D] static border-b border-[#D3D3D3]/30" />
    <div class="bg-[#0A1316] grid place-items-center p-45 py-15">
      <div class="h-[78vh] w-[63vw] rounded-xl overflow-hidden flex">
        <div class="relative h-full w-1/2">
          <div class="absolute inset-0 bg-[url('@/assets/sign-bg.png')] bg-cover bg-center"></div>
          <div class="absolute inset-0 bg-black/50"></div>
        </div>

        <div
          class="flex flex-col justify-center items-center h-full w-1/2 bg-[#192327] text-lg px-16"
        >
          <div class="flex flex-col items-center gap-2 my-3">
            <div class="text-white font-bold text-3xl">Welcome Back</div>
            <div class="text-[#797B78] text-base">Sign in to continue your pizza journey</div>
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label for="email" class="text-white">Email Address</label>
            <input
              v-model="form.email"
              type="text"
              placeholder="Enter your Email"
              class="placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
            />
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label for="password" class="text-white">Password</label>
            <div class="relative flex w-full">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your Password"
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

          <div class="flex w-full justify-end my-3">
            <button class="text-primary">Forgot Password?</button>
          </div>

          <button
            @click="auth.login(form)"
            :disabled="auth.isLoading"
            class="flex justify-center items-center gap-2 w-full bg-primary my-3 p-3 text-white rounded-md disabled:brightness-70 disabled:cursor-auto transition-all duration-300"
          >
            <span v-if="auth.isLoading" class="icon-[ri--loader-4-fill] animate-spin size-6"></span>
            Sign In
          </button>

          <div class="flex justify-between w-full items-center my-3">
            <div class="h-[1px] bg-[#4B5563] w-full"></div>
            <span class="px-4 text-[#797B78]">OR</span>
            <div class="h-[1px] bg-[#4B5563] w-full"></div>
          </div>

          <button
            class="w-full border border-slate-400/30 bg-[#1F2937] my-3 p-3 text-white rounded-md flex items-center justify-center gap-2"
          >
            <span class="icon-[ri--google-fill] size-6 text-white"></span>
            Continue with Google
          </button>

          <div class="w-full flex items-center justify-center gap-2 my-3">
            <span class="text-[#797B78]">Don't have an account?</span>
            <button @click="router.push('/signup')" class="text-primary">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
    <LandingFooter />
  </div>
</template>
