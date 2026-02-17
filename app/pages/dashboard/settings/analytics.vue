<script lang="ts" setup>
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: $t('title.analyticsSettings'),
})

const { fields, state, submit, loading } = useSettingsForm('analytics')

const customFields = computed(() =>
  fields.value.filter((f) => f.key.startsWith('custom.')),
)

const handleSubmit = async () => {
  const data = Object.fromEntries(
    customFields.value.map((f) => [f.key, state[f.key]]),
  )
  try {
    await submit(data)
  } catch {
    /* empty */
  }
}

</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="$t('title.analyticsSettings')" />
    </template>

    <template #body>
      <div class="space-y-6 max-w-6xl">
        <!-- 自定义分析脚本 -->
        <UCard variant="outline">
          <template #header>
            <span>{{ $t('title.customAnalytics') }}</span>
          </template>

          <UForm
            id="analyticsSettingsForm"
            class="space-y-4"
            @submit="handleSubmit"
          >
            <SettingField
              v-for="field in customFields"
              :key="field.key"
              :field="field"
              :model-value="state[field.key]"
              @update:model-value="(val) => (state[field.key] = val)"
            />
          </UForm>

          <template #footer>
            <UButton
              :loading="loading"
              type="submit"
              form="analyticsSettingsForm"
              variant="soft"
              icon="tabler:device-floppy"
            >
              保存设置
            </UButton>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
