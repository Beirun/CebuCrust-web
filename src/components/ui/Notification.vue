<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BellOff } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import type { Notification } from '@/models/notification'
import { toDate } from '@/plugins/convert'
import { useNotificationStore } from '@/stores/notification'

const props = defineProps<{ notifications: Notification[] }>()
const { updateNotificationStatus, markAllAsRead } = useNotificationStore()

const open = ref(false)

// Sort notifications by dateCreated descending (newest first) as a safety measure
const sortedNotifications = computed(() => {
  return [...props.notifications].sort((a, b) => {
    const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0
    const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0
    return dateB - dateA // Descending order (newest first)
  })
})

const readNotification = async (id: number) => {
  await updateNotificationStatus(id, 'read')
}

const unreadCount = computed(() =>
  sortedNotifications.value.filter((n) => n.notificationStatus !== 'read').length
)

// Reactive window width check
const windowWidth = ref(window.innerWidth)
const isLg = computed(() => windowWidth.value >= 1024) // Tailwind 'lg' breakpoint

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <div>
    <!-- Use isLg to conditionally render or style components -->
    <DropdownMenu v-if="isLg" v-model:open="open">
      <DropdownMenuTrigger>
        <slot></slot>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="mt-2 w-102 bg-[#192124] rounded-lg shadow-lg border border-[#D3D3D3]/30 py-2"
      >
        <template v-if="sortedNotifications.length === 0">
          <div
            class="px-10 py-10 text-gray-400 text-xl font-semibold grid place-items-center gap-4"
          >
            <BellOff :size="40" />
            No Notifications
          </div>
        </template>
        <template v-else>
          <div
            v-if="unreadCount > 0"
            class="px-4 py-2 border-b border-[#D3D3D3]/30"
          >
            <button
              @click="markAllAsRead"
              class="w-full text-left text-primary text-sm font-medium hover:text-primary/80 transition-colors py-2"
            >
              Mark all as read
            </button>
          </div>
          <div
            v-for="n in sortedNotifications"
            :key="n.notificationId"
            @click="readNotification(n.notificationId!)"
            class="px-4 py-3 hover:bg-[#232c30] cursor-pointer transition-colors flex flex-col gap-1"
            :class="n.notificationStatus === 'read' ? 'pointer-events-none' : ''"
          >
            <h4 class="text-white text-base font-medium">{{ n.notificationTitle }}</h4>
            <div class="flex items-center justify-between">
              <span class="text-gray-200 text-sm font-medium line-clamp-1">{{
                n.notificationMessage
              }}</span>
              <span
                class="w-2 h-2 rounded-full"
                :class="n.notificationStatus !== 'read' ? 'bg-primary' : 'bg-gray-500'"
              ></span>
            </div>
            <span class="text-xs text-gray-400">{{ toDate(n.dateCreated!) }}</span>
          </div>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>

    <Sheet v-else v-model:open="open">
      <SheetTrigger>
        <slot></slot>
      </SheetTrigger>
      <SheetContent class="bg-[#192124]">
        <template v-if="sortedNotifications.length === 0">
          <div
            class="px-10 py-10 text-gray-400 text-xl font-semibold grid place-items-center gap-4"
          >
            <BellOff :size="40" />
            No Notifications
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-between px-4 py-4 border-b border-[#D3D3D3]/30">
            <h4 class="text-white font-semibold text-lg">Notifications</h4>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-primary text-sm font-medium hover:text-primary/80 transition-colors"
            >
              Mark all as read
            </button>
          </div>
          <div
            v-for="n in sortedNotifications"
            :key="n.notificationId"
            @click="readNotification(n.notificationId!)"
            class="px-4 py-3 hover:bg-[#232c30] cursor-pointer transition-colors flex flex-col gap-1"
            :class="n.notificationStatus === 'read' ? 'pointer-events-none' : ''"
          >
            <h4 class="text-white text-base font-medium">{{ n.notificationTitle }}</h4>
            <div class="flex items-center justify-between">
              <span class="text-gray-200 text-sm font-medium line-clamp-1">{{
                n.notificationMessage
              }}</span>
              <span
                class="w-2 h-2 rounded-full"
                :class="n.notificationStatus !== 'read' ? 'bg-primary' : 'bg-gray-500'"
              ></span>
            </div>
            <span class="text-xs text-gray-400">{{ toDate(n.dateCreated!) }}</span>
          </div>
        </template>
      </SheetContent>
    </Sheet>
  </div>
</template>
