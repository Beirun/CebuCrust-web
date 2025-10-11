<script setup lang="ts">
const props = defineProps({
  sectionTitle: { type: String, default: '' },
  heading: { type: String, required: true },
  description: { type: String, required: true },
  buttonText: { type: String, default: 'READ MORE' },
  imageSrc: { type: String, required: true },
  imageAlt: { type: String, default: '' },
  index: { type: Number, default: 0 },
})
defineEmits(['action'])
console.log(props.imageSrc)
</script>

<template>
  <div
    class="w-full flex flex-col justify-between gap-8 sm:gap-12 lg:gap-30 lg:flex-col xl:flex-row"
    :class="index % 2 === 1 ? 'xl:flex-row-reverse' : ''"
  >
    <div class="flex flex-col justify-between gap-6 sm:gap-7 lg:gap-8">
      <div class="text-white flex flex-col gap-2">
        {{ sectionTitle }}
        <span class="h-[1px] w-15 bg-primary"></span>
      </div>
      <div class="text-white text-3xl sm:text-4xl lg:text-5xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold">
        {{ heading }}
      </div>
      <div class="text-[#797B78] text-sm sm:text-base xl:text-base 2xl:text-lg">
        {{ description }}
      </div>
      <div>
        <button class="bg-primary text-white p-3 sm:p-4 rounded-sm" @click="$emit('action')">
          {{ buttonText }}
        </button>
      </div>
    </div>

    <div class="w-full flex justify-center">
      <div
        :style="{ backgroundImage: `url(${imageSrc})` }"
        :class="['bg-cover w-full sm:w-80 lg:w-120 xl:w-100 2xl:w-120 aspect-3/2']"
      ></div>
    </div>
  </div>
</template>
