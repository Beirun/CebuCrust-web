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

defineProps<{ notifications: Notification[] }>()
const { updateNotificationStatus } = useNotificationStore()

const open = ref(false)

const readNotification = async (id: number) => {
  await updateNotificationStatus(id, 'read')
}

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
        <template v-if="notifications.length === 0">
          <div
            class="px-10 py-10 text-gray-400 text-xl font-semibold grid place-items-center gap-4"
          >
            <BellOff :size="40" />
            No Notifications
          </div>
        </template>
        <template v-else>
          <div
            v-for="n in notifications"
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
        <template v-if="notifications.length === 0">
          <div
            class="px-10 py-10 text-gray-400 text-xl font-semibold grid place-items-center gap-4"
          >
            <BellOff :size="40" />
            No Notifications
          </div>
        </template>
        <template v-else>
          <h4 class="text-center py-4 text-white font-semibold text-lg">Notifications</h4>
          <div
            v-for="n in notifications"
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
