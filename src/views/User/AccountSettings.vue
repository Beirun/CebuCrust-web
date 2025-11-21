<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { toBase64, base64ToFile } from '@/plugins/convert'
import { Eye, EyeOff, Upload } from 'lucide-vue-next'
import UserHeader from '@/components/UserHeader.vue'
import AdminHeader from '@/components/AdminHeader.vue'
import Footer from '@/components/Footer.vue'

const auth = useAuthStore()
const userStore = useUserStore()

// Form state
const user = ref(auth.user ? { ...auth.user } : {}) //- If there’s a logged-in user, copy their info into our local user box.
const preview = ref<string | null>(user.value?.profileImage || user.value?.profileImageUrl || null) //pic preview
const isSaving = ref(false) //flag for loading spinner
const fileInput = ref<HTMLInputElement | null>(null) // added ref
const newProfileImage = ref<File | null>() //Holds the new uploaded image file
const imageRemoved = ref(false) // Track if user has removed the image in this session

// Password change state(A box holding the three password fields)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

//flags to decide if each password field should be visible
const showPasswords = ref({
  current: false,
  new: false,
  confirm: false,
})

// Form validation(shows error message)
const errors = ref<Record<string, string>>({})
const hasFetchedAllUsers = ref(false)

// Sync local user if auth.user changes
watch(
  () => auth.user,
  (val) => {
    if (!val) {
      user.value = {}
      preview.value = null
      return
    }
    
    user.value = { ...val }
    
    // Check localStorage flag - if image was removed, don't show it even if backend returned it
    const wasImageRemoved = localStorage.getItem('profileImageRemoved') === 'true'
    
    // Reset removal flag when user data changes from external source (like login)
    // But keep it if localStorage flag is set
    if (!wasImageRemoved) {
      imageRemoved.value = false
    }
    
    // Check if image fields exist and are not empty/null, AND image wasn't removed
    const hasImage = !wasImageRemoved && 
                     ((user.value?.profileImage && typeof user.value.profileImage === 'string' && user.value.profileImage.trim() !== '') || 
                      (user.value?.profileImageUrl && typeof user.value.profileImageUrl === 'string' && user.value.profileImageUrl.trim() !== ''))
    
    if (hasImage) {
      const imageSource = user.value.profileImage || user.value.profileImageUrl
      if (imageSource && imageSource.startsWith('data:')) { //uses data format(long text code for images)
        preview.value = imageSource
      } else if (imageSource) {
        preview.value = toBase64(imageSource) //if not, converts pic to base64
      } else {
        preview.value = null
      }
    } else {
      preview.value = null //if no pic
      // Ensure image fields are deleted if they're empty/null or if image was removed
      if (wasImageRemoved || !user.value?.profileImage || !user.value?.profileImageUrl) {
        delete user.value.profileImage
        delete user.value.profileImageUrl
      }
    }
  },
  { immediate: true },
)

const hasProfileImage = computed(() => !!preview.value) //stores the new profile in this variable

// File handling
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement //grabs the thing that triggered the event
  if (!input.files || input.files.length === 0) return //stops if there are no files selected(return)

  //takes the first file the user picked, stores in file variable then saves in the newprofimagevalue box
  const file = input.files[0] 
  newProfileImage.value = file

  //file size checker
  if (file.size > 2 * 1024 * 1024) { 
    errors.value.profileImage = 'File size must be less than 2MB'
    return
  }

  //allowed file types checker
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errors.value.profileImage = 'Only JPG, PNG, and WEBP files are allowed'
    return
  }

  const reader = new FileReader() //helper to read files into text or data
  reader.onload = async () => {
    const result = reader.result as string //the file turned into base64
    console.log('res', result)
    preview.value = result //updates the preview value so that the new pic will show in the screen
    user.value.profileImage = result //saves the new pic to this variable
    imageRemoved.value = false // Reset removal flag when new image is selected
    localStorage.removeItem('profileImageRemoved') // Clear removal flag when new image is selected
    delete errors.value.profileImage
    console.log('result', result)
  }
  reader.readAsDataURL(file) //tells the reader to read this file as data url, meaning turn the pic into text string that browsers can display
}

//drag and drop function
const onDrop = (e: DragEvent) => {
  e.preventDefault() //prevents to open the dropped file into a new tab
  const files = e.dataTransfer?.files //stores the dropped files 
  if (files && files.length > 0) { //if there are files continue if not stop
    const file = files[0] //grabs the first file
    const fakeEvent = { target: { files: [file] } } as Event //fake event so that onfilechage func can read this function
    onFileChange(fakeEvent)
  }
}

//allows the dragand drop function to drop files in this specific element
const onDragOver = (e: DragEvent) => e.preventDefault()

//remove photo function
const removePhoto = () => {
  preview.value = null //pic on screen turn into null to remove
  user.value.profileImage = null //actual pic stored in the user's data turned to null to remove
  delete user.value.profileImage
  delete user.value.profileImageUrl
  imageRemoved.value = true // Mark that image was removed
  newProfileImage.value = null // Clear any pending upload
  delete errors.value.profileImage
}

// Password visibility toggle
const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
  showPasswords.value[field] = !showPasswords.value[field]
}

// Validation
const validateForm = () => {
  errors.value = {}
  if (!user.value.firstName?.trim()) errors.value.firstName = 'First name is required'
  if (!user.value.lastName?.trim()) errors.value.lastName = 'Last name is required'
  if (!user.value.email?.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.value.email)) { //gmail checker
    errors.value.email = 'Please enter a valid email address'
  }
  if (!user.value.phoneNo?.trim()) errors.value.phoneNo = 'Phone number is required'

  //checks if there are anything in the password field
  const hasPasswordFields =
    passwordForm.value.currentPassword ||
    passwordForm.value.newPassword ||
    passwordForm.value.confirmPassword
  
  //must type current,new,confirm new password
  if (hasPasswordFields) {
    if (!passwordForm.value.currentPassword)
      errors.value.currentPassword = 'Current password is required'
    if (!passwordForm.value.newPassword) errors.value.newPassword = 'New password is required'
    else if (passwordForm.value.newPassword.length < 6)
      errors.value.newPassword = 'Password must be at least 6 characters'
    if (!passwordForm.value.confirmPassword)
      errors.value.confirmPassword = 'Please confirm your new password'
    else if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword)
      errors.value.confirmPassword = 'Passwords do not match'
  }
  return Object.keys(errors.value).length === 0 //gives all the error messages, if 0 form is valid
}

// Helper to ensure email uniqueness before submitting to backend
const ensureEmailIsUnique = async () => {
  const newEmail = user.value.email?.trim()
  const currentEmail = auth.user?.email?.trim()

  if (!newEmail) return false
  if (!currentEmail || newEmail.toLowerCase() === currentEmail.toLowerCase()) {
    return true
  }

  try {
    if (!hasFetchedAllUsers.value || !userStore.users.length) {
      await userStore.getAllUsers()
      hasFetchedAllUsers.value = true
    }

    const duplicate = userStore.users.some(
      (existingUser) =>
        existingUser.userId !== auth.user?.userId &&
        existingUser.email?.toLowerCase() === newEmail.toLowerCase(),
    )

    if (duplicate) {
      errors.value.email = 'This email is already registered to another account'
      return false
    }

    return true
  } catch (fetchError) {
    console.error('Failed to verify email uniqueness', fetchError)
    errors.value.email = 'Unable to verify email. Please try again.'
    return false
  }
}

// Helper to ensure phone number uniqueness before submitting to backend
const ensurePhoneIsUnique = async () => {
  const newPhone = user.value.phoneNo?.trim()
  const currentPhone = auth.user?.phoneNo?.trim()

  if (!newPhone) return false
  if (!currentPhone || newPhone === currentPhone) {
    return true
  }

  try {
    if (!hasFetchedAllUsers.value || !userStore.users.length) {
      await userStore.getAllUsers()
      hasFetchedAllUsers.value = true
    }

    const duplicate = userStore.users.some(
      (existingUser) =>
        existingUser.userId !== auth.user?.userId &&
        existingUser.phoneNo?.trim() === newPhone,
    )

    if (duplicate) {
      errors.value.phoneNo = 'This phone number is already registered to another account'
      return false
    }

    return true
  } catch (fetchError) {
    console.error('Failed to verify phone number uniqueness', fetchError)
    errors.value.phoneNo = 'Unable to verify phone number. Please try again.'
    return false
  }
}

// Save changes
const save = async () => {
  if (!validateForm()) return
  isSaving.value = true
  try {
    const isEmailUnique = await ensureEmailIsUnique()
    if (!isEmailUnique) {
      isSaving.value = false
      return
    }
    const isPhoneUnique = await ensurePhoneIsUnique()
    if (!isPhoneUnique) {
      isSaving.value = false
      return
    }
    // Check for original image - treat empty strings as no image
    const originalProfileImage = (auth.user?.profileImage && typeof auth.user.profileImage === 'string' && auth.user.profileImage.trim() !== '') 
      ? auth.user.profileImage 
      : ((auth.user?.profileImageUrl && typeof auth.user.profileImageUrl === 'string' && auth.user.profileImageUrl.trim() !== '') 
          ? auth.user.profileImageUrl 
          : '')
    const hasProfileImageChanged =
      (user.value.profileImage || user.value.profileImageUrl) !== originalProfileImage //checker if the user changed profile
    // Check if image was removed: either in this session, localStorage flag, or if original had image but current doesn't
    const currentImage = (user.value.profileImage && typeof user.value.profileImage === 'string' && user.value.profileImage.trim() !== '') 
      ? user.value.profileImage 
      : ((user.value.profileImageUrl && typeof user.value.profileImageUrl === 'string' && user.value.profileImageUrl.trim() !== '') 
          ? user.value.profileImageUrl 
          : '')
    // Check localStorage flag to see if image was previously removed
    const wasImageRemoved = localStorage.getItem('profileImageRemoved') === 'true'
    const isProfileImageRemoved =
      imageRemoved.value || wasImageRemoved || (originalProfileImage && !currentImage) //checker if the user removed profile
    const hasPersonalInfoChanged = //checker if the user changed any personal information
      user.value.firstName !== auth.user?.firstName ||
      user.value.lastName !== auth.user?.lastName ||
      user.value.email !== auth.user?.email ||
      user.value.phoneNo !== auth.user?.phoneNo
    const hasPasswordChanged = //checker if the user changed password
      passwordForm.value.currentPassword &&
      passwordForm.value.newPassword &&
      passwordForm.value.confirmPassword

    // Store original image data to preserve it if only personal info is updated
    const originalImageData = originalProfileImage || null
    const originalImageField = auth.user?.profileImage ? 'profileImage' : (auth.user?.profileImageUrl ? 'profileImageUrl' : null)
    
    //updates function where it sends the package of new info to the backend
    const updates: Record<string, unknown> = {
      userFName: user.value.firstName,
      userLName: user.value.lastName,
      userEmail: user.value.email,
      userPhoneNo: user.value.phoneNo,
    }

    // If user removed the image, send a flag to backend
    if (isProfileImageRemoved) {
      updates.removeImage = true
    } else if (newProfileImage.value) {
      // Only send image if it's a new file upload (not a removal)
      updates.image = newProfileImage.value
    } else if (originalImageData && !isProfileImageRemoved) {
      // CRITICAL: Backend deletes image if Image is null, so we must send existing image
      // when only personal info is updated to preserve it
      // Convert base64 to File object - handle both data URLs and plain base64
      let imageDataToConvert = originalImageData
      // If it's not a data URL, convert it to one first
      if (!originalImageData.includes(',')) {
        imageDataToConvert = toBase64(originalImageData)
      }
      const existingImageFile = base64ToFile(imageDataToConvert, 'profile.jpg')
      if (existingImageFile) {
        updates.image = existingImageFile
      }
    }

    //If the user is changing their password, add those fields to the update package
    if (hasPasswordChanged) {
      updates.currentPassword = passwordForm.value.currentPassword
      updates.newPassword = passwordForm.value.newPassword
      updates.confirmPassword = passwordForm.value.confirmPassword
    }

    //Send the updates to the backend using auth.update
    const { ok, message } = await auth.update(updates)
    if (ok) {
      const { useSonnerStore } = await import('@/stores/sonner')
      const sonner = useSonnerStore()
      if (hasProfileImageChanged) sonner.success('Profile picture updated successfully!')
      if (hasPersonalInfoChanged) sonner.success('Personal information updated successfully!')
      if (hasPasswordChanged) sonner.success('Password changed successfully!')

      // Sync local state with auth store after update
      user.value = auth.user ? { ...auth.user } : {}
      
      // Preserve image if it wasn't removed and no new image was uploaded
      // This ensures the image stays when only personal info is updated
      if (!isProfileImageRemoved && !newProfileImage.value && originalImageData) {
        // Check if backend returned the image
        const backendHasImage = (auth.user?.profileImage && typeof auth.user.profileImage === 'string' && auth.user.profileImage.trim() !== '') ||
                                (auth.user?.profileImageUrl && typeof auth.user.profileImageUrl === 'string' && auth.user.profileImageUrl.trim() !== '')
        
        if (!backendHasImage) {
          // Backend didn't return image, restore it from original data in local state
          if (originalImageField === 'profileImage') {
            user.value.profileImage = originalImageData
          } else if (originalImageField === 'profileImageUrl') {
            user.value.profileImageUrl = originalImageData
          }
        } else {
          // Backend returned image, use it
          if (auth.user?.profileImage) {
            user.value.profileImage = auth.user.profileImage
          }
          if (auth.user?.profileImageUrl) {
            user.value.profileImageUrl = auth.user.profileImageUrl
          }
        }
      }
      
      // Clear the form and ensure preview reflects the new state
      if (isProfileImageRemoved) {
        preview.value = null
        user.value.profileImage = null
        user.value.profileImageUrl = null
        // Ensure image fields are deleted from local state
        delete user.value.profileImage
        delete user.value.profileImageUrl
        // Keep the removal flag set (don't reset it) so it persists across sessions
        // The flag will be cleared when a new image is uploaded
      } else if (user.value.profileImage || user.value.profileImageUrl) {
        const imageToShow = user.value.profileImage || user.value.profileImageUrl
        if (imageToShow && imageToShow.startsWith('data:')) {
          preview.value = imageToShow
        } else if (imageToShow) {
          preview.value = toBase64(imageToShow)
        } else {
          preview.value = null
        }
        // Clear removal flag if image exists
        imageRemoved.value = false
        localStorage.removeItem('profileImageRemoved')
      } else {
        preview.value = null
      }
      
      // Reset new file upload reference
      newProfileImage.value = null
      
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' } //erases all in the field
    } else if (message) {
      if (message.toLowerCase().includes('email')) {
        errors.value.email = message
      } else if (message.toLowerCase().includes('phone')) {
        errors.value.phoneNo = message
      }
    }
  } catch (error) {
    console.error('Error updating profile:', error)
  } finally {
    isSaving.value = false
  }
}

const cancel = () => {
  user.value = auth.user ? { ...auth.user } : {}
  preview.value = user.value?.profileImage || user.value?.profileImageUrl || null //show the user's original profile image again
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' } //this undoes any password changes you were typing
  errors.value = {} //remove all error messages
  imageRemoved.value = false // Reset removal flag on cancel
  newProfileImage.value = null // Clear any pending upload
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AdminHeader v-if="auth.isAdmin" />
    <UserHeader v-else />

    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p class="text-gray-600 mt-2">Manage your personal information.</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm border p-8">
        <!-- Profile Picture Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Profile Picture</h2>
          <div class="flex flex-col lg:flex-row gap-8">
            <div class="flex flex-col items-center">
              <div
                class="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center mb-4"
              >
                <img
                  v-if="preview"
                  :src="preview.includes('data:image') ? preview : toBase64(preview)"
                  alt="profile"
                  class="w-full h-full object-cover"
                />
                <div v-else class="text-gray-400 text-sm">No Image</div>
              </div>
              <div class="flex flex-col gap-2">
                <button
                  @click="fileInput?.click()"
                  class="text-orange-500 hover:text-orange-600 text-sm font-medium"
                >
                  Change Photo
                </button>
                <button
                  v-if="hasProfileImage"
                  @click="removePhoto"
                  class="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Remove Photo
                </button>
              </div>
            </div>

            <!-- Upload Area -->
            <div class="flex-1">
              <div
                @drop="onDrop"
                @dragover="onDragOver"
                @dragenter="onDragOver"
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                @click="fileInput?.click()"
              >
                <Upload class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p class="text-gray-600 mb-2">
                  Drop your image here, or
                  <span class="text-orange-500 font-medium">browse</span>
                </p>
                <p class="text-sm text-gray-400">Supports: JPG, PNG, WEBP (Max 2MB)</p>
                <input
                  ref="fileInput"
                  id="profile-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  @change="onFileChange"
                  class="hidden"
                />
              </div>
              <p v-if="errors.profileImage" class="text-red-500 text-sm mt-2">
                {{ errors.profileImage }}
              </p>
            </div>
          </div>
        </div>

        <!-- Personal Information Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                v-model="user.firstName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': errors.firstName }"
              />
              <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">
                {{ errors.firstName }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                v-model="user.lastName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': errors.lastName }"
              />
              <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                v-model="user.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': errors.email }"
              />
              <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                v-model="user.phoneNo"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': errors.phoneNo }"
              />
              <p v-if="errors.phoneNo" class="text-red-500 text-sm mt-1">{{ errors.phoneNo }}</p>
            </div>
          </div>
        </div>

        <!-- Change Password Section -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div class="relative">
                <input
                  v-model="passwordForm.currentPassword"
                  :type="showPasswords.current ? 'text' : 'password'"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  :class="{ 'border-red-500': errors.currentPassword }"
                />
                <button
                  @click="togglePasswordVisibility('current')"
                  type="button"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="!showPasswords.current" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.currentPassword" class="text-red-500 text-sm mt-1">
                {{ errors.currentPassword }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div class="relative">
                <input
                  v-model="passwordForm.newPassword"
                  :type="showPasswords.new ? 'text' : 'password'"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  :class="{ 'border-red-500': errors.newPassword }"
                />
                <button
                  @click="togglePasswordVisibility('new')"
                  type="button"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="!showPasswords.new" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.newPassword" class="text-red-500 text-sm mt-1">
                {{ errors.newPassword }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div class="relative">
                <input
                  v-model="passwordForm.confirmPassword"
                  :type="showPasswords.confirm ? 'text' : 'password'"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  :class="{ 'border-red-500': errors.confirmPassword }"
                />
                <button
                  @click="togglePasswordVisibility('confirm')"
                  type="button"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="!showPasswords.confirm" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">
                {{ errors.confirmPassword }}
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4">
          <button
            @click="cancel"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="isSaving"
            class="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>