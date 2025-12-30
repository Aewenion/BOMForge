import { Quantity } from '../valueObjects/Quantity'

/**
 * Unit conversion factors (intra-dimensional only)
 * All conversions are to base unit, then from base unit to target
 */
const CONVERSION_FACTORS: Record<string, Record<string, number>> = {
  // Mass conversions (base: gram)
  mass: {
    g: 1,
    kg: 1000,
    mg: 0.001,
    ton: 1000000
  },
  // Volume conversions (base: milliliter)
  volume: {
    ml: 1,
    L: 1000,
    'm³': 1000000,
    'cm³': 1,
    'dm³': 1000
  },
  // Count conversions (base: unit)
  count: {
    unit: 1,
    piece: 1,
    pcs: 1
  }
}

/**
 * Unit definitions per dimension
 */
export const UNITS_BY_DIMENSION: Record<'mass' | 'volume' | 'count', string[]> = {
  mass: ['g', 'kg', 'mg', 'ton'],
  volume: ['ml', 'L', 'm³', 'cm³', 'dm³'],
  count: ['unit', 'piece', 'pcs']
}

/**
 * Get dimension for a unit
 */
export function getDimensionForUnit(unit: string): 'mass' | 'volume' | 'count' | null {
  for (const [dimension, units] of Object.entries(UNITS_BY_DIMENSION)) {
    if (units.includes(unit)) {
      return dimension as 'mass' | 'volume' | 'count'
    }
  }
  return null
}

/**
 * Check if two units are compatible (same dimension)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const dim1 = getDimensionForUnit(unit1)
  const dim2 = getDimensionForUnit(unit2)
  return dim1 !== null && dim1 === dim2
}

/**
 * UnitConverter domain service
 * Handles intra-dimensional unit conversions only
 */
export class UnitConverter {
  /**
   * Convert a quantity to a different unit (same dimension)
   */
  static convert(quantity: Quantity, targetUnit: string): Quantity {
    // Validate units are compatible
    if (!areUnitsCompatible(quantity.unit, targetUnit)) {
      throw new Error(
        `Cannot convert from ${quantity.unit} to ${targetUnit}: incompatible dimensions`
      )
    }

    // If same unit, return as-is
    if (quantity.unit === targetUnit) {
      return quantity.clone()
    }

    // Get conversion factors
    const dimension = quantity.dimension
    const factors = CONVERSION_FACTORS[dimension]

    if (!factors || !factors[quantity.unit] || !factors[targetUnit]) {
      throw new Error(
        `Conversion not supported: ${quantity.unit} to ${targetUnit} in dimension ${dimension}`
      )
    }

    // Convert: value_in_base * (target_factor / source_factor)
    const sourceFactor = factors[quantity.unit]
    const targetFactor = factors[targetUnit]
    const convertedValue = (quantity.value * sourceFactor) / targetFactor

    return Quantity.create(convertedValue, targetUnit, dimension)
  }

  /**
   * Convert value directly (convenience method)
   */
  static convertValue(
    value: number,
    fromUnit: string,
    toUnit: string,
    dimension: 'mass' | 'volume' | 'count'
  ): number {
    const quantity = Quantity.create(value, fromUnit, dimension)
    const converted = this.convert(quantity, toUnit)
    return converted.value
  }

  /**
   * Get all compatible units for a given unit
   */
  static getCompatibleUnits(unit: string): string[] {
    const dimension = getDimensionForUnit(unit)
    if (!dimension) {
      return []
    }
    return [...UNITS_BY_DIMENSION[dimension]]
  }

  /**
   * Check if conversion is possible between two units
   */
  static canConvert(fromUnit: string, toUnit: string): boolean {
    return areUnitsCompatible(fromUnit, toUnit)
  }

  /**
   * Normalize quantity to base unit of its dimension
   */
  static toBaseUnit(quantity: Quantity): Quantity {
    const dimension = quantity.dimension
    const factors = CONVERSION_FACTORS[dimension]

    if (!factors || !factors[quantity.unit]) {
      throw new Error(`Base unit conversion not supported for ${quantity.unit}`)
    }

    // Find base unit (factor = 1)
    const baseUnit = Object.entries(factors).find(([_, factor]) => factor === 1)?.[0]
    if (!baseUnit) {
      throw new Error(`Base unit not found for dimension ${dimension}`)
    }

    return this.convert(quantity, baseUnit)
  }

  /**
   * Get base unit for a dimension
   */
  static getBaseUnit(dimension: 'mass' | 'volume' | 'count'): string {
    const factors = CONVERSION_FACTORS[dimension]
    const baseUnit = Object.entries(factors).find(([_, factor]) => factor === 1)?.[0]
    if (!baseUnit) {
      throw new Error(`Base unit not found for dimension ${dimension}`)
    }
    return baseUnit
  }
}


