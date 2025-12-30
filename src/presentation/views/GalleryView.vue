<template>
  <div class="gallery-view">
    <!-- Header -->
    <div class="glass-card">
      <div class="header-section">
        <h2>{{ $t('gallery.title') }}</h2>
        <div class="header-actions">
          <button @click="openCreateDialog" class="btn-primary">
            {{ $t('gallery.addProduct') }}
          </button>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="filters-section">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('gallery.searchPlaceholder')"
            class="search-input"
            @input="handleSearch"
          />
        </div>
        <div class="filter-controls">
          <select v-model="sortBy" class="filter-select" @change="applyFilters">
            <option value="updated">{{ $t('gallery.sortByUpdated') }}</option>
            <option value="name">{{ $t('gallery.sortByName') }}</option>
            <option value="cost">{{ $t('gallery.sortByCost') }}</option>
          </select>
          <select v-model="sortOrder" class="filter-select" @change="applyFilters">
            <option value="desc">{{ $t('gallery.descending') }}</option>
            <option value="asc">{{ $t('gallery.ascending') }}</option>
          </select>
          <select v-model="costFilter" class="filter-select" @change="applyFilters">
            <option value="">{{ $t('gallery.allCosts') }}</option>
            <option value="0-1000">{{ $t('gallery.costRange1') }}</option>
            <option value="1000-10000">{{ $t('gallery.costRange2') }}</option>
            <option value="10000-100000">{{ $t('gallery.costRange3') }}</option>
            <option value="100000+">{{ $t('gallery.costRange4') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message glass-card">
      {{ error }}
      <button @click="error = ''" class="btn-close">×</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-message glass-card">
      {{ $t('gallery.loading') }}
    </div>

    <!-- Products Gallery -->
    <div v-if="!loading && filteredProducts.length > 0" class="products-gallery">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        @click="selectProduct(product.id)"
      >
        <div class="card-thumbnail">
          <img
            v-if="product.images.length > 0 && getThumbnailUrl(product.images[0].id)"
            :src="getThumbnailUrl(product.images[0].id) || ''"
            :alt="product.name"
            class="thumbnail-img"
          />
          <div v-else class="thumbnail-placeholder">📦</div>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ product.name }}</h3>
          <div class="card-badges">
            <span class="badge type-badge">{{ product.type === 'middle' ? $t('gallery.middle') : $t('gallery.final') }}</span>
            <span class="badge">{{ product.yieldQty }} {{ product.unit }}</span>
          </div>
          <p v-if="product.description" class="card-description">
            {{ truncateDescription(product.description) }}
          </p>
          <div class="card-cost">
            <span class="cost-label">{{ $t('gallery.cost') }}:</span>
            <span class="cost-value">
              {{ product.computedCostMaterialsOnly !== undefined ? formatPrice(product.computedCostMaterialsOnly) : $t('gallery.notCalculated') }}
            </span>
          </div>
        </div>
        <div class="card-actions">
          <button
            @click.stop="openProductActions(product)"
            class="btn-icon"
            :title="$t('gallery.actions')"
          >
            ⋮
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredProducts.length === 0" class="empty-state glass-card">
      <p>{{ searchQuery ? $t('gallery.noResults') : $t('gallery.noProducts') }}</p>
      <button v-if="!searchQuery" @click="openCreateDialog" class="btn-primary">
        {{ $t('gallery.addFirst') }}
      </button>
    </div>

    <!-- Product Actions Menu -->
    <div v-if="showActionsMenu && selectedProductForActions" class="actions-menu glass-card">
      <div class="menu-header">
        <h4>{{ selectedProductForActions.name }}</h4>
        <button @click="closeActionsMenu" class="btn-close">×</button>
      </div>
      <div class="menu-actions">
        <button @click="viewProduct" class="menu-item">
          {{ $t('gallery.view') }}
        </button>
        <button @click="editProduct" class="menu-item">
          {{ $t('gallery.edit') }}
        </button>
        <button @click="duplicateProductHandler" class="menu-item">
          {{ $t('gallery.duplicate') }}
        </button>
        <button @click="duplicateWithBom" class="menu-item">
          {{ $t('gallery.duplicateWithBom') }}
        </button>
        <button @click="createFromTemplate" class="menu-item">
          {{ $t('gallery.createFromTemplate') }}
        </button>
        <button @click="deleteProduct" class="menu-item menu-item-danger">
          {{ $t('gallery.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/productsStore'
import { duplicateProduct as duplicateProductUseCase } from '../../application/useCases/DuplicateProduct'
import type { Product } from '../../domain/entities/Product'

const { t } = useI18n()
const router = useRouter()
const productsStore = useProductsStore()

const searchQuery = ref('')
const sortBy = ref<'updated' | 'name' | 'cost'>('updated')
const sortOrder = ref<'asc' | 'desc'>('desc')
const costFilter = ref('')
const loading = ref(false)
const error = ref('')
const showActionsMenu = ref(false)
const selectedProductForActions = ref<Product | null>(null)

const finalProducts = computed(() => {
  return productsStore.products.filter(p => p.type === 'final')
})

const filteredProducts = computed(() => {
  let products = [...finalProducts.value]

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    products = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }

  // Apply cost filter
  if (costFilter.value) {
    products = products.filter(p => {
      const cost = p.computedCostMaterialsOnly || 0
      if (costFilter.value === '0-1000') return cost >= 0 && cost < 1000
      if (costFilter.value === '1000-10000') return cost >= 1000 && cost < 10000
      if (costFilter.value === '10000-100000') return cost >= 10000 && cost < 100000
      if (costFilter.value === '100000+') return cost >= 100000
      return true
    })
  }

  // Apply sorting
  products.sort((a, b) => {
    let comparison = 0

    if (sortBy.value === 'name') {
      comparison = a.name.localeCompare(b.name, 'fa')
    } else if (sortBy.value === 'cost') {
      const costA = a.computedCostMaterialsOnly || 0
      const costB = b.computedCostMaterialsOnly || 0
      comparison = costA - costB
    } else { // updated
      comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return products
})

onMounted(async () => {
  loading.value = true
  try {
    await productsStore.loadProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('gallery.loadError')
  } finally {
    loading.value = false
  }
})

// Handle search with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    // Search is handled by computed property
  }, 300)
}

function applyFilters() {
  // Filters are handled by computed property
}

function selectProduct(id: string) {
  router.push({ name: 'products', query: { id } })
}

function getThumbnailUrl(imageId: string): string | null {
  return productsStore.getThumbnailUrl(imageId)
}

function truncateDescription(description: string, maxLength: number = 100): string {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

function openProductActions(product: Product) {
  selectedProductForActions.value = product
  showActionsMenu.value = true
}

function closeActionsMenu() {
  showActionsMenu.value = false
  selectedProductForActions.value = null
}

function viewProduct() {
  if (selectedProductForActions.value) {
    router.push({ name: 'products', query: { id: selectedProductForActions.value.id } })
  }
  closeActionsMenu()
}

function editProduct() {
  if (selectedProductForActions.value) {
    router.push({ name: 'products', query: { id: selectedProductForActions.value.id, edit: 'true' } })
  }
  closeActionsMenu()
}

async function duplicateProductAction(withBom: boolean = false) {
  if (!selectedProductForActions.value) return

  try {
    loading.value = true
    error.value = ''
    const result = await duplicateProductUseCase({
      productId: selectedProductForActions.value.id,
      duplicateBom: withBom
    })
    await productsStore.loadProducts()
    closeActionsMenu()
    // Optionally navigate to new product
    router.push({ name: 'products', query: { id: result.newProduct.id } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('gallery.duplicateError')
  } finally {
    loading.value = false
  }
}

function duplicateProduct() {
  duplicateProductAction(false)
}

function duplicateWithBom() {
  duplicateProductAction(true)
}

function createFromTemplate() {
  if (selectedProductForActions.value) {
    router.push({ name: 'products', query: { template: selectedProductForActions.value.id } })
  }
  closeActionsMenu()
}

async function deleteProduct() {
  if (!selectedProductForActions.value) return

  if (confirm(t('gallery.confirmDelete') + ' ' + selectedProductForActions.value.name + '?')) {
    try {
      await productsStore.removeProduct(selectedProductForActions.value.id)
      closeActionsMenu()
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('gallery.deleteError')
    }
  }
}

function openCreateDialog() {
  router.push({ name: 'products', query: { create: 'true' } })
}
</script>

<style scoped>
.gallery-view {
  display: grid;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-section {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.search-bar {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
  min-width: 150px;
}

.products-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-thumbnail {
  width: 100%;
  height: 200px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  font-size: 4rem;
  opacity: 0.3;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.75rem;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 1rem;
  font-size: 0.875rem;
}

.type-badge {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.card-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  flex: 1;
}

.card-cost {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--glass-border);
  margin-top: auto;
}

.cost-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.cost-value {
  font-weight: 600;
  color: var(--primary);
  font-size: 1.1rem;
}

.card-actions {
  position: absolute;
  top: 1rem;
  left: 1rem;
}

.actions-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  min-width: 300px;
  max-width: 90vw;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-border);
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  padding: 0.75rem;
  text-align: right;
  border: none;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.menu-item-danger {
  color: #ef4444;
}

.menu-item-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

/* Reuse styles */
.error-message,
.loading-message,
.btn-primary,
.btn-icon,
.btn-close {
  /* Styles inherited */
}
</style>

