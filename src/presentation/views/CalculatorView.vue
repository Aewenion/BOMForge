<template>
  <div class="calculator-view">
    <div class="glass-card">
      <h2>{{ $t('calculator.title') }}</h2>
      <p>{{ $t('calculator.description') }}</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message glass-card">
      {{ error }}
      <button @click="error = ''" class="btn-close">×</button>
    </div>

    <!-- Calculator Form -->
    <div class="glass-card">
      <h3>{{ $t('calculator.input') }}</h3>
      <div class="calculator-form">
        <div class="form-group">
          <label>{{ $t('calculator.selectProduct') }}</label>
          <select v-model="selectedProductId" class="form-input" @change="onProductChange">
            <option value="">{{ $t('calculator.select') }}</option>
            <option
              v-for="product in products"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }} ({{ product.type === 'middle' ? $t('calculator.middle') : $t('calculator.final') }}, {{ product.yieldQty }} {{ product.unit }})
            </option>
          </select>
        </div>

        <div v-if="selectedProduct" class="form-group">
          <label>{{ $t('calculator.targetQuantity') }}</label>
          <div class="quantity-input-group">
            <input
              v-model.number="targetQuantity"
              type="number"
              step="0.00001"
              min="0.00001"
              class="form-input"
              :placeholder="$t('calculator.quantityPlaceholder')"
            />
            <select v-model="targetUnit" class="form-input unit-select">
              <option
                v-for="unit in availableUnits"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
          </div>
          <small class="form-hint">
            {{ $t('calculator.productYield') }}: {{ selectedProduct.yieldQty }} {{ selectedProduct.unit }}
          </small>
        </div>

        <div class="form-actions">
          <button
            @click="calculate"
            class="btn-primary"
            :disabled="!canCalculate || calculating"
          >
            {{ calculating ? $t('calculator.calculating') : $t('calculator.calculate') }}
          </button>
          <button
            v-if="result"
            @click="exportResults"
            class="btn-secondary"
          >
            {{ $t('calculator.export') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result" class="glass-card">
      <div class="results-header">
        <h3>{{ $t('calculator.results') }}</h3>
        <div class="result-summary">
          <span class="summary-item">
            {{ $t('calculator.product') }}: <strong>{{ result.productName }}</strong>
          </span>
          <span class="summary-item">
            {{ $t('calculator.quantity') }}: <strong>{{ formatQuantity(result.targetQuantity) }} {{ result.targetUnit }}</strong>
          </span>
          <span class="summary-item">
            {{ $t('calculator.totalCost') }}: <strong>{{ formatPrice(result.totalCost) }}</strong>
          </span>
        </div>
      </div>

      <div v-if="result.requirements.length > 0" class="requirements-table">
        <table>
          <thead>
            <tr>
              <th>{{ $t('calculator.material') }}</th>
              <th>{{ $t('calculator.requiredQuantity') }}</th>
              <th>{{ $t('calculator.unit') }}</th>
              <th>{{ $t('calculator.pricePerUnit') }}</th>
              <th>{{ $t('calculator.costContribution') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="req in result.requirements"
              :key="req.materialId"
            >
              <td>{{ req.materialName }}</td>
              <td class="quantity-cell">{{ formatQuantity(req.totalQty) }}</td>
              <td>{{ req.unit }}</td>
              <td class="price-cell">{{ formatPrice(req.pricePerUnit) }}</td>
              <td class="price-cell total-cell">{{ formatPrice(req.costContribution) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="total-label">{{ $t('calculator.totalCost') }}:</td>
              <td class="price-cell total-cell">{{ formatPrice(result.totalCost) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div v-else class="no-requirements">
        {{ $t('calculator.noRequirements') }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="calculating" class="loading-message glass-card">
      {{ $t('calculator.calculating') }}...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '../stores/productsStore'
import { calculateRequirementsForOrder } from '../../application/useCases/CalculateRequirementsForOrder'
import { UnitConverter } from '../../domain/services/UnitConverter'
import type { CalculateRequirementsForOrderOutput } from '../../application/useCases/CalculateRequirementsForOrder'

const { t } = useI18n()
const productsStore = useProductsStore()

const selectedProductId = ref('')
const targetQuantity = ref(1)
const targetUnit = ref('')
const result = ref<CalculateRequirementsForOrderOutput | null>(null)
const calculating = ref(false)
const error = ref('')

const products = computed(() => productsStore.products)
const selectedProduct = computed(() => {
  if (!selectedProductId.value) return null
  return products.find(p => p.id === selectedProductId.value) || null
})

const availableUnits = computed(() => {
  if (!selectedProduct.value) return []
  return UnitConverter.getCompatibleUnits(selectedProduct.value.unit)
})

const canCalculate = computed(() => {
  return selectedProduct.value !== null &&
         targetQuantity.value > 0 &&
         targetUnit.value !== ''
})

onMounted(async () => {
  await productsStore.loadProducts()
})

function onProductChange() {
  if (selectedProduct.value) {
    targetUnit.value = selectedProduct.value.unit
    targetQuantity.value = selectedProduct.value.yieldQty
    result.value = null
  }
}

async function calculate() {
  if (!selectedProduct.value || !canCalculate.value) return

  calculating.value = true
  error.value = ''
  result.value = null

  try {
    const calculationResult = await calculateRequirementsForOrder({
      productId: selectedProduct.value.id,
      targetQuantity: targetQuantity.value,
      targetUnit: targetUnit.value
    })
    result.value = calculationResult
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('calculator.calculationError')
  } finally {
    calculating.value = false
  }
}

function exportResults() {
  if (!result.value) return

  const exportData = {
    product: result.value.productName,
    targetQuantity: `${result.value.targetQuantity} ${result.value.targetUnit}`,
    totalCost: formatPrice(result.value.totalCost),
    calculatedAt: result.value.calculatedAt.toISOString(),
    requirements: result.value.requirements.map(req => ({
      material: req.materialName,
      quantity: `${formatQuantity(req.totalQty)} ${req.unit}`,
      pricePerUnit: formatPrice(req.pricePerUnit),
      costContribution: formatPrice(req.costContribution)
    }))
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bom-requirements-${result.value.productName}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

function formatQuantity(qty: number): string {
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5
  }).format(qty)
}
</script>

<style scoped>
.calculator-view {
  display: grid;
  gap: 1.5rem;
}

.calculator-form {
  display: grid;
  gap: 1rem;
}

.quantity-input-group {
  display: flex;
  gap: 0.5rem;
}

.quantity-input-group .form-input {
  flex: 1;
}

.unit-select {
  min-width: 120px;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.results-header {
  margin-bottom: 1.5rem;
}

.result-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 0.5rem;
}

.summary-item {
  display: flex;
  gap: 0.5rem;
}

.requirements-table {
  margin-top: 1.5rem;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: rgba(37, 99, 235, 0.1);
}

th {
  padding: 0.75rem;
  text-align: right;
  font-weight: 600;
  border-bottom: 2px solid var(--glass-border);
}

td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--glass-border);
}

tbody tr:hover {
  background: rgba(0, 0, 0, 0.02);
}

.quantity-cell {
  text-align: left;
  font-family: monospace;
}

.price-cell {
  text-align: left;
  font-family: monospace;
}

.total-cell {
  font-weight: 600;
  color: var(--primary);
}

tfoot {
  background: rgba(37, 99, 235, 0.05);
}

.total-label {
  text-align: left;
  font-weight: 600;
  padding: 1rem 0.75rem;
}

.no-requirements {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-message {
  text-align: center;
  padding: 2rem;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

/* Reuse styles */
.form-group,
.form-input,
.btn-primary,
.btn-secondary,
.btn-close {
  /* Styles inherited */
}
</style>

