import { Quantity } from '../valueObjects/Quantity'

/**
 * Formatting utilities for quantities
 */

/**
 * Format quantity for display with appropriate decimal places
 */
export function formatQuantity(
  quantity: Quantity,
  options: {
    decimalPlaces?: number
    showUnit?: boolean
    unitDisplay?: 'short' | 'long'
  } = {}
): string {
  const {
    decimalPlaces = 2,
    showUnit = true,
    unitDisplay = 'short'
  } = options

  const formattedValue = quantity.value.toFixed(decimalPlaces)
  const unit = showUnit ? quantity.unit : ''

  // Remove trailing zeros
  const trimmedValue = formattedValue.replace(/\.?0+$/, '')

  return showUnit ? `${trimmedValue} ${unit}` : trimmedValue
}

/**
 * Format quantity with smart decimal places (removes unnecessary zeros)
 */
export function formatQuantitySmart(quantity: Quantity, showUnit: boolean = true): string {
  // Try different decimal places to find the most appropriate
  for (let decimals = 0; decimals <= 5; decimals++) {
    const formatted = quantity.value.toFixed(decimals)
    const trimmed = formatted.replace(/\.?0+$/, '')
    const parsed = parseFloat(trimmed)
    
    // Check if rounding to this precision matches original value
    if (Math.abs(parsed - quantity.value) < 0.000001) {
      return showUnit ? `${trimmed} ${quantity.unit}` : trimmed
    }
  }

  // Fallback to 5 decimals
  return formatQuantity(quantity, { decimalPlaces: 5, showUnit })
}

/**
 * Format quantity for input fields (always show full precision)
 */
export function formatQuantityForInput(quantity: Quantity): string {
  // For input, we want to preserve all 5 decimal places if needed
  const str = quantity.value.toString()
  
  // If it's a whole number, return as-is
  if (quantity.value % 1 === 0) {
    return str
  }

  // Otherwise, ensure we show up to 5 decimals
  return quantity.value.toFixed(5).replace(/\.?0+$/, '')
}

/**
 * Parse quantity from string input
 */
export function parseQuantity(
  input: string,
  unit: string,
  dimension: 'mass' | 'volume' | 'count'
): Quantity {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Quantity input cannot be empty')
  }

  const value = parseFloat(trimmed)
  if (isNaN(value)) {
    throw new Error(`Invalid quantity value: ${trimmed}`)
  }

  return Quantity.create(value, unit, dimension)
}

/**
 * Format large numbers with appropriate precision
 */
export function formatLargeNumber(value: number, maxDecimals: number = 2): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(maxDecimals) + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(maxDecimals) + 'K'
  }
  return value.toFixed(maxDecimals)
}



