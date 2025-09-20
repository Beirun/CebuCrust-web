<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'

import { RouterView } from 'vue-router'
import { useSonnerStore } from './stores/sonner'

const sonner = useSonnerStore()
</script>

<template>
  <Toaster richColors :theme="sonner.theme" />

  <RouterView />
</template>

<style scoped></style>
