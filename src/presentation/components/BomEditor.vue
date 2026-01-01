<template>
  <div class="bom-editor">
    <div class="editor-header">
      <h3>{{ $t('bom.editor') }}</h3>
      <div class="header-actions">
        <button @click="openAddLineDialog" class="btn-primary" :disabled="!canAddLine">
          {{ $t('bom.addLine') }}
        </button>
      </div>
    </div>

    <!-- BOM Lines List -->
    <div v-if="lines.length > 0" class="bom-lines">
      <div
        v-for="(line, index) in lines"
        :key="line.id"
        class="bom-line-item"
      >
        <div class="line-number">{{ index + 1 }}</div>
        <div class="line-content">
          <div class="line-input-info">
            <span class="input-name">{{ getInputName(line) }}</span>
            <span class="badge">{{ line.inputType === 'material' ? $t('bom.material') : $t('bom.product') }}</span>
          </div>
          <div class="line-quantity">
            <input
              v-model.number="line.qty"
              type="number"
              step="0.00001"
              min="0"
              class="form-input"
              @blur="updateLine(line.id, { qty: line.qty })"
            />
            <select
              v-model="line.unit"
              class="form-select"
              @change="updateLine(line.id, { unit: line.unit })"
            >
              <option
                v-for="unit in getCompatibleUnits(line.unit)"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
          </div>
          <div class="line-waste">
            <label>{{ $t('bom.wastePct') }}:</label>
            <input
              v-model.number="line.wastePct"
              type="number"
              step="0.1"
              min="0"
              max="100"
              class="form-input"
              style="width: 100px"
              @blur="updateLine(line.id, { wastePct: line.wastePct })"
            />
            <span>%</span>
          </div>
        </div>
        <div class="line-actions">
          <button
            v-if="index > 0"
            @click="moveLineUp(index)"
            class="btn-icon"
            :title="$t('bom.moveUp')"
          >
            ↑
          </button>
          <button
            v-if="index < lines.length - 1"
            @click="moveLineDown(index)"
            class="btn-icon"
            :title="$t('bom.moveDown')"
          >
            ↓
          </button>
          <button
            @click="removeLine(line.id)"
            class="btn-icon btn-danger"
            :title="$t('bom.delete')"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      {{ $t('bom.noLines') }}
    </div>

    <!-- Add Line Dialog -->
    <div v-if="showAddLineDialog" class="dialog-overlay" @click.self="closeAddLineDialog">
      <div class="dialog glass-card">
        <div class="dialog-header">
          <h3>{{ $t('bom.addLine') }}</h3>
          <button @click="closeAddLineDialog" class="btn-close">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>{{ $t('bom.inputType') }}</label>
            <select v-model="newLine.inputType" class="form-input">
              <option value="material">{{ $t('bom.material') }}</option>
              <option value="product">{{ $t('bom.product') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ newLine.inputType === 'material' ? $t('bom.selectMaterial') : $t('bom.selectProduct') }}</label>
            <select v-model="newLine.inputId" class="form-input">
              <option value="">{{ $t('bom.select') }}</option>
              <option
                v-for="item in availableInputs"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }} ({{ item.unit }})
              </option>
            </select>
          </div>
          <div v-if="newLine.inputId" class="form-group">
            <label>{{ $t('bom.quantity') }}</label>
            <input
              v-model.number="newLine.qty"
              type="number"
              step="0.00001"
              min="0.00001"
              class="form-input"
            />
          </div>
          <div v-if="newLine.inputId" class="form-group">
            <label>{{ $t('bom.unit') }}</label>
            <select v-model="newLine.unit" class="form-input">
              <option
                v-for="unit in getAvailableUnits"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
          </div>
          <div v-if="newLine.inputId" class="form-group">
            <label>{{ $t('bom.wastePct') }} ({{ $t('bom.optional') }})</label>
            <input
              v-model.number="newLine.wastePct"
              type="number"
              step="0.1"
              min="0"
              max="100"
              class="form-input"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeAddLineDialog" class="btn-secondary">
            {{ $t('bom.cancel') }}
          </button>
          <button @click="addLine" class="btn-primary" :disabled="!isNewLineValid">
            {{ $t('bom.add') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBomStore } from '../stores/bomStore'
import { useMaterialsStore } from '../stores/materialsStore'
import { useProductsStore } from '../stores/productsStore'
import { UnitConverter } from '../../domain/services/UnitConverter'
import type { BomLine } from '../../domain/entities/Bom'

const { t } = useI18n()
const bomStore = useBomStore()
const materialsStore = useMaterialsStore()
const productsStore = useProductsStore()

const showAddLineDialog = ref(false)
const newLine = ref({
  inputType: 'material' as 'material' | 'product',
  inputId: '',
  qty: 1,
  unit: '',
  wastePct: undefined as number | undefined
})

const lines = computed(() => bomStore.bomLines)
const canAddLine = computed(() => bomStore.currentBomVersion !== null)

const availableInputs = computed(() => {
  if (newLine.value.inputType === 'material') {
    return materialsStore.materials
  } else {
    return productsStore.products
  }
})

const getAvailableUnits = computed(() => {
  if (!newLine.value.inputId) return []
  const input = availableInputs.value.find(i => i.id === newLine.value.inputId)
  if (!input) return []
  return UnitConverter.getCompatibleUnits(input.unit)
})

const isNewLineValid = computed(() => {
  return newLine.value.inputId !== '' &&
         newLine.value.qty > 0 &&
         newLine.value.unit !== ''
})

// Watch input selection to set default unit
watch(() => newLine.value.inputId, (inputId) => {
  if (inputId) {
    const input = availableInputs.value.find(i => i.id === inputId)
    if (input) {
      newLine.value.unit = input.unit
    }
  }
})

// Load materials and products when dialog opens
watch(showAddLineDialog, async (isOpen) => {
  if (isOpen) {
    try {
      await materialsStore.loadMaterials()
      await productsStore.loadProducts()
    } catch (err) {
      // Error handled by stores
    }
  }
})

function getInputName(line: BomLine): string {
  if (line.inputType === 'material') {
    const material = materialsStore.materials.find(m => m.id === line.inputId)
    return material?.name || line.inputId
  } else {
    const product = productsStore.products.find(p => p.id === line.inputId)
    return product?.name || line.inputId
  }
}

function getCompatibleUnits(unit: string): string[] {
  return UnitConverter.getCompatibleUnits(unit)
}

function openAddLineDialog() {
  newLine.value = {
    inputType: 'material',
    inputId: '',
    qty: 1,
    unit: '',
    wastePct: undefined
  }
  showAddLineDialog.value = true
}

function closeAddLineDialog() {
  showAddLineDialog.value = false
}

async function addLine() {
  try {
    await bomStore.addLine({
      inputType: newLine.value.inputType,
      inputId: newLine.value.inputId,
      qty: newLine.value.qty,
      unit: newLine.value.unit,
      wastePct: newLine.value.wastePct
    })
    closeAddLineDialog()
  } catch (err) {
    // Error handled by store
  }
}

async function updateLine(lineId: string, updates: { qty?: number; unit?: string; wastePct?: number }) {
  try {
    await bomStore.updateLine(lineId, updates)
  } catch (err) {
    // Error handled by store
  }
}

async function removeLine(lineId: string) {
  if (confirm(t('bom.confirmDeleteLine'))) {
    await bomStore.removeLine(lineId)
  }
}

async function moveLineUp(index: number) {
  const newOrder = lines.value.map((l, i) => ({
    lineId: l.id,
    sortOrder: i === index ? index - 1 : i === index - 1 ? index : i
  }))
  await bomStore.reorderLines(newOrder)
}

async function moveLineDown(index: number) {
  const newOrder = lines.value.map((l, i) => ({
    lineId: l.id,
    sortOrder: i === index ? index + 1 : i === index + 1 ? index : i
  }))
  await bomStore.reorderLines(newOrder)
}
</script>

<style scoped>
.bom-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bom-lines {
  display: grid;
  gap: 0.75rem;
}

.bom-line-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.5rem;
  border: 1px solid var(--glass-border);
}

.line-number {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  flex-shrink: 0;
}

.line-content {
  flex: 1;
  display: grid;
  gap: 0.5rem;
}

.line-input-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-name {
  font-weight: 500;
}

/* .input-type-badge replaced by .badge */

.line-quantity {
  display: flex;
  gap: 0.5rem;
}

/* .qty-input replaced by .form-input */

/* .unit-select replaced by .form-select */

.line-waste {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* .waste-input replaced by .form-input with inline width */

.line-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* .empty-bom replaced by .empty-state */

/* Reuse dialog styles moved to global */
</style>

