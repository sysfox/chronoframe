import type { FieldDescriptor, SettingsFieldsResponse } from '~~/shared/types/settings'

/**
 * 安全提取错误消息字符串
 * 处理各种错误对象格式，确保返回可读的字符串
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  if (err && typeof err === 'object') {
    // Handle FetchError / H3Error data
    const e = err as Record<string, any>
    if (typeof e.statusMessage === 'string') return e.statusMessage
    if (typeof e.message === 'string') return e.message
    if (e.data && typeof e.data.message === 'string') return e.data.message
  }
  return String(err)
}

/**
 * 将 json 类型字段的值转换为 JSON 字符串用于表单显示
 */
function serializeFieldForDisplay(field: FieldDescriptor, value: any): any {
  if (field.type === 'json' && value !== null && value !== undefined && typeof value !== 'string') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return value
}

/**
 * 将 json 类型字段的表单字符串值解析回 JSON 对象用于提交
 */
function deserializeFieldForSubmit(field: FieldDescriptor | undefined, value: any): any {
  if (field?.type === 'json' && typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      // 如果解析失败，保持原始字符串
      return value
    }
  }
  return value
}

/**
 * Settings Form Composable
 * 统一处理获取字段描述、管理表单状态、提交更新
 * 避免在各个页面中重复实现相同逻辑
 *
 * @param namespace 设置命名空间（如 'app', 'map', 'location', 'storage'）
 * @returns 字段列表、表单状态、加载状态、错误状态和提交函数
 *
 * @example
 * const { fields, state, submit, loading } = useSettingsForm('app')
 */
export function useSettingsForm(namespace: string) {
  const toast = useToast()

  const fields = ref<FieldDescriptor[]>([])
  const state = reactive<Record<string, any>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 从 API 获取字段描述和当前值
   */
  const fetchFields = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<SettingsFieldsResponse>(
        '/api/system/settings/fields',
        {
          query: { namespace },
        },
      )

      fields.value = response.fields

      // 使用 API 返回的值初始化状态
      // json 类型字段需要序列化为字符串用于 textarea 显示
      response.fields.forEach((field) => {
        const rawValue = field.value ?? field.defaultValue ?? null
        state[field.key] = serializeFieldForDisplay(field, rawValue)
      })
    } catch (err) {
      const message = extractErrorMessage(err)
      error.value = message
      toast.add({
        title: '加载设置失败',
        description: message,
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * 提交表单更新
   * 支持单条或多条更新
   *
   * @param data 要更新的字段数据
   * @example
   * await submit({ title: 'New Title', slogan: 'New Slogan' })
   */
  const submit = async (data: Record<string, any>) => {
    loading.value = true
    error.value = null

    try {
      // 准备批量更新请求
      // json 类型字段需要从字符串解析回 JSON 对象
      const updates = Object.entries(data).map(([key, value]) => {
        const field = fields.value.find(f => f.key === key)
        return {
          namespace,
          key,
          value: deserializeFieldForSubmit(field, value),
        }
      })

      await $fetch('/api/system/settings/batch', {
        method: 'PUT',
        body: { updates },
      })

      // 重新加载字段以获取最新值
      await fetchFields()

      toast.add({
        title: '设置已保存',
        color: 'success',
      })
    } catch (err) {
      const message = extractErrorMessage(err)
      error.value = message
      toast.add({
        title: '保存设置失败',
        description: message,
        color: 'error',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置表单状态为当前字段值
   */
  const reset = () => {
    fields.value.forEach((field) => {
      const rawValue = field.value ?? field.defaultValue ?? null
      state[field.key] = serializeFieldForDisplay(field, rawValue)
    })
  }

  /**
   * 更新特定字段的状态
   * 用于处理字段依赖关系或条件显示
   */
  const updateField = (fieldKey: string, value: any) => {
    state[fieldKey] = value
  }

  /**
   * 获取特定字段
   */
  const getField = (fieldKey: string): FieldDescriptor | undefined => {
    return fields.value.find((f) => f.key === fieldKey)
  }

  /**
   * 获取字段的当前值
   */
  const getFieldValue = (fieldKey: string): any => {
    return state[fieldKey]
  }

  // 组件挂载时自动获取字段
  onMounted(() => {
    fetchFields()
  })

  return {
    // 数据
    fields: readonly(fields),
    state,

    // 状态
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    submit,
    reset,
    fetchFields,
    updateField,
    getField,
    getFieldValue,
  }
}
