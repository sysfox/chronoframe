export default defineNuxtPlugin((_nuxtApp) => {
  const config = useRuntimeConfig()
  const scripts: any[] = []
  const externalScripts: any[] = []

  // Matomo 分析
  if (
    config.public.analytics.matomo?.enabled &&
    config.public.analytics.matomo.url &&
    config.public.analytics.matomo.siteId
  ) {
    const matomoUrl = config.public.analytics.matomo.url.replace(/\/$/, '') // 移除末尾斜杠
    const siteId = config.public.analytics.matomo.siteId

    scripts.push({
      innerHTML: `
        var _paq = window._paq = window._paq || [];
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="${matomoUrl}/";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', '${siteId}']);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
        })();
      `.trim(),
      type: 'text/javascript',
      tagPosition: 'head',
    })
  }

  // 自定义分析脚本 - 从设置中读取
  const settingsStore = useSettingsStore()
  
  if (settingsStore.getSetting('analytics:custom.enabled')) {
    const customEnabled = settingsStore.getSetting('analytics:custom.enabled')
    if (customEnabled) {
      const headScript = settingsStore.getSetting('analytics:custom.headScript')
      const bodyScript = settingsStore.getSetting('analytics:custom.bodyScript')
      const externalScriptsJson = settingsStore.getSetting('analytics:custom.externalScripts')

      // headScript：注入到HTML head中
      if (headScript && typeof headScript === 'string') {
        scripts.push({
          innerHTML: headScript,
          type: 'text/javascript',
          tagPosition: 'head',
        })
      }

      // bodyScript：在body加载完成后执行
      if (bodyScript && typeof bodyScript === 'string') {
        scripts.push({
          innerHTML: bodyScript,
          type: 'text/javascript',
          tagPosition: 'body',
        })
      }

      // 外部脚本URLs
      if (externalScriptsJson) {
        let externalScriptsList = []
        try {
          if (typeof externalScriptsJson === 'string') {
            externalScriptsList = JSON.parse(externalScriptsJson)
          } else if (Array.isArray(externalScriptsJson)) {
            externalScriptsList = externalScriptsJson
          }
        } catch (error) {
          console.warn('Failed to parse external scripts JSON:', error)
        }

        if (Array.isArray(externalScriptsList)) {
          externalScriptsList.forEach((scriptConfig: any) => {
            externalScripts.push({
              src: scriptConfig.src,
              async: scriptConfig.async !== false,
              defer: scriptConfig.defer !== false,
              tagPosition: 'head',
            })
          })
        }
      }
    }
  }

  // 添加所有脚本到head
  if (scripts.length > 0 || externalScripts.length > 0) {
    useHead({
      script: [...scripts, ...externalScripts],
    })
  }
})
