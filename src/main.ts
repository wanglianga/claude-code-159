import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createAppRouter } from './router'
import { persistPlugin } from './stores/persist'
import './styles/main.css'

const pinia = createPinia()
pinia.use(persistPlugin)

const app = createApp(App)
app.use(pinia)
app.use(createAppRouter())
app.mount('#app')
