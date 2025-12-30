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
    },
    settings: {
      title: 'تنظیمات',
      appInfo: 'اطلاعات برنامه',
      appName: 'نام برنامه',
      appVersion: 'نسخه',
      buildDate: 'تاریخ ساخت',
      storage: 'فضای ذخیره‌سازی',
      storageUsed: 'استفاده شده',
      storageQuota: 'سهمیه کل',
      storageUsage: 'درصد استفاده',
      refresh: 'بروزرسانی',
      pwa: 'حالت آفلاین',
      offlineMode: 'وضعیت اتصال',
      online: 'آنلاین',
      offline: 'آفلاین',
      updateAvailable: 'به‌روزرسانی جدید موجود است',
      updateNow: 'به‌روزرسانی کن'
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
