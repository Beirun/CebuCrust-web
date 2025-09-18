# /

<script setup lang="ts">
import LandingNavbar from '@/components/LandingNavbar.vue'
import LandingHero from '@/components/LandingHero.vue'
import InfoCard from '@/components/InfoCard.vue'

const aboutSection = [
  {
    sectionTitle: 'ABOUT US',
    heading: 'Order Pizza Fresh from the Oven—Anytime, Anywhere!',
    description:
      'lorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras sit semper sit enim. Turpis aliquetlorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras sit semper sit enim. Turpis aliquet',
    buttonText: 'READ MORE',
    imageSrc: '../src/assets/aboutus.png',
    imageAlt: 'About Us',
  },
  {
    sectionTitle: 'PIZZA MENU',
    heading: 'Premium Pizza, Seamless Ordering',
    description:
      'lorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras sit semper sit enim. Turpis aliquetlorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras sit semper sit enim. Turpis aliquet',
    buttonText: 'READ MORE',
    imageSrc: '../src/assets/pizzamenu.png',
    imageAlt: 'Pizza Menu',
  },
  {
    sectionTitle: 'OUR TEAM',
    heading: 'Use the Tips & Recipes of Our Pizza Artisans',
    description:
      'lorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras sit semper sit enim. Turpis aliquetlorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras sit semper sit enim. Turpis aliquet',
    buttonText: 'READ MORE',
    imageSrc: '../src/assets/ourteam.png',
    imageAlt: 'Our Team',
  },
]

const features = [
  {
    icon: 'icon-[material-symbols--food-bank-outline]',
    header: 'MENU FOR EVERY TASTE',
    description:
      'Lorem ipsum dolor sit amet consectetur. Felis eget sit sit scelerisque vestibulum. Urna faucibus amet massa lacus lorem. ',
  },
  {
    icon: 'icon-[fluent--food-pizza-24-regular]',
    header: 'ALWAYS QUALITY DOUGH',
    description:
      'Lorem ipsum dolor sit amet consectetur. Felis eget sit sit scelerisque vestibulum. Urna faucibus amet massa lacus lorem. ',
  },
  {
    icon: 'icon-[fluent-emoji-high-contrast--man-cook]',
    header: 'EXPERIENCED CHEF',
    description:
      'Lorem ipsum dolor sit amet consectetur. Felis eget sit sit scelerisque vestibulum. Urna faucibus amet massa lacus lorem. ',
  },
]
</script>

<template>
  <div class="min-h-screen w-screen scroll-smooth">
    <LandingNavbar />
    <LandingHero />

    <!-- About Us -->
    <div class="flex flex-col min-h-screen w-screen bg-[#0A1316] p-30 gap-50">
      <InfoCard
        v-for="(section, index) in aboutSection"
        :key="index"
        :section-title="section.sectionTitle"
        :heading="section.heading"
        :description="section.description"
        :button-text="section.buttonText"
        :image-src="section.imageSrc"
        :image-alt="section.imageAlt"
        :index="index"
      />
    </div>

    <!-- Features -->
    <div class="flex flex-col items-center w-screen bg-[#0A1316] p-30 gap-10">
      <div class="flex flex-col text-white items-center gap-2">
        FEATURES
        <span class="h-[1px] w-full bg-primary"></span>
      </div>
      <div class="flex flex-col w-1/2 items-center text-white gap-8">
        <div class="text-6xl font-semibold text-center">Why people choose us?</div>
        <div class="text-[#797B78] text-lg text-center">
          Lorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras
          sit semper sit enim. Turpis aliquet at ac eu donec ut. Sagittis vestibulum at quis non
          massa netus.
        </div>
      </div>
      <div class="flex justify-center gap-20 xl:gap-50 mt-4 px-35 flex-col xl:flex-row">
        <div v-for="(feature, index) in features" :key="index" class="flex flex-col gap-4 items-center">
          <span :class="['text-white size-20', feature.icon]"></span>
          <div class="text-white text-2xl font-semibold text-center">{{ feature.header }}</div>
          <div class="text-[#797B78] text-center">{{ feature.description }}</div>
        </div>
      </div>
    </div>

    <!-- Menu -->
    <div class="flex flex-col items-center w-screen bg-[#0A1316] p-30 gap-10">
      <div class="flex flex-col text-white items-center gap-2">
        MENU
        <span class="h-[1px] w-full bg-primary"></span>
      </div>
      <div class="flex flex-col w-1/2 items-center text-white gap-8">
        <div class="text-6xl font-semibold text-center">Explore Our Foods</div>
        <div class="text-[#797B78] text-lg text-center">
          Lorem ipsum dolor sit amet consectetur. Dolor elit vitae nunc varius. Facilisis eget cras
          sit semper sit enim. Turpis aliquet at ac eu donec ut. Sagittis vestibulum at quis non
          massa netus.
        </div>
      </div>
      <div class="flex justify-center gap-10 mt-4 px-35">
        <div
          v-for="(value, index) in [1, 2, 3, 4]"
          :key="index"
          class="flex flex-col items-center bg-[#192124] h-120 w-85 rounded-xl shadow-md shadow-black overflow-hidden"
        >
          <div class="bg-primary w-full h-[calc(50%+20px)]"></div>
          <div class="flex p-6 flex-col justify-between gap-4">
            <div class="text-primary font-bold text-2xl">Classic Margherita</div>
            <div class="text-[#A19E9B]">
              Fresh mozzarella, vine-ripened tomatoes, and aromatic basil on our signature thin
              crust
            </div>
            <div class="flex justify-between">
              <div class="flex text-[#A19E9B]">
                <span class="icon-[material-symbols--star-rounded] text-primary size-6"></span>
                <div>4.8 (124)</div>
              </div>
              <div class="text-primary font-bold text-2xl">₱695</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Get In Touch -->
    <div class="flex flex-col items-center w-screen bg-[#0A1316] p-30 gap-10">
      <div class="flex flex-col text-white items-center gap-2">
        GET IN TOUCH
        <span class="h-[1px] w-full bg-primary"></span>
      </div>
      <div class="flex flex-col w-1/2 items-center text-white gap-8">
        <div class="text-6xl font-semibold text-center">Visit Our Location</div>
        <div class="text-[#797B78] text-lg text-center">
          Come experience our authentic pizzas at our restaurant location
        </div>
      </div>
      <div class="flex justify-center gap-10 mt-4 px-35 w-full">
        <div class="h-200 w-1/2 flex flex-col p-6 bg-[#121A1D] rounded-xl">
          <div class="h-full w-full bg-black/20 rounded-xl"></div>
          <div class="w-full flex justify-center pt-6">
            <button class="text-primary flex items-end gap-2">
              <span class="icon-[ion--arrow-up-right-box-outline] size-6"></span>
              <span>View Larger Map</span>
            </button>
          </div>
        </div>

        <div class="w-1/2 flex flex-col gap-10 justify-between">
          <div class="bg-[#121A1D] w-full rounded-lg flex p-10 gap-10">
            <div class="size-16 rounded-full flex items-center justify-center bg-primary/20">
              <span class="icon-[heroicons--map-pin-solid] text-primary size-12"></span>
            </div>
            <div class="flex flex-col text-white gap-4">
              <div class="font-bold text-2xl">Our Location</div>
              <div class="text-[#D1D5DB] text-base">
                <div>543 Country Club Ave</div>
                <div>NC 27587, London, UK</div>
              </div>
            </div>
          </div>

          <div class="bg-[#121A1D] w-full rounded-lg flex flex-col p-10 gap-10">
            <div class="font-bold text-white text-2xl">Contact Information</div>
            <div class="flex flex-col gap-5">
              <div class="flex items-center gap-5">
                <div class="size-16 rounded-full flex items-center justify-center bg-primary/20">
                  <span class="icon-[ri--phone-fill] text-primary size-12"></span>
                </div>
                <div class="text-[#D1D5DB]">+1257 6541120</div>
              </div>
              <div class="flex items-center gap-5">
                <div class="size-16 rounded-full flex items-center justify-center bg-primary/20">
                  <span class="icon-[ic--baseline-email] text-primary size-12"></span>
                </div>
                <div class="text-[#D1D5DB]">info@cebucrust.com</div>
              </div>
            </div>
          </div>

          <div class="bg-[#121A1D] w-full rounded-lg flex p-10 gap-10">
            <div>
              <div class="size-16 rounded-full flex items-center justify-center bg-primary/20">
                <span class="icon-[heroicons--map-pin-solid] text-primary size-12"></span>
              </div>
            </div>
            <div class="flex flex-col text-white gap-4 w-full">
              <div class="font-bold text-2xl">Opening Hours</div>
              <div class="text-[#D1D5DB] text-base flex flex-col gap-4">
                <div class="w-full flex justify-between">
                  <div>Mon - Wed:</div>
                  <div class="text-primary">09:00am - 10:00pm</div>
                </div>
                <div class="w-full flex justify-between">
                  <div>Thu - Sat:</div>
                  <div class="text-primary">09:00am - 9:00pm</div>
                </div>
                <div class="w-full flex justify-between">
                  <div>Sun:</div>
                  <div class="text-red-500">Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="relative w-screen h-150">
      <div class="absolute inset-0 bg-[url('@/assets/footerlanding.png')] bg-cover bg-center"></div>
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative h-full w-1/2 gap-12 p-40 flex flex-col">
        <div class="text-6xl text-white">Lorem ipsum dolor sit amet consectetur</div>
        <div class="flex text-lg gap-4">
          <button class="bg-primary text-white p-4 rounded-sm">Order Now</button>
          <button class="text-white">Contact Us</button>
        </div>
      </div>
    </div>

    <div class="bg-[#121A1D] h-70 w-screen flex flex-col px-30 pt-8 text-[#797B78] justify-between">
      <div class="flex w-full justify-between gap-40">
        <div class="w-150 flex flex-col gap-2">
          <div>
            <img src="@/assets/logo.png" alt="" />
          </div>
          <div>
            Lorem ipsum dolor sit amet consectetur. Tristique cursus morbi nibh nec et vulputate.
            Turpis tortor nisi imperdiet quis accumsan. Ligula netus amet leo ultricies. Neque
            venenatis magnis amet eget sagittis leo enim.
          </div>
        </div>

        <div class="flex flex-col w-120 gap-6">
          <div class="text-white text-xl font-bold">Opening Time</div>
          <div>Mon - Wed: 09:00am - 10:00pm</div>
          <div>Thu - Sat: 09:00am - 9:00pm</div>
          <div>Sun: Closed</div>
        </div>

        <div class="flex flex-col w-100 gap-6">
          <div class="text-white text-xl font-bold">User Link</div>
          <div>About Us</div>
          <div>Contact Us</div>
          <div>Order Delivery</div>
        </div>

        <div class="flex flex-col w-100 gap-6">
          <div class="text-white text-xl font-bold">Contact Us</div>
          <div>
            <div>543 Country Club Ave</div>
            <div>NC 27587, London, UK</div>
          </div>

          <div>+1257 6541120</div>
        </div>
      </div>
    </div>
    <div class="bg-[#121A1D] flex justify-between px-30 py-8 text-[#797B78]">
      <div class="flex w-full justify-between">
        <div>©2024 ARR, All right reserved</div>
        <div class="flex gap-8">
          <button>Privacy Policy</button>
          <button>Terms of Use</button>
        </div>
      </div>
    </div>
  </div>
</template>
