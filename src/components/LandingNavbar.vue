<script setup lang="ts">
const links = [
  { name: 'Home', target: 'top' },
  { name: 'About Us', target: 'about' },
  { name: 'Menu', target: 'menu' },
  { name: 'Contact', target: 'contact' },
]

function scrollTo(id: string) {
  const el = id === 'top' ? document.documentElement : document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="w-full flex justify-between absolute top-0 px-40 gap-10 py-6 text-lg z-10">
    <div>
      <img
        src="@/assets/logo.png"
        alt="Logo"
        class="w-50 cursor-pointer"
        @click="scrollTo('top')"
      />
    </div>

    <div class="flex gap-[clamp(20px,10vw,100px)] items-center">
      <button
        v-for="link in links"
        :key="link.name"
        @click="scrollTo(link.target)"
        class="relative group text-white pb-1 hover:text-primary duration-300 transition-colors"
      >
        {{ link.name }}
        <span
          class="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[2px] w-full bg-primary origin-center scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        ></span>
      </button>
    </div>

    <div class="flex gap-8">
      <button class="text-primary">Sign In</button>
      <button class="bg-primary text-white px-4 py-3 rounded-sm">Sign Up</button>
    </div>
  </div>
</template>
