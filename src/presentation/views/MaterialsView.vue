<template>
  <div class="materials-view">
    <!-- Header -->
    <div class="glass-card">
      <div class="header-section">
        <h2>{{ $t('materials.title') }}</h2>
        <button @click="openCreateDialog" class="btn-primary">
          {{ $t('materials.addNew') }}
        </button>
      </div>

      <!-- Search -->
      <div class="search-section">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('materials.searchPlaceholder')"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="store.error" class="error-message glass-card">
      {{ store.error }}
      <button @click="store.clearError" class="btn-close">×</button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-message glass-card">
      {{ $t('materials.loading') }}
    </div>

    <!-- Materials List -->
    <div v-if="!store.loading && store.materials.length > 0" class="materials-list">
      <div
        v-for="material in store.materials"
        :key="material.id"
        class="material-card glass-card"
        :class="{ selected: store.selectedMaterial?.id === material.id }"
        @click="selectMaterial(material.id)"
      >
        <div class="material-info">
          <h3>{{ material.name }}</h3>
          <div class="material-details">
            <span class="badge">{{ material.unit }}</span>
            <span class="badge">{{ material.dimension }}</span>
          </div>
        </div>
        <div class="material-actions">
          <button
            @click.stop="openEditDialog(material)"
            class="btn-icon"
            :title="$t('materials.edit')"
          >
            ✏️
          </button>
          <button
            @click.stop="confirmDelete(material)"
            class="btn-icon btn-danger"
            :title="$t('materials.delete')"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!store.loading && store.materials.length === 0" class="empty-state glass-card">
      <p>{{ $t('materials.noMaterials') }}</p>
      <button @click="openCreateDialog" class="btn-primary">
        {{ $t('materials.addFirst') }}
      </button>
    </div>

    <!-- Material Detail / Price History -->
    <div v-if="store.selectedMaterial" class="material-detail glass-card">
      <div class="detail-header">
        <h3>{{ store.selectedMaterial.name }}</h3>
        <button @click="store.clearSelection" class="btn-close">×</button>
      </div>

      <div class="detail-info">
        <div class="info-row">
          <span class="label">{{ $t('materials.unit') }}:</span>
          <span class="value">{{ store.selectedMaterial.unit }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('materials.dimension') }}:</span>
          <span class="value">{{ store.selectedMaterial.dimension }}</span>
        </div>
      </div>

      <!-- Current Price -->
      <div class="price-section">
        <h4>{{ $t('materials.currentPrice') }}</h4>
        <div v-if="store.currentPrice" class="current-price">
          <span class="price-value">{{ formatPrice(store.currentPrice.priceToman) }}</span>
          <span class="price-date">
            {{ $t('materials.effectiveFrom') }}: {{ formatDate(store.currentPrice.effectiveFrom) }}
          </span>
        </div>
        <div v-else class="no-price">
          {{ $t('materials.noPrice') }}
        </div>
        <button @click="openPriceDialog" class="btn-secondary">
          {{ store.currentPrice ? $t('materials.updatePrice') : $t('materials.setPrice') }}
        </button>
      </div>

      <!-- Price History -->
      <div class="price-history-section">
        <h4>{{ $t('materials.priceHistory') }}</h4>
        <div v-if="store.priceHistory.length > 0" class="price-history-list">
          <div
            v-for="price in store.priceHistory"
            :key="price.id"
            class="price-history-item"
            :class="{ current: !price.effectiveTo }"
          >
            <div class="price-info">
              <span class="price-value">{{ formatPrice(price.priceToman) }}</span>
              <span class="price-period">
                {{ formatDate(price.effectiveFrom) }}
                <span v-if="price.effectiveTo">
                  - {{ formatDate(price.effectiveTo) }}
                </span>
                <span v-else class="current-badge">{{ $t('materials.current') }}</span>
              </span>
            </div>
          </div>
        </div>
        <div v-else class="no-history">
          {{ $t('materials.noPriceHistory') }}
        </div>
      </div>
    </div>

    <!-- Create/Edit Material Dialog -->
    <div v-if="showMaterialDialog" class="dialog-overlay" @click.self="closeMaterialDialog">
      <div class="dialog glass-card">
        <div class="dialog-header">
          <h3>{{ isEditing ? $t('materials.editMaterial') : $t('materials.createMaterial') }}</h3>
          <button @click="closeMaterialDialog" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>{{ $t('materials.name') }}</label>
            <input
              v-model="materialForm.name"
              type="text"
              :placeholder="$t('materials.namePlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('materials.dimension') }}</label>
            <select v-model="materialForm.dimension" class="form-input">
              <option value="mass">{{ $t('materials.mass') }}</option>
              <option value="volume">{{ $t('materials.volume') }}</option>
              <option value="count">{{ $t('materials.count') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('materials.unit') }}</label>
            <select v-model="materialForm.unit" class="form-input">
              <option
                v-for="unit in unitsByDimension[materialForm.dimension]"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
          </div>
          <div v-if="!isEditing" class="form-group">
            <label>{{ $t('materials.price') }} ({{ $t('materials.toman') }})</label>
            <input
              v-model.number="materialForm.initialPrice"
              type="number"
              min="0"
              step="1"
              :placeholder="$t('materials.pricePlaceholder')"
              class="form-input"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeMaterialDialog" class="btn-secondary">
            {{ $t('materials.cancel') }}
          </button>
          <button @click="saveMaterial" class="btn-primary" :disabled="!isFormValid">
            {{ $t('materials.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Price Dialog -->
    <div v-if="showPriceDialog" class="dialog-overlay" @click.self="closePriceDialog">
      <div class="dialog glass-card">
        <div class="dialog-header">
          <h3>{{ $t('materials.updatePrice') }}</h3>
          <button @click="closePriceDialog" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>{{ $t('materials.price') }} ({{ $t('materials.toman') }})</label>
            <input
              v-model.number="priceForm.priceToman"
              type="number"
              min="0"
              step="1"
              :placeholder="$t('materials.pricePlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('materials.effectiveFrom') }}</label>
            <input
              v-model="priceForm.effectiveFrom"
              type="datetime-local"
              class="form-input"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closePriceDialog" class="btn-secondary">
            {{ $t('materials.cancel') }}
          </button>
          <button @click="savePrice" class="btn-primary" :disabled="!isPriceFormValid">
            {{ $t('materials.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMaterialsStore } from '../stores/materialsStore'
import { UNITS_BY_DIMENSION } from '../../domain/services/UnitConverter'

const { t } = useI18n()

const store = useMaterialsStore()

const searchQuery = ref('')
const showMaterialDialog = ref(false)
const showPriceDialog = ref(false)
const isEditing = ref(false)
const editingMaterialId = ref<string | null>(null)

const materialForm = ref({
  name: '',
  unit: 'g',
  dimension: 'mass' as 'mass' | 'volume' | 'count',
  initialPrice: 0
})

const priceForm = ref({
  priceToman: 0,
  effectiveFrom: new Date().toISOString().slice(0, 16)
})

const unitsByDimension = UNITS_BY_DIMENSION

const isFormValid = computed(() => {
  return materialForm.value.name.trim() !== '' &&
         materialForm.value.unit.trim() !== ''
})

const isPriceFormValid = computed(() => {
  return priceForm.value.priceToman >= 0 &&
         Number.isInteger(priceForm.value.priceToman) &&
         priceForm.value.effectiveFrom !== ''
})

// Load materials on mount
onMounted(async () => {
  await store.loadMaterials()
})

// Handle search with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    store.loadMaterials(searchQuery.value || undefined)
  }, 300)
}

// Select material
async function selectMaterial(id: string) {
  await store.selectMaterial(id)
}

// Open create dialog
function openCreateDialog() {
  isEditing.value = false
  editingMaterialId.value = null
  materialForm.value = {
    name: '',
    unit: unitsByDimension.mass[0],
    dimension: 'mass',
    initialPrice: 0
  }
  showMaterialDialog.value = true
}

// Open edit dialog
function openEditDialog(material: typeof store.materials[0]) {
  isEditing.value = true
  editingMaterialId.value = material.id
  materialForm.value = {
    name: material.name,
    unit: material.unit,
    dimension: material.dimension,
    initialPrice: 0 // Not relevant for editing
  }
  showMaterialDialog.value = true
}

// Close material dialog
function closeMaterialDialog() {
  showMaterialDialog.value = false
  materialForm.value = {
    name: '',
    unit: 'g',
    dimension: 'mass',
    initialPrice: 0
  }
}

// Save material
async function saveMaterial() {
  try {
    if (isEditing.value && editingMaterialId.value) {
      await store.updateExistingMaterial({
        id: editingMaterialId.value,
        ...materialForm.value
      })
    } else {
      await store.createNewMaterial(materialForm.value)
    }
    closeMaterialDialog()
    await store.loadMaterials(searchQuery.value || undefined)
  } catch (err) {
    // Error is handled by store
  }
}

// Confirm delete
function confirmDelete(material: typeof store.materials[0]) {
  if (confirm(`${t('materials.confirmDelete')} ${material.name}?`)) {
    store.removeMaterial(material.id)
  }
}

// Open price dialog
function openPriceDialog() {
  if (store.currentPrice) {
    priceForm.value.priceToman = store.currentPrice.priceToman
    priceForm.value.effectiveFrom = new Date(store.currentPrice.effectiveFrom)
      .toISOString()
      .slice(0, 16)
  } else {
    priceForm.value.priceToman = 0
    priceForm.value.effectiveFrom = new Date().toISOString().slice(0, 16)
  }
  showPriceDialog.value = true
}

// Close price dialog
function closePriceDialog() {
  showPriceDialog.value = false
}

// Save price
async function savePrice() {
  if (!store.selectedMaterial) return

  try {
    await store.updatePrice({
      materialId: store.selectedMaterial.id,
      priceToman: priceForm.value.priceToman,
      effectiveFrom: new Date(priceForm.value.effectiveFrom)
    })
    closePriceDialog()
  } catch (err) {
    // Error is handled by store
  }
}

// Format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

// Format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Watch dimension change to update unit
watch(() => materialForm.value.dimension, (newDimension) => {
  const units = unitsByDimension[newDimension]
  if (units.length > 0 && !units.includes(materialForm.value.unit)) {
    materialForm.value.unit = units[0]
  }
})
</script>

<style scoped>
.materials-view {
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
  margin-top: 1rem;
}

/* .search-input moved to global */

.materials-list {
  display: grid;
  gap: 1rem;
}

.material-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.material-card:hover {
  background: rgba(37, 99, 235, 0.05);
}

.material-card.selected {
  border: 2px solid var(--primary);
}

.material-info h3 {
  margin: 0 0 0.5rem 0;
}

.material-details {
  display: flex;
  gap: 0.5rem;
}

/* .badge moved to global */

.material-actions {
  display: flex;
  gap: 0.5rem;
}

/* .btn-icon moved to global */

.material-detail {
  padding: 1.5rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.detail-info {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--glass-border);
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
}

.price-section,
.price-history-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--glass-border);
}

.current-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary);
}

.price-history-list {
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
}

.price-history-item {
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
}

.price-history-item.current {
  background: rgba(37, 99, 235, 0.05);
}

.price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-badge {
  color: var(--primary);
  font-weight: 600;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  min-width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dialog-body {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* .form-input moved to global */

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

/* .btn-close moved to global */

/* .empty-state moved to global */

/* .error-message moved to global */

/* .loading-message moved to global */
</style>
