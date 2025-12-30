<template>
  <div class="bom-editor-view">
    <!-- Product Selection -->
    <div v-if="!selectedProductId" class="glass-card">
      <h2>{{ $t('bom.selectProduct') }}</h2>
      <div class="product-selector">
        <select v-model="productSelect" class="form-input" @change="selectProduct">
          <option value="">{{ $t('bom.selectProduct') }}</option>
          <option
            v-for="product in productsStore.products"
            :key="product.id"
            :value="product.id"
          >
            {{ product.name }} ({{ product.type === 'middle' ? $t('bom.middle') : $t('bom.final') }})
          </option>
        </select>
      </div>
    </div>

    <!-- BOM Editor -->
    <div v-else class="bom-editor-container">
      <!-- Header -->
      <div class="glass-card">
        <div class="header-section">
          <div>
            <h2>{{ selectedProduct?.name }}</h2>
            <p class="product-info">
              {{ $t('bom.yield') }}: {{ selectedProduct?.yieldQty }} {{ selectedProduct?.unit }}
            </p>
          </div>
          <button @click="clearSelection" class="btn-secondary">
            {{ $t('bom.changeProduct') }}
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="bomStore.error" class="error-message glass-card">
        {{ bomStore.error }}
        <button @click="bomStore.clearError" class="btn-close">×</button>
      </div>

      <!-- BOM Versions List -->
      <div class="glass-card">
        <div class="versions-header">
          <h3>{{ $t('bom.versions') }}</h3>
          <button @click="createNewVersion" class="btn-primary" :disabled="bomStore.loading">
            {{ $t('bom.createNewVersion') }}
          </button>
        </div>
        <div v-if="bomStore.bomVersions.length > 0" class="versions-list">
          <div
            v-for="version in bomStore.bomVersions"
            :key="version.id"
            class="version-item"
            :class="{ current: bomStore.currentVersion?.id === version.id }"
            @click="switchToVersion(version.id)"
          >
            <div class="version-info">
              <span class="version-number">{{ $t('bom.version') }} {{ version.versionNumber }}</span>
              <span class="version-date">{{ formatDate(version.createdAt) }}</span>
              <span v-if="bomStore.currentVersion?.id === version.id" class="current-badge">
                {{ $t('bom.current') }}
              </span>
            </div>
            <div class="version-actions">
              <button
                v-if="bomStore.currentVersion?.id !== version.id"
                @click.stop="setAsCurrent(version.id)"
                class="btn-secondary btn-sm"
              >
                {{ $t('bom.setAsCurrent') }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-versions">
          {{ $t('bom.noVersions') }}
        </div>
      </div>

      <!-- BOM Editor Component -->
      <div v-if="bomStore.currentBomVersion" class="glass-card">
        <div class="bom-version-header">
          <h3>
            {{ $t('bom.editingVersion') }} {{ bomStore.currentBomVersion.versionNumber }}
            <span v-if="bomStore.currentBomVersion.id === bomStore.currentVersion?.id" class="current-badge">
              ({{ $t('bom.current') }})
            </span>
          </h3>
          <div class="version-actions">
            <button @click="saveAsCurrent" class="btn-primary" :disabled="bomStore.loading">
              {{ $t('bom.saveAsCurrent') }}
            </button>
          </div>
        </div>
        <BomEditor />
      </div>

      <!-- Notes Dialog -->
      <div v-if="showNotesDialog" class="dialog-overlay" @click.self="closeNotesDialog">
        <div class="dialog glass-card">
          <div class="dialog-header">
            <h3>{{ $t('bom.versionNotes') }}</h3>
            <button @click="closeNotesDialog" class="btn-close">×</button>
          </div>
          <div class="dialog-body">
            <textarea
              v-model="versionNotes"
              :placeholder="$t('bom.notesPlaceholder')"
              class="form-input"
              rows="4"
            ></textarea>
          </div>
          <div class="dialog-footer">
            <button @click="closeNotesDialog" class="btn-secondary">
              {{ $t('bom.cancel') }}
            </button>
            <button @click="confirmCreateVersion" class="btn-primary">
              {{ $t('bom.create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBomStore } from '../stores/bomStore'
import { useProductsStore } from '../stores/productsStore'
import BomEditor from '../components/BomEditor.vue'

const { t } = useI18n()
const bomStore = useBomStore()
const productsStore = useProductsStore()

const selectedProductId = ref<string | null>(null)
const productSelect = ref('')
const showNotesDialog = ref(false)
const versionNotes = ref('')

const selectedProduct = computed(() => {
  if (!selectedProductId.value) return null
  return productsStore.products.find(p => p.id === selectedProductId.value) || null
})

onMounted(async () => {
  await productsStore.loadProducts()
})

async function selectProduct() {
  if (productSelect.value) {
    selectedProductId.value = productSelect.value
    await bomStore.startEditing(productSelect.value)
  }
}

function clearSelection() {
  selectedProductId.value = null
  productSelect.value = ''
  bomStore.clearEditing()
}

async function createNewVersion() {
  showNotesDialog.value = true
  versionNotes.value = ''
}

function closeNotesDialog() {
  showNotesDialog.value = false
}

async function confirmCreateVersion() {
  if (!selectedProductId.value) return
  
  try {
    await bomStore.createNewVersion(selectedProductId.value, versionNotes.value || undefined)
    closeNotesDialog()
  } catch (err) {
    // Error handled by store
  }
}

async function switchToVersion(versionId: string) {
  await bomStore.switchToVersion(versionId)
}

async function setAsCurrent(versionId: string) {
  if (!selectedProductId.value) return
  
  if (confirm(t('bom.confirmSetCurrent'))) {
    try {
      // Temporarily set the version as current in store
      bomStore.currentBomVersion = bomStore.bomVersions.find(v => v.id === versionId) || null
      await bomStore.saveAsCurrent(selectedProductId.value)
    } catch (err) {
      // Error handled by store
    }
  }
}

async function saveAsCurrent() {
  if (!selectedProductId.value) return
  
  if (confirm(t('bom.confirmSaveAsCurrent'))) {
    try {
      await bomStore.saveAsCurrent(selectedProductId.value)
    } catch (err) {
      // Error handled by store
    }
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.bom-editor-view {
  display: grid;
  gap: 1.5rem;
}

.product-selector {
  margin-top: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-info {
  color: #6b7280;
  margin: 0.5rem 0 0 0;
}

.versions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.versions-list {
  display: grid;
  gap: 0.75rem;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.5rem;
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.2s;
}

.version-item:hover {
  background: rgba(37, 99, 235, 0.05);
}

.version-item.current {
  border: 2px solid var(--primary);
  background: rgba(37, 99, 235, 0.1);
}

.version-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.version-number {
  font-weight: 600;
}

.version-date {
  color: #6b7280;
  font-size: 0.875rem;
}

.current-badge {
  padding: 0.25rem 0.75rem;
  background: var(--primary);
  color: white;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.bom-version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.no-versions {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

/* Reuse styles from MaterialsView */
.error-message,
.dialog-overlay,
.dialog,
.dialog-header,
.dialog-body,
.dialog-footer,
.btn-primary,
.btn-secondary,
.btn-close {
  /* Styles inherited */
}
</style>

