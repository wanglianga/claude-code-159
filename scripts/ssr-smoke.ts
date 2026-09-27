// 以 Vite SSR 模式在 Node 中渲染全部关键页面，捕获模板/数据运行时错误
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error'
})

try {
  const mod = await server.ssrLoadModule('/src/ssr-entry.ts')
  const cases: Array<[string, string]> = [
    ['/hall', 'u3'],
    ['/register', 'u3'],
    ['/items/it1', 'u3'],
    ['/items/it8', 's1'], // 过期物品
    ['/items/it14', 's1'], // 报废物品
    ['/my-shares', 'u1'],
    ['/my-borrows', 'u3'],
    ['/messages', 'u3'],
    ['/volunteer', 'v1'],
    ['/staff', 's1']
  ]
  for (const [path, user] of cases) {
    const html = await mod.renderPage(path, user)
    console.log(`render ${path.padEnd(12)} as ${user} -> ${html.length} chars`)
  }
  console.log('ssr smoke passed')
} finally {
  await server.close()
}
