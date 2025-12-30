import { createI18n } from 'vue-i18n'

const messages = {
  fa: {
    dashboard: {
      title: 'داشبورد',
      welcome: 'به سیستم مدیریت فرمولاسیون خوش آمدید'
    },
    materials: {
      title: 'مواد اولیه',
      addNew: 'افزودن ماده اولیه جدید',
      searchPlaceholder: 'جستجوی مواد اولیه...',
      loading: 'در حال بارگذاری...',
      noMaterials: 'هیچ ماده اولیه‌ای ثبت نشده است',
      addFirst: 'افزودن اولین ماده اولیه',
      edit: 'ویرایش',
      delete: 'حذف',
      confirmDelete: 'آیا مطمئن هستید که می‌خواهید',
      unit: 'واحد',
      dimension: 'بعد',
      currentPrice: 'قیمت فعلی',
      effectiveFrom: 'موثر از',
      noPrice: 'قیمتی ثبت نشده است',
      updatePrice: 'به‌روزرسانی قیمت',
      setPrice: 'ثبت قیمت',
      priceHistory: 'تاریخچه قیمت',
      current: 'فعلی',
      noPriceHistory: 'تاریخچه قیمتی وجود ندارد',
      createMaterial: 'ایجاد ماده اولیه',
      editMaterial: 'ویرایش ماده اولیه',
      name: 'نام',
      namePlaceholder: 'نام ماده اولیه',
      price: 'قیمت',
      toman: 'تومان',
      pricePlaceholder: 'قیمت به تومان',
      mass: 'جرم',
      volume: 'حجم',
      count: 'تعداد',
      cancel: 'لغو',
      save: 'ذخیره'
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
