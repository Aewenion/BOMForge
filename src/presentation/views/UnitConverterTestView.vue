<template>
  <div class="unit-converter-test-view">
    <div class="glass-card">
      <h2>Unit Converter Test (Phase 3)</h2>
      <p>Test unit conversions and quantity handling.</p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
      </div>

      <!-- Unit Conversion Test -->
      <section class="test-section">
        <h3>Unit Conversion Test</h3>
        <div class="conversion-test">
          <div class="input-group">
            <input
              v-model.number="conversionValue"
              type="number"
              step="0.00001"
              class="input-field"
              placeholder="Value"
            />
            <select v-model="conversionFromUnit" class="input-field">
              <option
                v-for="unit in unitsByDimension[selectedDimension]"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
            <span>→</span>
            <select v-model="conversionToUnit" class="input-field">
              <option
                v-for="unit in unitsByDimension[selectedDimension]"
                :key="unit"
                :value="unit"
              >
                {{ unit }}
              </option>
            </select>
            <button @click="testConversion" class="btn-primary">Convert</button>
          </div>
          <div class="dimension-selector">
            <label>Dimension:</label>
            <select v-model="selectedDimension" class="input-field">
              <option value="mass">Mass</option>
              <option value="volume">Volume</option>
              <option value="count">Count</option>
            </select>
          </div>
          <div v-if="conversionResult !== null" class="result">
            <strong>Result:</strong> {{ conversionResult.toFixed(5) }} {{ conversionToUnit }}
          </div>
        </div>
      </section>

      <!-- Quantity Input Component Test -->
      <section class="test-section">
        <h3>Quantity Input Component Test</h3>
        <div class="quantity-test">
          <label>Mass Quantity:</label>
          <QuantityInput
            v-model="massQuantity"
            dimension="mass"
            placeholder="Enter mass"
            show-converted
            base-unit="g"
          />
          <div v-if="massQuantity" class="quantity-info">
            Value: {{ massQuantity.value }}, Unit: {{ massQuantity.unit }}, Dimension: {{ massQuantity.dimension }}
          </div>
        </div>
        <div class="quantity-test">
          <label>Volume Quantity:</label>
          <QuantityInput
            v-model="volumeQuantity"
            dimension="volume"
            placeholder="Enter volume"
            show-converted
            base-unit="ml"
          />
          <div v-if="volumeQuantity" class="quantity-info">
            Value: {{ volumeQuantity.value }}, Unit: {{ volumeQuantity.unit }}, Dimension: {{ volumeQuantity.dimension }}
          </div>
        </div>
        <div class="quantity-test">
          <label>Count Quantity:</label>
          <QuantityInput
            v-model="countQuantity"
            dimension="count"
            placeholder="Enter count"
          />
          <div v-if="countQuantity" class="quantity-info">
            Value: {{ countQuantity.value }}, Unit: {{ countQuantity.unit }}, Dimension: {{ countQuantity.dimension }}
          </div>
        </div>
      </section>

      <!-- Validation Test -->
      <section class="test-section">
        <h3>Validation Test</h3>
        <div class="validation-test">
          <div class="input-group">
            <input
              v-model.number="validationValue"
              type="number"
              step="0.00001"
              class="input-field"
              placeholder="Test value"
            />
            <button @click="testValidation" class="btn-primary">Validate</button>
          </div>
          <div v-if="validationResult" class="validation-result">
            <div :class="validationResult.valid ? 'valid' : 'invalid'">
              {{ validationResult.valid ? '✓ Valid' : '✗ Invalid' }}
            </div>
            <div v-if="validationResult.error" class="error-detail">
              {{ validationResult.error }}
            </div>
          </div>
        </div>
      </section>

      <!-- Decimal Places Test -->
      <section class="test-section">
        <h3>5 Decimal Places Support Test</h3>
        <div class="decimal-test">
          <p>Test values with up to 5 decimal places:</p>
          <div class="test-values">
            <button
              v-for="testValue in testValues"
              :key="testValue"
              @click="setTestValue(testValue)"
              class="btn-secondary"
            >
              {{ testValue }}
            </button>
          </div>
          <div v-if="testQuantity" class="quantity-info">
            Quantity: {{ testQuantity.value }} {{ testQuantity.unit }}
            <br>
            Formatted (2 decimals): {{ testQuantity.format(2) }}
            <br>
            Formatted (5 decimals): {{ testQuantity.format(5) }}
            <br>
            Smart format: {{ formatQuantitySmart(testQuantity) }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Quantity } from '../../domain/valueObjects/Quantity'
import { UnitConverter, UNITS_BY_DIMENSION } from '../../domain/services/UnitConverter'
import { formatQuantitySmart } from '../../domain/utils/quantityFormatter'
import QuantityInput from '../components/QuantityInput.vue'

const error = ref<string>('')
const success = ref<string>('')

// Conversion test
const selectedDimension = ref<'mass' | 'volume' | 'count'>('mass')
const conversionValue = ref(1)
const conversionFromUnit = ref('kg')
const conversionToUnit = ref('g')
const conversionResult = ref<number | null>(null)

const unitsByDimension = UNITS_BY_DIMENSION

// Quantity inputs
const massQuantity = ref<Quantity | null>(null)
const volumeQuantity = ref<Quantity | null>(null)
const countQuantity = ref<Quantity | null>(null)

// Validation test
const validationValue = ref(1.12345)
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)

// Decimal places test
const testQuantity = ref<Quantity | null>(null)
const testValues = [
  1,
  0.1,
  0.01,
  0.001,
  0.0001,
  0.00001,
  1.12345,
  0.00001,
  123.45678
]

// Watch dimension change to update units
const updateUnitsForDimension = () => {
  const units = unitsByDimension[selectedDimension.value]
  if (units.length > 0) {
    conversionFromUnit.value = units[0]
    conversionToUnit.value = units[units.length > 1 ? 1 : 0]
  }
}

// Test conversion
function testConversion() {
  try {
    error.value = ''
    const quantity = Quantity.create(conversionValue.value, conversionFromUnit.value, selectedDimension.value)
    const converted = UnitConverter.convert(quantity, conversionToUnit.value)
    conversionResult.value = converted.value
    success.value = 'Conversion successful!'
    setTimeout(() => { success.value = '' }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Conversion failed'
    conversionResult.value = null
  }
}

// Test validation
function testValidation() {
  try {
    error.value = ''
    const quantity = Quantity.create(validationValue.value, 'g', 'mass')
    validationResult.value = { valid: true }
    success.value = 'Validation passed!'
    setTimeout(() => { success.value = '' }, 2000)
  } catch (err) {
    validationResult.value = {
      valid: false,
      error: err instanceof Error ? err.message : 'Validation failed'
    }
  }
}

// Set test value
function setTestValue(value: number) {
  try {
    testQuantity.value = Quantity.create(value, 'g', 'mass')
    success.value = `Quantity created: ${value}`
    setTimeout(() => { success.value = '' }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create quantity'
  }
}
</script>

<style scoped>
.unit-converter-test-view {
  display: grid;
  gap: 2rem;
}

.test-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--glass-border);
}

.test-section:last-child {
  border-bottom: none;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.input-field {
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
}

.dimension-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.result {
  padding: 1rem;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.quantity-test {
  margin-bottom: 1.5rem;
}

.quantity-info {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.validation-result {
  margin-top: 1rem;
}

.valid {
  color: #059669;
  font-weight: 600;
}

.invalid {
  color: #ef4444;
  font-weight: 600;
}

.error-detail {
  margin-top: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
}

.test-values {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-main);
  border: 1px solid var(--glass-border);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.1);
}
</style>

