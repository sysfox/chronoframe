<script lang="ts" setup>
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: $t('title.generalSettings'),
})

const colorMode = useColorMode()

const { fields, state, submit, loading } = useSettingsForm('app')

const appFields = computed(() =>
  fields.value.filter(
    (f) => !f.key.startsWith('appearance.') && f.key !== 'customScript',
  ),
)

const appearanceFields = computed(() =>
  fields.value.filter((f) => f.key.startsWith('appearance.')),
)

const customScriptFields = computed(() =>
  fields.value.filter((f) => f.key === 'customScript'),
)

const handleAppSettingsSubmit = async () => {
  const appData = Object.fromEntries(
    appFields.value.map((f) => [f.key, state[f.key]]),
  )
  try {
    await submit(appData)
  } catch {
    /* empty */
  }
}

const handleAppearanceSettingsSubmit = async () => {
  const appearanceData = Object.fromEntries(
    appearanceFields.value.map((f) => [f.key, state[f.key]]),
  )
  try {
    await submit(appearanceData)
    if (state['appearance.theme']) {
      colorMode.preference = state['appearance.theme']
    }
  } catch {
    /* empty */
  }
}

const handleCustomScriptSubmit = async () => {
  const scriptData = Object.fromEntries(
    customScriptFields.value.map((f) => [f.key, state[f.key]]),
  )
  try {
    await submit(scriptData)
  } catch {
    /* empty */
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="$t('title.generalSettings')" />
    </template>

    <template #body>
      <div class="space-y-6 max-w-6xl">
        <!-- 通用设置 -->
        <UCard variant="outline">
          <template #header>
            <span>{{ $t('title.generalSettings') }}</span>
          </template>

          <UForm
            id="appSettingsForm"
            class="space-y-4"
            @submit="handleAppSettingsSubmit"
          >
            <SettingField
              v-for="field in appFields"
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
              form="appSettingsForm"
              variant="soft"
              icon="tabler:device-floppy"
            >
              保存设置
            </UButton>
          </template>
        </UCard>

        <!-- 外观设置 -->
        <UCard variant="outline">
          <template #header>
            <span>{{ $t('title.appearanceSettings') }}</span>
          </template>

          <UForm
            id="appearanceSettingsForm"
            class="space-y-4"
            @submit="handleAppearanceSettingsSubmit"
          >
            <SettingField
              v-for="field in appearanceFields"
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
              form="appearanceSettingsForm"
              variant="soft"
              icon="tabler:device-floppy"
            >
              保存设置
            </UButton>
          </template>
        </UCard>

        <!-- 自定义脚本 -->
        <UCard variant="outline">
          <template #header>
            <span>{{ $t('settings.app.customScript.label') }}</span>
          </template>

          <UForm
            id="customScriptForm"
            class="space-y-4"
            @submit="handleCustomScriptSubmit"
          >
            <SettingField
              v-for="field in customScriptFields"
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
              form="customScriptForm"
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

<style scoped></style>
