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

        <!-- 帮助说明 -->
        <UCard variant="outline" class="bg-blue-50 dark:bg-blue-950">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="tabler:info-circle" />
              <span>{{ $t('title.analyticsHelp') }}</span>
            </div>
          </template>

          <div class="space-y-4 text-sm">
            <div>
              <h4 class="font-semibold mb-2">支持的服务</h4>
              <p class="text-gray-600 dark:text-gray-400">
                支持 Umami、51LA、Plausible、Fathom、Mixpanel
                等任何使用 JavaScript 追踪代码的分析服务
              </p>
            </div>

            <div>
              <h4 class="font-semibold mb-2">三种脚本注入方式</h4>
              <ul class="space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  <strong>启用自定义脚本：</strong>
                  勾选后才会注入自定义分析脚本
                </li>
                <li>
                  <strong>Head 脚本：</strong>
                  注入到 HTML &lt;head&gt; 标签，用于初始化全局变量
                </li>
                <li>
                  <strong>Body 脚本：</strong>
                  在页面加载完成后执行，用于页面追踪等操作
                </li>
                <li>
                  <strong>外部脚本：</strong>
                  JSON 格式数组，从 CDN 或服务器加载脚本文件
                </li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-2">外部脚本示例</h4>
              <pre class="bg-white dark:bg-gray-900 p-2 rounded text-xs overflow-auto">{{
                `[
  {
    "src": "https://cloud.umami.is/script.js",
    "async": true
  },
  {
    "src": "https://example.com/analytics.js",
    "defer": true
  }
]`
              }}</pre>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
