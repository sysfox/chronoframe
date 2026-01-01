<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Submit Photos',
})

const MAX_FILE_SIZE = 50 // in MB

const submitterName = ref('')
const submitterEmail = ref('')
const submitterMessage = ref('')
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const toast = useToast()

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.add({
        title: 'Invalid file type',
        description: 'Please select an image file',
        color: 'error',
      })
      return
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
      toast.add({
        title: 'File too large',
        description: `Please select a file smaller than ${MAX_FILE_SIZE}MB`,
        color: 'error',
      })
      return
    }
    
    selectedFile.value = file
  }
}

const clearSelection = () => {
  selectedFile.value = null
  uploadProgress.value = 0
  uploadStatus.value = 'idle'
  errorMessage.value = ''
}

const handleSubmit = async () => {
  if (!selectedFile.value) {
    toast.add({
      title: 'No file selected',
      description: 'Please select a photo to submit',
      color: 'warning',
    })
    return
  }

  isUploading.value = true
  uploadStatus.value = 'uploading'
  errorMessage.value = ''

  try {
    // Step 1: Get signed URL
    const signedUrlResponse = await $fetch('/api/submissions', {
      method: 'POST',
      body: {
        fileName: selectedFile.value.name,
        contentType: selectedFile.value.type,
        submitterName: submitterName.value,
        submitterEmail: submitterEmail.value,
        submitterMessage: submitterMessage.value,
      },
    })

    // Step 2: Upload file
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100)
      }
    })

    await new Promise<void>((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error('Upload failed'))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'))
      })

      xhr.open('PUT', signedUrlResponse.signedUrl)
      xhr.setRequestHeader('Content-Type', selectedFile.value?.type || 'application/octet-stream')
      xhr.send(selectedFile.value)
    })

    // Step 3: Process the upload
    uploadStatus.value = 'processing'
    await $fetch('/api/submissions/process', {
      method: 'POST',
      body: {
        fileKey: signedUrlResponse.fileKey,
        fileName: selectedFile.value.name,
        submitterName: submitterName.value,
        submitterEmail: submitterEmail.value,
        submitterMessage: submitterMessage.value,
      },
    })

    uploadStatus.value = 'success'
    toast.add({
      title: 'Submission successful',
      description: 'Your photo has been submitted for review. Thank you!',
      color: 'success',
    })

    // Reset form
    submitterName.value = ''
    submitterEmail.value = ''
    submitterMessage.value = ''
    selectedFile.value = null
    uploadProgress.value = 0
    
    setTimeout(() => {
      uploadStatus.value = 'idle'
    }, 3000)
  } catch (error: any) {
    uploadStatus.value = 'error'
    errorMessage.value = error.message || 'Upload failed'
    toast.add({
      title: 'Upload failed',
      description: errorMessage.value,
      color: 'error',
    })
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Submit Your Photos
        </h1>
        <p class="text-lg text-neutral-600 dark:text-neutral-400">
          Share your amazing photos with us
        </p>
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- File Upload -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Photo *
            </label>
            <div class="mt-1">
              <input
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="block w-full text-sm text-neutral-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100
                  dark:file:bg-primary-900 dark:file:text-primary-300
                  dark:hover:file:bg-primary-800"
              />
            </div>
            <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Maximum file size: {{ MAX_FILE_SIZE }}MB
            </p>
            
            <div v-if="selectedFile" class="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-700 dark:text-neutral-300">
                  {{ selectedFile.name }}
                </span>
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="tabler:x"
                  @click="clearSelection"
                />
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="uploadStatus === 'uploading'" class="space-y-2">
            <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div 
                class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              Uploading... {{ uploadProgress }}%
            </p>
          </div>

          <div v-if="uploadStatus === 'processing'" class="text-center py-4">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto text-primary-600" />
            <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Processing your photo...
            </p>
          </div>

          <div v-if="uploadStatus === 'success'" class="text-center py-4">
            <Icon name="tabler:circle-check" class="w-12 h-12 mx-auto text-success-600" />
            <p class="mt-2 text-sm text-success-600 dark:text-success-400">
              Photo submitted successfully!
            </p>
          </div>

          <!-- Name -->
          <UFormField
            label="Your Name (Optional)"
            name="name"
          >
            <UInput
              v-model="submitterName"
              placeholder="Enter your name"
            />
          </UFormField>

          <!-- Email -->
          <UFormField
            label="Email (Optional)"
            name="email"
          >
            <UInput
              v-model="submitterEmail"
              type="email"
              placeholder="your.email@example.com"
            />
          </UFormField>

          <!-- Message -->
          <UFormField
            label="Message (Optional)"
            name="message"
          >
            <UTextarea
              v-model="submitterMessage"
              :rows="4"
              placeholder="Tell us about this photo..."
            />
          </UFormField>

          <!-- Submit Button -->
          <div class="flex gap-3">
            <UButton
              type="submit"
              size="lg"
              class="flex-1"
              :disabled="!selectedFile || isUploading"
              :loading="isUploading"
              icon="tabler:upload"
            >
              {{ isUploading ? 'Submitting...' : 'Submit Photo' }}
            </UButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
