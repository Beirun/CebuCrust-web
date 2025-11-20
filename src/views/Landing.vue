# /

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePizzaStore } from '@/stores/pizza'
import { useAuthStore } from '@/stores/auth'
import ScrollToTopButton from '@/components/ScrollToTopButton.vue'
import LandingNavbar from '@/components/LandingNavbar.vue'
import LandingHero from '@/components/LandingHero.vue'
import InfoCard from '@/components/InfoCard.vue'
import Footer from '@/components/Footer.vue'
import { useSonnerStore } from '@/stores/sonner'
import { toBase64 } from '@/plugins/convert'
import router from '@/router'

const sonner = useSonnerStore()
const pizzaStore = usePizzaStore()
const auth = useAuthStore()
const showAllPizzas = ref(false)

// Fetch pizzas on component mount
onMounted(async () => {
  sonner.setTheme('dark')
  await pizzaStore.fetchAll()
})

const availablePizzas = computed(() =>
  pizzaStore.pizzas.filter((pizza) => !pizza.isDeleted),
)

const displayedPizzas = computed(() =>
  showAllPizzas.value ? availablePizzas.value : availablePizzas.value.slice(0, 4),
)

const togglePizzaVisibility = () => {
  showAllPizzas.value = !showAllPizzas.value
}

const formatRatingValue = (rating?: number) => (rating ?? 0).toFixed(1)
const formatRatingCount = (count?: number) => count ?? 0

// Handle Order Now button click
const handleOrderNow = () => {
  if (auth.isAuthenticated) {
    // If user is authenticated, go to menu page
    router.push('/menu')
  } else {
    // If not authenticated, go to sign in and redirect to menu after login
    sessionStorage.setItem('redirectAfterLogin', '/menu')
    router.push('/signin')
  }
}

// Handle Contact Us button click - scroll to contact section
const handleContactUs = () => {
  const contactSection = document.getElementById('contact')
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const aboutSection = [
  {
    sectionTitle: 'ABOUT US',
    heading: 'Order Pizza Fresh from the Oven—Anytime, Anywhere!',
    description:
      'At Cebu Crust, we bring authentic Italian flavors to Cebu City with our wood-fired pizzas made from the finest ingredients. Our commitment to quality and tradition ensures every pizza is crafted with passion and served fresh from our brick oven.',
    expandedContent:
      'Founded with a passion for authentic Italian cuisine, Cebu Crust has been serving the Cebu City community since our opening. We source only the finest ingredients, from our imported Italian tomatoes to our locally sourced fresh vegetables. Our traditional wood-fired brick oven reaches temperatures of over 900°F, creating that perfect crispy crust with a smoky flavor that can only come from authentic wood-fired cooking. Every pizza is hand-crafted by our experienced chefs who have trained in traditional Italian techniques. We believe in supporting local farmers and suppliers while maintaining the highest standards of quality. Whether you\'re dining in, taking out, or having it delivered, we ensure your pizza arrives hot, fresh, and full of flavor. Join us in celebrating the art of pizza making, one slice at a time.',
    buttonText: 'READ MORE',
    imageSrc: '../src/assets/aboutus.png',
    imageAlt: 'About Us',
  },
  {
    sectionTitle: 'PIZZA MENU',
    heading: 'Premium Pizza, Seamless Ordering',
    description:
      'Discover our extensive menu featuring classic Margherita, spicy Pepperoni Supreme, tropical Hawaiian Paradise, and many more delicious options. Each pizza is made with fresh, locally sourced ingredients and our signature thin crust.',
    expandedContent:
      'Our menu is carefully curated to offer something for everyone. Start with our classic Margherita, featuring fresh mozzarella, basil, and our signature tomato sauce. For meat lovers, our Pepperoni Supreme combines premium pepperoni with Italian sausage, ham, and bacon. The Hawaiian Paradise brings a tropical twist with pineapple, ham, and our special sweet and savory sauce. We also offer vegetarian options like our Garden Delight, loaded with fresh bell peppers, mushrooms, onions, olives, and tomatoes. Our specialty pizzas include unique combinations like the Four Cheese, featuring mozzarella, gorgonzola, parmesan, and ricotta. All our pizzas are available in multiple sizes, and you can customize any pizza with additional toppings. We also offer gluten-free options and can accommodate various dietary preferences. Order online for quick delivery or visit us for the full dining experience.',
    buttonText: 'READ MORE',
    imageSrc: '../src/assets/pizzamenu.png',
    imageAlt: 'Pizza Menu',
  },
  {
    sectionTitle: 'OUR TEAM',
    heading: 'Use the Tips & Recipes of Our Pizza Artisans',
    description:
      'Our skilled chefs bring years of experience in traditional Italian cooking techniques. From hand-tossed dough to perfectly balanced toppings, our team ensures every pizza meets our high standards of taste and quality.',
    expandedContent:
      'Our culinary team is led by Chef Marco, who trained in Naples, Italy, the birthplace of pizza. With over 15 years of experience in authentic Italian cuisine, Chef Marco brings traditional techniques and modern innovation to every dish. Our dough is prepared daily using a 48-hour fermentation process that develops complex flavors and the perfect texture. Each pizza is hand-stretched and topped with precision, ensuring consistent quality in every bite. Our team of pizza artisans includes skilled dough makers, sauce specialists, and topping experts who work together to create the perfect pizza. We regularly participate in pizza competitions and culinary workshops to stay updated with the latest techniques and trends. Our commitment to excellence means continuous training and development for all team members. We take pride in our craft and love sharing our passion for authentic Italian pizza with our customers. Every member of our team is dedicated to providing you with an exceptional dining experience.',
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
      'From classic Margherita to innovative fusion flavors, our diverse menu caters to all preferences. Vegetarian, meat lovers, and specialty pizzas available.',
  },
  {
    icon: 'icon-[fluent--food-pizza-24-regular]',
    header: 'ALWAYS QUALITY DOUGH',
    description:
      'Hand-crafted daily using traditional Italian techniques. Our signature thin crust is made from premium flour and aged to perfection for the ideal texture.',
  },
  {
    icon: 'icon-[fluent-emoji-high-contrast--man-cook]',
    header: 'EXPERIENCED CHEF',
    description:
      'Our master chefs bring authentic Italian expertise to every pizza. Trained in traditional methods, they ensure consistent quality and authentic flavors.',
  },
]

onBeforeUnmount(() => sonner.setTheme('light'))
</script>

<template>
  <div class="min-h-screen w-screen scroll-smooth">
    <ScrollToTopButton />
    <LandingNavbar />
    <LandingHero />

    <!-- About Us Section -->
    <div
      id="about"
      class="flex flex-col w-screen bg-[#0A1316] p-4 sm:p-8 lg:p-30 pt-16 sm:pt-18 lg:pt-20 gap-12 sm:gap-16 lg:gap-20"
    >
      <InfoCard
        v-for="(section, index) in aboutSection"
        :key="index"
        :section-title="section.sectionTitle"
        :heading="section.heading"
        :description="section.description"
        :expanded-content="section.expandedContent"
        :button-text="section.buttonText"
        :image-src="section.imageSrc"
        :image-alt="section.imageAlt"
        :index="index"
      />
    </div>

    <!-- Features Section -->
    <div
      class="flex flex-col items-center w-screen bg-[#0A1316] p-4 sm:p-8 lg:p-20 pt-16 sm:pt-18 lg:pt-20 gap-4 sm:gap-5 lg:gap-6"
    >
      <div class="flex flex-col text-white items-center gap-2">
        FEATURES
        <span class="h-[1px] w-full bg-primary"></span>
      </div>
      <div
        class="flex flex-col w-full sm:w-4/5 lg:w-1/2 items-center text-white gap-4 sm:gap-5 lg:gap-6"
      >
        <div class="text-3xl sm:text-4xl font-semibold text-center">Why people choose us?</div>
        <div class="text-[#797B78] text-sm sm:text-base text-center">
          Experience the perfect blend of traditional Italian craftsmanship and modern convenience.
          Our commitment to quality ingredients and authentic preparation methods sets us apart in
          Cebu City's pizza scene.
        </div>
      </div>
      <div
        class="flex justify-center gap-8 sm:gap-12 lg:gap-20 xl:gap-50 mt-4 px-4 sm:px-8 lg:px-35 flex-col xl:flex-row"
      >
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="flex flex-col gap-3 sm:gap-4 items-center"
        >
          <span :class="['text-white size-16 sm:size-18 lg:size-20', feature.icon]"></span>
          <div class="text-white text-lg sm:text-xl lg:text-2xl font-semibold text-center">
            {{ feature.header }}
          </div>
          <div class="text-[#797B78] text-sm sm:text-base text-center">
            {{ feature.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- Menu Section -->
    <div
      id="menu"
      class="flex flex-col items-center w-screen bg-[#0A1316] p-4 sm:p-8 lg:p-20 pt-16 sm:pt-18 lg:pt-20 gap-4 sm:gap-5 lg:gap-6"
    >
      <div class="flex flex-col text-white items-center gap-2">
        MENU
        <span class="h-[1px] w-full bg-primary"></span>
      </div>
      <div
        class="flex flex-col w-full sm:w-4/5 lg:w-1/2 items-center text-white gap-4 sm:gap-5 lg:gap-6"
      >
        <div class="text-3xl sm:text-4xl font-semibold text-center">Explore Our Foods</div>
        <div class="text-[#797B78] text-sm sm:text-base text-center">
          Discover our signature pizzas crafted with authentic Italian techniques and premium
          ingredients. Each pizza is made fresh to order with our traditional wood-fired oven for
          that perfect crispy crust and smoky flavor.
        </div>
      </div>
      <!-- Pizza Cards Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl px-4 sm:px-8 lg:px-0"
      >
        <div
          v-for="pizza in displayedPizzas"
          :key="pizza.pizzaId!"
          class="bg-[#121A1D] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <!-- Pizza Image -->
          <div class="h-48 bg-gray-700 flex items-center justify-center relative">
            <img
              v-if="pizza.pizzaImage"
              :src="toBase64(pizza.pizzaImage as string)"
              :alt="pizza.pizzaName"
              class="w-full h-full object-cover"
              @error="
                (e: Event) => {
                  const img = e.target as HTMLImageElement
                  img.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfkLU8L3RleHQ+Cjwvc3ZnPg=='
                }
              "
            />
            <div v-else class="text-6xl">🍕</div>
          </div>

          <!-- Pizza Details -->
          <div class="p-4">
            <h3 class="text-lg font-semibold text-primary mb-1">{{ pizza.pizzaName }}</h3>
            <p class="text-[#D1D5DB] text-sm mb-3 line-clamp-2">{{ pizza.pizzaDescription }}</p>

            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-1">
                <span class="icon-[material-symbols--star-rounded] text-primary size-4"></span>
                <span class="text-white text-sm">
                  {{ formatRatingValue(pizza.averageRating) }} ({{ formatRatingCount(pizza.totalRatings) }})
                </span>
              </div>
              <span class="text-xl font-bold text-primary">₱{{ pizza.pizzaPrice }}</span>
            </div>

            <!-- Additional spacing to match admin cards -->
            <div class="flex justify-between items-center">
              <div class="flex gap-2">
                <!-- Empty space to match admin card layout -->
              </div>
              <!-- Empty space to match admin card layout -->
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="availablePizzas.length > 4" class="flex justify-center mt-8">
        <button
          class="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          @click="togglePizzaVisibility"
        >
          {{ showAllPizzas ? 'SHOW LESS' : 'LOAD MORE' }}
        </button>
      </div>
    </div>

    <!-- Get In Touch Section -->
    <div
      id="contact"
      class="flex flex-col items-center w-screen bg-[#0A1316] p-4 sm:p-8 lg:p-20 pt-16 sm:pt-18 lg:pt-20 gap-4 sm:gap-5 lg:gap-6"
    >
      <div class="flex flex-col text-white items-center gap-2">
        GET IN TOUCH
        <span class="h-[1px] w-full bg-primary"></span>
      </div>
      <div
        class="flex flex-col w-full sm:w-4/5 lg:w-1/2 items-center text-white gap-4 sm:gap-5 lg:gap-6"
      >
        <div class="text-3xl sm:text-4xl font-semibold text-center">Visit Our Location</div>
        <div class="text-[#797B78] text-sm sm:text-base text-center">
          Visit us at our convenient location near University of Cebu Main Campus. We're open Monday
          through Saturday, ready to serve you authentic Italian pizza made fresh daily. Contact us
          for catering, delivery, or dine-in reservations.
        </div>
      </div>
      <div
        class="flex justify-center gap-6 sm:gap-8 lg:gap-10 mt-4 px-4 sm:px-8 lg:px-30 w-full flex-col lg:flex-row"
      >
        <div
          class="h-64 sm:h-80 lg:h-200 w-full lg:w-1/2 flex flex-col p-4 sm:p-6 bg-[#121A1D] rounded-xl"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3922.123456789!2d123.9123456!3d10.3123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9b8c123456789%3A0x1234567890abcdef!2sUniversity%20of%20Cebu%20Main%20Campus%2C%20Sanciangko%20St%2C%20Cebu%20City%2C%20Cebu!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph"
            width="100%"
            height="100%"
            style="border: 0; border-radius: 8px"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          >
          </iframe>
          <div class="w-full flex justify-center pt-6">
            <a
              href="https://www.google.com/maps/place/University+of+Cebu+Main+Campus,+Sanciangko+St,+Cebu+City,+Cebu"
              target="_blank"
              class="text-primary flex items-end gap-2 hover:text-primary/80 transition-colors"
            >
              <span class="icon-[ion--arrow-up-right-box-outline] size-6"></span>
              <span>View Larger Map</span>
            </a>
          </div>
        </div>

        <div class="w-full lg:w-1/2 flex flex-col gap-6 sm:gap-8 lg:gap-10 justify-between">
          <div class="bg-[#121A1D] w-full rounded-lg flex p-10 gap-10">
            <div class="size-16 rounded-full flex items-center justify-center bg-primary/20">
              <span class="icon-[heroicons--map-pin-solid] text-primary size-12"></span>
            </div>
            <div class="flex flex-col text-white gap-4">
              <div class="font-bold text-2xl">Our Location</div>
              <div class="text-[#D1D5DB] text-base">
                <div>University of Cebu Main Campus</div>
                <div>Sanciangko Street, Cebu City</div>
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

    <div class="relative w-screen h-48 sm:h-60 lg:h-180">
      <div class="absolute inset-0 bg-[url('@/assets/footerlanding.png')] bg-cover bg-center"></div>
      <div class="absolute inset-0 bg-black/50"></div>
      <div
        class="relative h-full w-full sm:w-4/5 lg:w-1/2 gap-6 sm:gap-8 lg:gap-12 p-4 sm:p-8 lg:p-40 py-8 sm:py-12 lg:py-16 flex flex-col justify-center"
      >
        <div class="text-2xl sm:text-4xl lg:text-6xl text-white">
          Experience Authentic Italian Pizza in Cebu City
        </div>
        <div class="flex flex-col sm:flex-row text-sm sm:text-base lg:text-lg gap-3 sm:gap-4">
          <button 
            @click="handleOrderNow"
            class="bg-primary text-white p-3 sm:p-4 rounded-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Order Now
          </button>
          <button
            @click="handleContactUs"
            class="bg-transparent border border-white text-white p-3 sm:p-4 rounded-sm hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>
