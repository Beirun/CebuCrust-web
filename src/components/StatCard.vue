<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: string
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  changeType: 'neutral',
  prefix: '',
  suffix: ''
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return `${props.prefix}${props.value.toLocaleString()}${props.suffix}`
  }
  return `${props.prefix}${props.value}${props.suffix}`
})

const changeColor = computed(() => {
  switch (props.changeType) {
    case 'positive':
      return 'text-green-600'
    case 'negative':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
})

const changeIcon = computed(() => {
  switch (props.changeType) {
    case 'positive':
      return '↗'
    case 'negative':
      return '↘'
    default:
      return '→'
  }
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ formattedValue }}</p>
        <div v-if="change !== undefined" class="flex items-center mt-2">
          <span :class="changeColor" class="text-sm font-medium">
            {{ changeIcon }} {{ Math.abs(change) }}%
          </span>
          <span class="text-gray-500 text-sm ml-1">vs last month</span>
        </div>
      </div>
      <div v-if="icon" class="p-3 bg-gray-100 rounded-full">
        <span class="text-2xl">{{ icon }}</span>
      </div>
    </div>
  </div>
</template>

