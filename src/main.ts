import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './presentation/router'
import i18n from './presentation/locales'
import { db } from './infrastructure/database/Database'

import './presentation/style.css'

// Initialize database
db.open().catch(err => {
  console.error('Failed to open database:', err)
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
