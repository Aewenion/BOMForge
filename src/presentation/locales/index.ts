import { createI18n } from 'vue-i18n'

const messages = {
  fa: {
    dashboard: {
      title: 'داشبورد',
      welcome: 'به سیستم مدیریت فرمولاسیون خوش آمدید'
    },
    materials: {
      title: 'مواد اولیه',
      addNew: 'افزودن ماده اولیه جدید'
    },
    products: {
      title: 'محصولات',
      addNew: 'افزودن محصول جدید'
    }
  }
}

const i18n = createI18n({
  legacy: false,
  locale: 'fa',
  fallbackLocale: 'fa',
  messages
})

export default i18n
