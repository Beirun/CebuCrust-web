<script setup lang="ts">
import { computed } from 'vue'
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import { useColorMode } from '@vueuse/core'

import { RouterView } from 'vue-router'

const mode = useColorMode({ disableTransition: false })

const toasterTheme = computed(() => (mode.value === 'auto' ? 'light' : mode.value))
</script>

<template>
  <Toaster richColors :theme="toasterTheme" />

  <RouterView />
</template>

<style scoped></style>
