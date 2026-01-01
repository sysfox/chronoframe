<script lang="ts" setup>
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Submissions',
})

interface Submission {
  id: number
  storageKey: string
  originalUrl: string | null
  thumbnailUrl: string | null
  thumbnailHash: string | null
  submitterName: string | null
  submitterEmail: string | null
  submitterMessage: string | null
  fileName: string
  fileSize: number | null
  width: number | null
  height: number | null
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: number | null
  reviewedAt: Date | null
  photoId: string | null
  createdAt: Date
}

const toast = useToast()
const filterStatus = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')

const { data: submissions, refresh } = await useFetch<Submission[]>('/api/submissions', {
  query: computed(() => ({
    status: filterStatus.value === 'all' ? undefined : filterStatus.value,
  })),
})

const isApproving = ref<Record<number, boolean>>({})
const isDeleting = ref<Record<number, boolean>>({})

const handleApprove = async (submission: Submission) => {
  if (isApproving.value[submission.id]) return
  
  isApproving.value[submission.id] = true
  
  try {
    await $fetch(`/api/submissions/${submission.id}/approve`, {
      method: 'POST',
    })
    
    toast.add({
      title: 'Submission approved',
      description: 'The photo has been added to your gallery',
      color: 'success',
    })
    
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to approve',
      description: error.message || 'An error occurred',
      color: 'error',
    })
  } finally {
    isApproving.value[submission.id] = false
  }
}

const handleDelete = async (submission: Submission) => {
  if (isDeleting.value[submission.id]) return
  
  if (!confirm('Are you sure you want to delete this submission?')) {
    return
  }
  
  isDeleting.value[submission.id] = true
  
  try {
    await $fetch(`/api/submissions/${submission.id}`, {
      method: 'DELETE',
    })
    
    toast.add({
      title: 'Submission deleted',
      description: 'The submission has been removed',
      color: 'success',
    })
    
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Failed to delete',
      description: error.message || 'An error occurred',
      color: 'error',
    })
  } finally {
    isDeleting.value[submission.id] = false
  }
}

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Photo Submissions" />
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <!-- Filter Bar -->
        <div class="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <div class="flex items-center gap-2">
            <UIcon name="tabler:filter" class="text-neutral-500" />
            <span class="font-medium text-neutral-700 dark:text-neutral-300">
              Status Filter:
            </span>
          </div>
          
          <USelectMenu
            v-model="filterStatus"
            :items="[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
            ]"
            value-key="value"
            label-key="label"
            size="sm"
          />
        </div>

        <!-- Submissions Grid -->
        <div v-if="submissions && submissions.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="submission in submissions"
            :key="submission.id"
            class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Image -->
            <div class="relative aspect-video bg-neutral-100 dark:bg-neutral-800">
              <img
                v-if="submission.thumbnailUrl || submission.originalUrl"
                :src="submission.thumbnailUrl || submission.originalUrl || ''"
                :alt="submission.fileName"
                class="w-full h-full object-cover"
              />
              <div v-else class="flex items-center justify-center h-full">
                <Icon name="tabler:photo-off" class="w-12 h-12 text-neutral-400" />
              </div>
              
              <!-- Status Badge -->
              <UBadge
                :color="getStatusColor(submission.status)"
                variant="solid"
                class="absolute top-2 right-2"
              >
                {{ submission.status }}
              </UBadge>
            </div>

            <!-- Details -->
            <div class="p-4 space-y-3">
              <div>
                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {{ submission.fileName }}
                </h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ formatFileSize(submission.fileSize) }}
                  <span v-if="submission.width && submission.height">
                    • {{ submission.width }}×{{ submission.height }}
                  </span>
                </p>
              </div>

              <div v-if="submission.submitterName || submission.submitterEmail" class="text-sm">
                <p v-if="submission.submitterName" class="text-neutral-700 dark:text-neutral-300">
                  <Icon name="tabler:user" class="w-4 h-4 inline" />
                  {{ submission.submitterName }}
                </p>
                <p v-if="submission.submitterEmail" class="text-neutral-600 dark:text-neutral-400 truncate">
                  <Icon name="tabler:mail" class="w-4 h-4 inline" />
                  {{ submission.submitterEmail }}
                </p>
              </div>

              <div v-if="submission.submitterMessage" class="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                "{{ submission.submitterMessage }}"
              </div>

              <div class="text-xs text-neutral-500 dark:text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                Submitted: {{ formatDate(submission.createdAt) }}
              </div>

              <!-- Actions -->
              <div v-if="submission.status === 'pending'" class="flex gap-2 pt-2">
                <UButton
                  color="success"
                  variant="soft"
                  size="sm"
                  icon="tabler:check"
                  class="flex-1"
                  :loading="isApproving[submission.id]"
                  :disabled="isDeleting[submission.id]"
                  @click="handleApprove(submission)"
                >
                  Approve
                </UButton>
                <UButton
                  color="error"
                  variant="soft"
                  size="sm"
                  icon="tabler:x"
                  class="flex-1"
                  :loading="isDeleting[submission.id]"
                  :disabled="isApproving[submission.id]"
                  @click="handleDelete(submission)"
                >
                  Reject
                </UButton>
              </div>
              
              <div v-else-if="submission.status === 'approved'" class="pt-2">
                <UButton
                  variant="soft"
                  color="primary"
                  size="sm"
                  icon="tabler:external-link"
                  class="w-full"
                  @click="navigateTo(`/${submission.photoId}`)"
                >
                  View Photo
                </UButton>
              </div>
              
              <div v-else class="pt-2">
                <UButton
                  color="error"
                  variant="ghost"
                  size="sm"
                  icon="tabler:trash"
                  class="w-full"
                  :loading="isDeleting[submission.id]"
                  @click="handleDelete(submission)"
                >
                  Delete
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="tabler:photo-off" class="w-16 h-16 text-neutral-400 mb-4" />
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No submissions found
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">
            {{ filterStatus === 'pending' ? 'No pending submissions at the moment.' : `No ${filterStatus} submissions.` }}
          </p>
          <UButton
            variant="soft"
            color="primary"
            icon="tabler:refresh"
            @click="refresh"
          >
            Refresh
          </UButton>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
