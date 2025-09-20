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
    class="w-full flex flex-col justify-between gap-35 lg:flex-col xl:flex-row"
    :class="index % 2 === 1 ? 'xl:flex-row-reverse' : ''"
  >
    <div class="flex flex-col justify-between text-lg gap-10">
      <div class="text-white flex flex-col gap-2">
        {{ sectionTitle }}
        <span class="h-[1px] w-15 bg-primary"></span>
      </div>
      <div class="text-white text-6xl md:text-2xl lg:text-3xl 2xl:text-6xl font-bold">
        {{ heading }}
      </div>
      <div class="text-[#797B78] text-base xl:text-sm 2xl:text-lg">
        {{ description }}
      </div>
      <div>
        <button class="bg-primary text-white p-4 rounded-sm" @click="$emit('action')">
          {{ buttonText }}
        </button>
      </div>
    </div>

    <div class="w-full flex justify-center">
      <div
        :style="{ backgroundImage: `url(${imageSrc})` }"
        :class="['bg-cover w-150 xl:w-100 2xl:w-200 aspect-3/2']"
      ></div>
    </div>
  </div>
</template>
