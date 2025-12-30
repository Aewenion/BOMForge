<template>
  <div class="products-view">
    <!-- Header -->
    <div class="glass-card">
      <div class="header-section">
        <h2>{{ $t('products.title') }}</h2>
        <button @click="openCreateDialog" class="btn-primary">
          {{ $t('products.addNew') }}
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('products.searchPlaceholder')"
          class="search-input"
          @input="handleSearch"
        />
        <select v-model="filterType" class="filter-select" @change="handleFilter">
          <option value="">{{ $t('products.allTypes') }}</option>
          <option value="middle">{{ $t('products.middle') }}</option>
          <option value="final">{{ $t('products.final') }}</option>
        </select>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="store.error" class="error-message glass-card">
      {{ store.error }}
      <button @click="store.clearError" class="btn-close">×</button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-message glass-card">
      {{ $t('products.loading') }}
    </div>

    <!-- Products List -->
    <div v-if="!store.loading && store.products.length > 0" class="products-list">
      <div
        v-for="product in store.products"
        :key="product.id"
        class="product-card glass-card"
        :class="{ selected: store.selectedProduct?.id === product.id }"
        @click="selectProduct(product.id)"
      >
        <div class="product-thumbnail">
          <img
            v-if="product.images.length > 0 && store.getThumbnailUrl(product.images[0].id)"
            :src="store.getThumbnailUrl(product.images[0].id) || ''"
            :alt="product.name"
            class="thumbnail-img"
          />
          <div v-else class="thumbnail-placeholder">📦</div>
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <div class="product-details">
            <span class="badge">{{ product.type === 'middle' ? $t('products.middle') : $t('products.final') }}</span>
            <span class="badge">{{ product.yieldQty }} {{ product.unit }}</span>
            <span class="badge">{{ product.dimension }}</span>
          </div>
          <div v-if="product.description" class="product-description">
            {{ product.description }}
          </div>
        </div>
        <div class="product-actions">
          <button
            @click.stop="openEditDialog(product)"
            class="btn-icon"
            :title="$t('products.edit')"
          >
            ✏️
          </button>
          <button
            @click.stop="confirmDelete(product)"
            class="btn-icon btn-danger"
            :title="$t('products.delete')"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!store.loading && store.products.length === 0" class="empty-state glass-card">
      <p>{{ $t('products.noProducts') }}</p>
      <button @click="openCreateDialog" class="btn-primary">
        {{ $t('products.addFirst') }}
      </button>
    </div>

    <!-- Product Detail -->
    <div v-if="store.selectedProduct" class="product-detail glass-card">
      <div class="detail-header">
        <h3>{{ store.selectedProduct.name }}</h3>
        <button @click="store.clearSelection" class="btn-close">×</button>
      </div>

      <div class="detail-info">
        <div class="info-row">
          <span class="label">{{ $t('products.type') }}:</span>
          <span class="value">{{ store.selectedProduct.type === 'middle' ? $t('products.middle') : $t('products.final') }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('products.unit') }}:</span>
          <span class="value">{{ store.selectedProduct.unit }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('products.dimension') }}:</span>
          <span class="value">{{ store.selectedProduct.dimension }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('products.yieldQty') }}:</span>
          <span class="value">{{ store.selectedProduct.yieldQty }} {{ store.selectedProduct.unit }}</span>
        </div>
        <div v-if="store.selectedProduct.description" class="info-row">
          <span class="label">{{ $t('products.description') }}:</span>
          <span class="value">{{ store.selectedProduct.description }}</span>
        </div>
      </div>

      <!-- Images Section -->
      <div class="images-section">
        <div class="images-header">
          <h4>{{ $t('products.images') }} ({{ store.selectedProduct.images.length }}/3)</h4>
          <button
            v-if="store.selectedProduct.images.length < 3"
            @click="openImageUploadDialog"
            class="btn-secondary"
          >
            {{ $t('products.addImage') }}
          </button>
        </div>
        <div v-if="store.selectedProduct.images.length > 0" class="images-grid">
          <div
            v-for="image in store.selectedProduct.images"
            :key="image.id"
            class="image-item"
          >
            <img
              v-if="store.getImageUrl(image.id)"
              :src="store.getImageUrl(image.id) || ''"
              :alt="store.selectedProduct.name"
              class="product-image"
            />
            <button
              @click="confirmDeleteImage(image.id)"
              class="image-delete-btn"
              :title="$t('products.deleteImage')"
            >
              ×
            </button>
          </div>
        </div>
        <div v-else class="no-images">
          {{ $t('products.noImages') }}
        </div>
      </div>
    </div>

    <!-- Create/Edit Product Dialog -->
    <div v-if="showProductDialog" class="dialog-overlay" @click.self="closeProductDialog">
      <div class="dialog glass-card">
        <div class="dialog-header">
          <h3>{{ isEditing ? $t('products.editProduct') : $t('products.createProduct') }}</h3>
          <button @click="closeProductDialog" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>{{ $t('products.name') }}</label>
            <input
              v-model="productForm.name"
              type="text"
              :placeholder="$t('products.namePlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('products.type') }}</label>
            <select v-model="productForm.type" class="form-input">
              <option value="middle">{{ $t('products.middle') }}</option>
              <option value="final">{{ $t('products.final') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('products.unit') }}</label>
            <select v-model="productForm.unit" class="form-input">
              <option
                v-for="unit in unitsByDimension[productForm.dimension]"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('products.dimension') }}</label>
            <select v-model="productForm.dimension" class="form-input">
              <option value="mass">{{ $t('products.mass') }}</option>
              <option value="volume">{{ $t('products.volume') }}</option>
              <option value="count">{{ $t('products.count') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('products.yieldQty') }} ({{ $t('products.recipeBasis') }})</label>
            <input
              v-model.number="productForm.yieldQty"
              type="number"
              step="0.00001"
              min="0.00001"
              :placeholder="$t('products.yieldQtyPlaceholder')"
              class="form-input"
            />
            <small class="form-hint">{{ $t('products.yieldQtyHint') }}</small>
          </div>
          <div class="form-group">
            <label>{{ $t('products.description') }}</label>
            <textarea
              v-model="productForm.description"
              :placeholder="$t('products.descriptionPlaceholder')"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeProductDialog" class="btn-secondary">
            {{ $t('products.cancel') }}
          </button>
          <button @click="saveProduct" class="btn-primary" :disabled="!isFormValid">
            {{ $t('products.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Upload Dialog -->
    <div v-if="showImageDialog" class="dialog-overlay" @click.self="closeImageDialog">
      <div class="dialog glass-card">
        <div class="dialog-header">
          <h3>{{ $t('products.addImage') }}</h3>
          <button @click="closeImageDialog" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>{{ $t('products.selectImage') }}</label>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="form-input"
            />
            <small class="form-hint">{{ $t('products.imageHint') }}</small>
          </div>
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="Preview" class="preview-img" />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeImageDialog" class="btn-secondary">
            {{ $t('products.cancel') }}
          </button>
          <button @click="uploadImage" class="btn-primary" :disabled="!selectedFile || uploading">
            {{ uploading ? $t('products.uploading') : $t('products.upload') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '../stores/productsStore'
import { UNITS_BY_DIMENSION } from '../../domain/services/UnitConverter'

const { t } = useI18n()
const store = useProductsStore()

const searchQuery = ref('')
const filterType = ref<'middle' | 'final' | ''>('')
const showProductDialog = ref(false)
const showImageDialog = ref(false)
const isEditing = ref(false)
const editingProductId = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const productForm = ref({
  type: 'final' as 'middle' | 'final',
  name: '',
  unit: 'L',
  dimension: 'volume' as 'mass' | 'volume' | 'count',
  yieldQty: 1,
  description: ''
})

const unitsByDimension = UNITS_BY_DIMENSION

const isFormValid = computed(() => {
  return productForm.value.name.trim() !== '' &&
         productForm.value.unit.trim() !== '' &&
         productForm.value.yieldQty > 0
})

// Load products on mount
onMounted(async () => {
  await store.loadProducts()
})

// Handle search with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    store.loadProducts(searchQuery.value || undefined, filterType.value || undefined)
  }, 300)
}

// Handle filter
function handleFilter() {
  store.loadProducts(searchQuery.value || undefined, filterType.value || undefined)
}

// Select product
async function selectProduct(id: string) {
  await store.selectProduct(id)
}

// Open create dialog
function openCreateDialog() {
  isEditing.value = false
  editingProductId.value = null
  productForm.value = {
    type: 'final',
    name: '',
    unit: unitsByDimension.volume[0],
    dimension: 'volume',
    yieldQty: 1,
    description: ''
  }
  showProductDialog.value = true
}

// Open edit dialog
function openEditDialog(product: typeof store.products[0]) {
  isEditing.value = true
  editingProductId.value = product.id
  productForm.value = {
    type: product.type,
    name: product.name,
    unit: product.unit,
    dimension: product.dimension,
    yieldQty: product.yieldQty,
    description: product.description || ''
  }
  showProductDialog.value = true
}

// Close product dialog
function closeProductDialog() {
  showProductDialog.value = false
  productForm.value = {
    type: 'final',
    name: '',
    unit: 'L',
    dimension: 'volume',
    yieldQty: 1,
    description: ''
  }
}

// Save product
async function saveProduct() {
  try {
    if (isEditing.value && editingProductId.value) {
      await store.updateExistingProduct({
        id: editingProductId.value,
        ...productForm.value
      })
    } else {
      await store.createNewProduct(productForm.value)
    }
    closeProductDialog()
    await store.loadProducts(searchQuery.value || undefined, filterType.value || undefined)
  } catch (err) {
    // Error is handled by store
  }
}

// Confirm delete
function confirmDelete(product: typeof store.products[0]) {
  if (confirm(`${t('products.confirmDelete')} ${product.name}?`)) {
    store.removeProduct(product.id)
  }
}

// Open image upload dialog
function openImageUploadDialog() {
  selectedFile.value = null
  imagePreview.value = null
  showImageDialog.value = true
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Close image dialog
function closeImageDialog() {
  showImageDialog.value = false
  selectedFile.value = null
  imagePreview.value = null
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
}

// Handle file select
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
    // Create preview
    if (imagePreview.value) {
      URL.revokeObjectURL(imagePreview.value)
    }
    imagePreview.value = URL.createObjectURL(file)
  }
}

// Upload image
async function uploadImage() {
  if (!selectedFile.value || !store.selectedProduct) return

  uploading.value = true
  try {
    await store.addImage(store.selectedProduct.id, selectedFile.value)
    closeImageDialog()
  } catch (err) {
    // Error is handled by store
  } finally {
    uploading.value = false
  }
}

// Confirm delete image
function confirmDeleteImage(imageId: string) {
  if (confirm(t('products.confirmDeleteImage'))) {
    store.removeImage(imageId)
  }
}

// Watch dimension change to update unit
watch(() => productForm.value.dimension, (newDimension) => {
  const units = unitsByDimension[newDimension]
  if (units.length > 0 && !units.includes(productForm.value.unit)) {
    productForm.value.unit = units[0]
  }
})
</script>

<style scoped>
.products-view {
  display: grid;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-section {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
  min-width: 150px;
}

.products-list {
  display: grid;
  gap: 1rem;
}

.product-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.product-card:hover {
  background: rgba(37, 99, 235, 0.05);
}

.product-card.selected {
  border: 2px solid var(--primary);
}

.product-thumbnail {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 2rem;
}

.product-info {
  flex: 1;
}

.product-info h3 {
  margin: 0 0 0.5rem 0;
}

.product-details {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.product-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.product-detail {
  padding: 1.5rem;
}

.images-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--glass-border);
}

.images-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-item {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 100%;
  height: auto;
  display: block;
}

.image-delete-btn {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-delete-btn:hover {
  background: rgba(239, 68, 68, 1);
}

.image-preview {
  margin-top: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: auto;
  display: block;
}

.form-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

/* Reuse styles from MaterialsView */
.error-message,
.loading-message,
.empty-state,
.dialog-overlay,
.dialog,
.dialog-header,
.dialog-body,
.dialog-footer,
.form-group,
.form-input,
.btn-primary,
.btn-secondary,
.btn-icon,
.btn-danger,
.btn-close {
  /* Styles inherited from MaterialsView or global */
}
</style>
