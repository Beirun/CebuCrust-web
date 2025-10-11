<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const show = ref(false)

function onScroll() {
  show.value = window.scrollY > 100 // show when scrolled past 100px
}

function scrollToTop() {
  document.documentElement.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <button
    v-if="show"
    @click="scrollToTop"
    class="fixed size-12 bottom-24 right-8 z-50 bg-primary text-white grid place-items-center rounded-full shadow-lg hover:bg-primary/80 transition"
  >
    <span class="icon-[material-symbols--arrow-upward-rounded] size-8"></span>
  </button>
</template>
