// SSR 冒烟渲染入口（由 scripts/ssr-smoke.ts 通过 Vite ssrLoadModule 加载）
import { createApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'
import { routes } from './router'
import { useSessionStore } from './stores/session'

export async function renderPage(path: string, userId = 'u3'): Promise<string> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes })
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  await router.push(path)
  await router.isReady()
  useSessionStore().switchUser(userId)
  const html = await renderToString(app)
  if (!html || html.length < 300) throw new Error(`${path} 渲染结果异常`)
  return html
}
