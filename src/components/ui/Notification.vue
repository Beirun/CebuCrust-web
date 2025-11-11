<script setup lang="ts">
import { ref } from 'vue'
import { Bell, BellOff } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import type { Notification } from '@/models/notification'
import { toDate } from '@/plugins/convert'
import { useNotificationStore } from '@/stores/notification'

defineProps<{
  notifications: Notification[]
}>()
const { updateNotificationStatus } = useNotificationStore()
const readNotification = async (n: number) => {
  await updateNotificationStatus(n, 'read')
}

const open = ref(false)
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <button class="relative p-2 text-gray-300 hover:text-white transition-colors">
        <Bell class="w-6 h-6" />

        <span
          v-if="notifications.filter((n) => n.notificationStatus === 'unread').length"
          class="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"
        ></span>
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      class="mt-2 w-102 bg-[#192124] rounded-lg shadow-lg border border-[#D3D3D3]/30 py-2"
    >
      <div
        v-if="notifications.length === 0"
        class="px-10 py-10 text-gray-400 text-xl font-semibold grid place-items-center gap-4"
      >
        <BellOff :size="40" />
        No Notifications
      </div>

      <div
        v-else
        v-for="n in notifications"
        :key="n.notificationId"
        @click="readNotification(n.notificationId!)"
        class="px-4 py-3 hover:bg-[#232c30] cursor-pointer transition-colors flex flex-col gap-1"
        :class="n.notificationStatus === 'read' ? 'pointer-events-none' : ''"
      >
        <h4 class="text-white text-base font-medium">{{ n.notificationTitle }}</h4>
        <div class="flex items-center justify-between">
          <span class="text-gray-200 text-sm font-medium line-clamp-1">
            {{ n.notificationMessage }}
          </span>

          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-primary': n.notificationStatus !== 'read',
              'bg-gray-500': n.notificationStatus === 'read',
            }"
          ></span>
        </div>

        <span class="text-xs text-gray-400">
          {{ toDate(n.dateCreated!) }}
        </span>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
