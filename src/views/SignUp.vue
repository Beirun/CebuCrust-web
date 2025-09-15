<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import LandingFooter from '@/components/LandingFooter.vue'
import LandingNavbar from '@/components/LandingNavbar.vue'
import router from '@/router'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import { useAuthStore } from '@/stores/auth'
import { useSonnerStore } from '@/stores/sonner'

const auth = useAuthStore()
const sonner = useSonnerStore()
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  agree: false,
})

const submitClick = () => {
  console.log(form)
  auth.register(form)
}

const togglePassword = () => (showPassword.value = !showPassword.value)
const toggleConfirmPassword = () => (showConfirmPassword.value = !showConfirmPassword.value)

onMounted(() => sonner.setTheme('dark'))
onBeforeUnmount(() => sonner.setTheme('light'))
</script>

<template>
  <div class="min-h-screen w-screen scroll-smooth">
    <LandingNavbar class="bg-[#121A1D] static border-b border-[#D3D3D3]/30" />
    <div class="bg-[#0A1316] grid place-items-center p-45 py-15">
      <div class="h-255 w-[63vw] rounded-xl overflow-hidden flex">
        <div class="relative h-full w-1/2">
          <div class="absolute inset-0 bg-[url('@/assets/sign-bg.png')] bg-cover bg-center"></div>
          <div class="absolute inset-0 bg-black/50"></div>
        </div>
        <div
          class="flex flex-col justify-center items-center h-full w-1/2 bg-[#192327] text-lg px-16"
        >
          <div class="flex flex-col items-center gap-2 my-3">
            <div class="text-white font-bold text-3xl">Create Your Account</div>
            <div class="text-[#797B78] text-base">
              Join Cebu Crust and get your pizza delivered hot and fresh.
            </div>
          </div>

          <div class="w-full flex justify-between my-3 gap-6">
            <div class="flex flex-col w-full gap-2 text-base">
              <label class="text-white">First Name</label>
              <input
                v-model="form.firstName"
                type="text"
                placeholder="Enter your First Name"
                class="placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
              />
            </div>
            <div class="flex flex-col w-full gap-2 text-base">
              <label class="text-white">Last Name</label>
              <input
                v-model="form.lastName"
                type="text"
                placeholder="Enter your Last Name"
                class="placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
              />
            </div>
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label class="text-white">Email Address</label>
            <input
              v-model="form.email"
              type="text"
              placeholder="Enter your Email"
              class="placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
            />
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label class="text-white">Phone Number</label>
            <input
              v-model="form.phoneNumber"
              type="text"
              placeholder="Enter your Phone Number"
              class="placeholder:text-[#ADAEBC] text-[#ADAEBC] focus:text-white rounded-md border border-[#D3D3D3]/30 p-3"
            />
          </div>

          <div class="flex flex-col w-full gap-2 text-base my-3">
            <label class="text-white">Password</label>
            <div class="relative flex w-full">
              <input
                v-model="form.password"
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

          <div class="flex my-3 items-center w-full gap-2 text-[#A19E9B] text-base">
            <Checkbox v-model="form.agree" class="size-5" />
            I agree to the <span class="text-primary">Terms of Use</span> and
            <span class="text-primary">Privacy Policy</span>
          </div>

          <button
            @click="submitClick"
            :disabled="!form.agree || auth.isLoading"
            class="flex justify-center items-center gap-2 w-full bg-primary my-3 p-3 text-white rounded-md disabled:brightness-70 disabled:cursor-auto transition-all duration-300"
          >
            <span v-if="auth.isLoading" class="icon-[ri--loader-4-fill] animate-spin size-6"></span>
            Sign Up
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
            <span class="text-[#797B78]">Already have an account?</span>
            <button @click="router.push('/signin')" class="text-primary">Sign In</button>
          </div>
        </div>
      </div>
    </div>
    <LandingFooter />
  </div>
</template>
