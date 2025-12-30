<template>
  <div class="quantity-input">
    <div class="input-group">
      <input
        :id="inputId"
        v-model="displayValue"
        type="number"
        :step="step"
        :min="0"
        :placeholder="placeholder"
        class="quantity-value-input"
        @input="handleInput"
        @blur="handleBlur"
      />
      <select
        v-model="selectedUnit"
        class="unit-select"
        @change="handleUnitChange"
      >
        <option
          v-for="unit in compatibleUnits"
          :key="unit"
          :value="unit"
        >
          {{ unit }}
        </option>
      </select>
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-if="showConverted && convertedValue !== null" class="converted-value">
      = {{ formatConvertedValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Quantity } from '../../domain/valueObjects/Quantity'
import { UnitConverter, getDimensionForUnit, UNITS_BY_DIMENSION } from '../../domain/services/UnitConverter'
import { formatQuantitySmart } from '../../domain/utils/quantityFormatter'

interface Props {
  modelValue: Quantity | null
  dimension: 'mass' | 'volume' | 'count'
  placeholder?: string
  showConverted?: boolean
  baseUnit?: string // Unit to show converted value in
  inputId?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0.00000',
  showConverted: false,
  baseUnit: undefined,
  inputId: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: Quantity | null]
}>()

const displayValue = ref('')
const selectedUnit = ref<string>('')
const error = ref<string>('')
const convertedValue = ref<Quantity | null>(null)

// Get compatible units for the dimension
const compatibleUnits = computed(() => {
  return UNITS_BY_DIMENSION[props.dimension] || []
})

// Step for number input (based on dimension)
const step = computed(() => {
  // For count, step is 1, for others allow decimals
  return props.dimension === 'count' ? '1' : '0.00001'
})

// Format converted value for display
const formatConvertedValue = computed(() => {
  if (!convertedValue.value) return ''
  return formatQuantitySmart(convertedValue.value, true)
})

// Initialize from modelValue
onMounted(() => {
  if (props.modelValue) {
    displayValue.value = props.modelValue.value.toString()
    selectedUnit.value = props.modelValue.unit
  } else {
    // Default to first unit in dimension
    selectedUnit.value = compatibleUnits.value[0] || ''
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    displayValue.value = newValue.value.toString()
    selectedUnit.value = newValue.unit
    error.value = ''
  } else {
    displayValue.value = ''
  }
}, { immediate: true })

// Handle input changes
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  error.value = ''

  if (value === '' || value === null) {
    emit('update:modelValue', null)
    convertedValue.value = null
    return
  }

  try {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      error.value = 'Invalid number'
      return
    }

    if (numValue < 0) {
      error.value = 'Quantity cannot be negative'
      return
    }

    // Check decimal places
    const decimals = getDecimalPlaces(numValue)
    if (decimals > 5) {
      error.value = 'Maximum 5 decimal places allowed'
      return
    }

    const quantity = Quantity.create(numValue, selectedUnit.value, props.dimension)
    emit('update:modelValue', quantity)

    // Update converted value if needed
    updateConvertedValue(quantity)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Invalid quantity'
  }
}

// Handle blur - normalize the value
function handleBlur() {
  if (displayValue.value === '') {
    return
  }

  try {
    const numValue = parseFloat(displayValue.value)
    if (!isNaN(numValue) && numValue >= 0) {
      const normalized = Quantity.normalize(numValue)
      displayValue.value = normalized.toString()
      
      const quantity = Quantity.create(normalized, selectedUnit.value, props.dimension)
      emit('update:modelValue', quantity)
      updateConvertedValue(quantity)
    }
  } catch (err) {
    // Ignore errors on blur
  }
}

// Handle unit change
function handleUnitChange() {
  if (!props.modelValue) {
    return
  }

  try {
    // Convert quantity to new unit
    const converted = UnitConverter.convert(props.modelValue, selectedUnit.value)
    displayValue.value = converted.value.toString()
    emit('update:modelValue', converted)
    updateConvertedValue(converted)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unit conversion failed'
  }
}

// Update converted value display
function updateConvertedValue(quantity: Quantity) {
  if (!props.showConverted) {
    convertedValue.value = null
    return
  }

  try {
    if (props.baseUnit && props.baseUnit !== quantity.unit) {
      convertedValue.value = UnitConverter.convert(quantity, props.baseUnit)
    } else {
      convertedValue.value = null
    }
  } catch (err) {
    convertedValue.value = null
  }
}

// Get decimal places in a number
function getDecimalPlaces(num: number): number {
  if (Math.floor(num) === num) return 0
  const str = num.toString()
  if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
    return str.split('.')[1].length
  } else if (str.indexOf('e-') !== -1) {
    const parts = str.split('e-')
    return parseInt(parts[1], 10) + (parts[0].split('.')[1] || '').length
  }
  return 0
}
</script>

<style scoped>
.quantity-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.quantity-value-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
}

.quantity-value-input:focus {
  outline: none;
  border-color: var(--primary);
}

.unit-select {
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
  background: white;
  min-width: 80px;
}

.unit-select:focus {
  outline: none;
  border-color: var(--primary);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
}

.converted-value {
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}
</style>




