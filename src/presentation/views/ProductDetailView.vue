<template>
  <div class="product-detail-view">
    <div v-if="loading" class="loading-message glass-card">
      {{ $t('products.loading') }}
    </div>

    <div v-else-if="error" class="error-message glass-card">
      {{ error }}
      <button @click="router.back()" class="btn-secondary btn-sm">{{ $t('common.back') }}</button>
    </div>

    <div v-else-if="product" class="product-content">
      <!-- Header -->
      <div class="glass-card header-card">
        <div class="header-top">
          <button @click="router.back()" class="btn-icon">
            ←
          </button>
          <div class="actions">
            <button @click="editProduct" class="btn-secondary btn-sm">
              ✏️ {{ $t('products.edit') }}
            </button>
          </div>
        </div>
        <div class="product-title-section">
          <h1>{{ product.name }}</h1>
          <div class="badges">
            <span class="badge" :class="product.type === 'middle' ? 'badge-middle' : 'badge-final'">
              {{ product.type === 'middle' ? $t('products.middle') : $t('products.final') }}
            </span>
            <span class="badge">{{ product.yieldQty }} {{ product.unit }}</span>
            <span class="badge">{{ product.dimension }}</span>
          </div>
        </div>
        <p v-if="product.description" class="description">{{ product.description }}</p>
      </div>

      <!-- Main Grid -->
      <div class="detail-grid">
        <!-- Images Section -->
        <div class="glass-card images-card">
          <h3>{{ $t('products.images') }}</h3>
          <div v-if="product.images.length > 0" class="images-container">
            <div 
              v-for="image in product.images" 
              :key="image.id" 
              class="image-wrapper"
              @click="openLightbox(image.id)"
            >
              <img 
                :src="store.getImageUrl(image.id) || ''" 
                :alt="product.name" 
                loading="lazy"
              />
            </div>
          </div>
          <div v-else class="empty-state">
            <p>{{ $t('products.noImages') }}</p>
          </div>
        </div>

        <!-- Cost & Requirements -->
        <div class="glass-card cost-card">
          <div class="section-header">
            <h3>{{ $t('products.costBreakdown') }}</h3>
            <button @click="loadCost" class="btn-secondary btn-sm" :disabled="loadingCost">
              {{ loadingCost ? $t('products.loading') : $t('products.recalculate') }}
            </button>
          </div>

          <div v-if="loadingCost" class="loading-message">
            {{ $t('products.loading') }}...
          </div>
          
          <div v-else-if="costBreakdown" class="cost-content">
            <div class="cost-summary">
              <div class="cost-row big-cost">
                <span>{{ $t('products.totalCost') }}:</span>
                <span class="price-value">{{ formatPrice(costBreakdown.totalCost) }}</span>
              </div>
              <div class="cost-row">
                <span>{{ $t('products.costPerUnit') }}:</span>
                <span>
                  {{ formatPrice(Math.round(costBreakdown.totalCost / (product.yieldQty || 1))) }} / {{ product.unit }}
                </span>
              </div>
            </div>

            <div v-if="costBreakdown.requirements.length > 0" class="requirements-list">
              <h4>{{ $t('products.materialRequirements') }}</h4>
              <div v-for="req in costBreakdown.requirements" :key="req.materialId" class="req-item">
                <div class="req-info">
                  <span class="req-name">{{ req.materialName }}</span>
                  <span class="req-qty">{{ formatQuantity(req.totalQty) }} {{ req.unit }}</span>
                </div>
                <div class="req-cost">
                  {{ formatPrice(req.costContribution) }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
             {{ $t('products.noCostData') }}
             <button @click="loadCost" class="btn-primary btn-sm mt-4">{{ $t('products.calculateCost') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxImageId" class="lightbox" @click="closeLightbox">
      <button class="close-lightbox" @click="closeLightbox">×</button>
      <img :src="store.getImageUrl(lightboxImageId) || ''" :alt="product?.name" @click.stop />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '../stores/productsStore'
import type { CostBreakdown } from '../../domain/services/CostCalculator'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useProductsStore()

const loading = ref(true)
const error = ref('')
const loadingCost = ref(false)
const costBreakdown = ref<CostBreakdown | null>(null)
const lightboxImageId = ref<string | null>(null)

const productId = computed(() => route.params.id as string)
const product = computed(() => store.products.find(p => p.id === productId.value))

onMounted(async () => {
  if (!store.products.length) {
    try {
      await store.loadProducts()
    } catch (e) {
      error.value = t('products.loadError')
    }
  }
  
  if (product.value) {
    loading.value = false
    loadCost()
  } else {
    // If still not found after load, it's an error
    if (!loading.value) {
       error.value = t('products.notFound')
    }
    loading.value = false
  }
})

// Watch if products load late
watch(() => store.products, () => {
  if (product.value && !costBreakdown.value) {
    loadCost()
  }
})

async function loadCost() {
  if (!productId.value) return
  loadingCost.value = true
  try {
    costBreakdown.value = await store.loadCostBreakdown(productId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loadingCost.value = false
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price) + ' ' + t('materials.toman')
}

function formatQuantity(qty: number) {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 5 }).format(qty)
}

function editProduct() {
  // We can navigate back to products list with edit query or open edit dialog here directly
  // For now, let's navigate to products list edit mode to reuse existing dialog logic
  // OR we could refactor the edit dialog to be reusable. 
  // Let's implement a direct navigation back to products list with edit params for simplicity first.
  router.push({ name: 'products', query: { id: productId.value, edit: 'true' } })
}

function openLightbox(imageId: string) {
  lightboxImageId.value = imageId
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxImageId.value = null
  document.body.style.overflow = ''
}
</script>

<style scoped>
.product-detail-view {
  max-width: 1000px;
  margin: 0 auto;
}

.product-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-title-section h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge-middle {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.badge-final {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.description {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1.05rem;
  margin-top: 0.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.images-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-wrapper {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid var(--glass-border);
  transition: transform 0.2s;
}

.image-wrapper:hover {
  transform: scale(1.02);
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cost-summary {
  background: rgba(59, 130, 246, 0.05);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.cost-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.big-cost {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding-bottom: 0.75rem;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.req-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.req-info {
  display: flex;
  flex-direction: column;
}

.req-name {
  font-weight: 500;
}

.req-qty {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.req-cost {
  font-weight: 600;
  color: var(--text-main);
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.2s ease-out;
}

.lightbox img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.close-lightbox {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  font-size: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-lightbox:hover {
  background: rgba(255, 255, 255, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mt-4 { margin-top: 1rem; }
</style>
