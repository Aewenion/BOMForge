# راهنمای توسعه‌دهنده BOMForge

## معماری

BOMForge از معماری Clean Architecture استفاده می‌کند:

```
src/
├── domain/          # لایه دامنه (entities, value objects, services)
├── application/     # لایه کاربرد (use cases)
├── infrastructure/  # لایه زیرساخت (database, repositories, utils)
└── presentation/    # لایه ارائه (Vue components, stores, views)
```

### لایه‌ها

#### Domain Layer
- **Entities**: Material, Product, BomVersion, BomLine
- **Value Objects**: Quantity
- **Services**: UnitConverter, BomValidator, CostCalculator, RequirementsExpander

#### Application Layer
- **Use Cases**: هر عملیات یک use case جداگانه دارد
- مثال: `CreateMaterial`, `CalculateProductCost`, `ExportDatabase`

#### Infrastructure Layer
- **Database**: Dexie.js برای IndexedDB
- **Repositories**: MaterialRepository, ProductRepository, BomRepository
- **Utils**: idGenerator, dateConverter, exportImport, imageCompression

#### Presentation Layer
- **Views**: صفحات اصلی (MaterialsView, ProductsView, etc.)
- **Components**: کامپوننت‌های قابل استفاده مجدد
- **Stores**: Pinia stores برای مدیریت state

## ساختار داده

### Material
```typescript
{
  id: string
  name: string
  unit: string
  dimension: 'mass' | 'volume' | 'count'
  createdAt: Date
  updatedAt: Date
}
```

### MaterialPrice
```typescript
{
  id: string
  materialId: string
  priceToman: number
  effectiveFrom: Date
  effectiveTo?: Date
}
```

### Product
```typescript
{
  id: string
  type: 'middle' | 'final'
  name: string
  unit: string
  dimension: 'mass' | 'volume' | 'count'
  yieldQty: number
  description?: string
  images: ProductImage[]
  currentBomVersionId?: string
  computedCostMaterialsOnly?: number
  createdAt: Date
  updatedAt: Date
}
```

### BomVersion
```typescript
{
  id: string
  productId: string
  versionNumber: number
  notes?: string
  createdAt: Date
}
```

### BomLine
```typescript
{
  id: string
  bomVersionId: string
  inputType: 'material' | 'product'
  inputId: string
  qty: number
  unit: string
  wastePct?: number
  sortOrder: number
}
```

## الگوهای طراحی

### Repository Pattern
هر entity یک repository دارد که عملیات CRUD را مدیریت می‌کند.

### Use Case Pattern
هر عملیات کاربر یک use case جداگانه است که:
- ورودی و خروجی مشخص دارد
- منطق کسب‌وکار را کپسوله می‌کند
- از repositories استفاده می‌کند

### Value Object Pattern
`Quantity` یک value object است که:
- مقدار، واحد و بعد را با هم نگه می‌دارد
- اعتبارسنجی داخلی دارد
- Immutable است

## توسعه

### افزودن Use Case جدید

1. فایل جدید در `src/application/useCases/` ایجاد کنید
2. Interface برای Input و Output تعریف کنید
3. تابع async برای use case بنویسید
4. از repositories استفاده کنید
5. در `index.ts` export کنید

### افزودن Entity جدید

1. Interface در `src/domain/entities/` تعریف کنید
2. Repository در `src/infrastructure/repositories/` ایجاد کنید
3. Table در Database schema اضافه کنید
4. Use cases مربوطه را ایجاد کنید

### افزودن View جدید

1. فایل Vue در `src/presentation/views/` ایجاد کنید
2. Route در `src/presentation/router/index.ts` اضافه کنید
3. ترجمه‌ها را در `src/presentation/locales/index.ts` اضافه کنید
4. لینک ناوبری در `src/App.vue` اضافه کنید (در صورت نیاز)

## تست

### Unit Tests
برای domain services و value objects:
- UnitConverter
- BomValidator
- Quantity

### Integration Tests
برای use cases:
- CreateMaterial
- CalculateProductCost
- ExportDatabase

## نکات مهم

### تاریخ‌ها
IndexedDB تاریخ‌ها را به صورت عدد ذخیره می‌کند. از `dateConverter` استفاده کنید.

### ID ها
از `generateId` برای تولید ID استفاده کنید (ULID).

### تصاویر
- حداکثر 3 تصویر به ازای هر محصول
- هر تصویر حداکثر 1MB
- فشرده‌سازی خودکار
- Thumbnail generation

### واحدها
- فقط تبدیل درون بعدی (mass↔mass, volume↔volume)
- دقت 5 رقم اعشار
- از UnitConverter استفاده کنید

### هزینه
- فقط هزینه مواد اولیه (materials-only)
- به تومان (integer)
- Cache شده روی product

## Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### PWA
- Service Worker خودکار توسط Vite PWA plugin
- Manifest در `public/manifest.webmanifest`
- Icons در `public/icons/`

## مشکلات رایج

### تاریخ‌ها به درستی نمایش داده نمی‌شوند
از `dateConverter.timestampToDate` استفاده کنید.

### تصاویر نمایش داده نمی‌شوند
از `createImageUrl` در store استفاده کنید و بعد از استفاده `revokeImageUrl` را فراخوانی کنید.

### هزینه محاسبه نمی‌شود
مطمئن شوید:
- محصول BOM دارد
- مواد اولیه قیمت دارند
- BOM نسخه فعلی تنظیم شده است

## منابع

- [Vue 3 Documentation](https://vuejs.org/)
- [Dexie.js Documentation](https://dexie.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

