import { UnitConverter, areUnitsCompatible, getDimensionForUnit } from './UnitConverter'
import type { BomLine } from '../entities/Bom'
import type { Material } from '../entities/Material'
import type { Product } from '../entities/Product'

/**
 * BomValidator domain service
 * Validates BOMs for cycles, unit compatibility, etc.
 */
export class BomValidator {
  /**
   * Validate unit compatibility between BOM line and input
   */
  static validateUnitCompatibility(
    bomLine: BomLine,
    input: Material | Product
  ): { valid: boolean; error?: string } {
    // Check if dimensions match
    const lineDimension = getDimensionForUnit(bomLine.unit)
    if (!lineDimension) {
      return {
        valid: false,
        error: `Invalid unit: ${bomLine.unit}`
      }
    }

    if (lineDimension !== input.dimension) {
      return {
        valid: false,
        error: `Unit dimension mismatch: BOM line unit ${bomLine.unit} (${lineDimension}) does not match input dimension ${input.dimension}`
      }
    }

    // Check if units are compatible (can be converted)
    if (!areUnitsCompatible(bomLine.unit, input.unit)) {
      return {
        valid: false,
        error: `Units are not compatible: ${bomLine.unit} and ${input.unit}`
      }
    }

    return { valid: true }
  }

  /**
   * Validate BOM line quantity
   */
  static validateQuantity(bomLine: BomLine): { valid: boolean; error?: string } {
    if (bomLine.qty < 0) {
      return {
        valid: false,
        error: 'BOM line quantity cannot be negative'
      }
    }

    if (!Number.isFinite(bomLine.qty)) {
      return {
        valid: false,
        error: 'BOM line quantity must be a finite number'
      }
    }

    // Check decimal places (max 5)
    const decimals = this.getDecimalPlaces(bomLine.qty)
    if (decimals > 5) {
      return {
        valid: false,
        error: 'BOM line quantity cannot have more than 5 decimal places'
      }
    }

    return { valid: true }
  }

  /**
   * Get number of decimal places
   */
  private static getDecimalPlaces(num: number): number {
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

  /**
   * Detect cycles in BOM structure
   * Returns list of cycle paths if any found
   */
  static detectCycles(
    productId: string,
    bomLines: BomLine[],
    getProduct: (id: string) => Promise<Product | undefined>,
    getBomLines: (productId: string) => Promise<BomLine[]>
  ): Promise<string[][]> {
    return this.detectCyclesRecursive(
      productId,
      bomLines,
      [productId],
      new Set<string>(),
      getProduct,
      getBomLines
    )
  }

  /**
   * Recursive cycle detection
   */
  private static async detectCyclesRecursive(
    currentProductId: string,
    bomLines: BomLine[],
    path: string[],
    visited: Set<string>,
    getProduct: (id: string) => Promise<Product | undefined>,
    getBomLines: (productId: string) => Promise<BomLine[]>
  ): Promise<string[][]> {
    const cycles: string[][] = []

    for (const line of bomLines) {
      if (line.inputType === 'product') {
        const inputProductId = line.inputId

        // Check for direct cycle
        if (inputProductId === currentProductId) {
          cycles.push([...path, inputProductId])
          continue
        }

        // Check if already visited (cycle detected)
        if (path.includes(inputProductId)) {
          const cycleStart = path.indexOf(inputProductId)
          cycles.push([...path.slice(cycleStart), inputProductId])
          continue
        }

        // Avoid infinite loops
        if (visited.has(inputProductId)) {
          continue
        }

        // Recursively check nested products
        const inputProduct = await getProduct(inputProductId)
        if (inputProduct && inputProduct.currentBomVersionId) {
          const nestedLines = await getBomLines(inputProduct.currentBomVersionId)
          visited.add(inputProductId)
          const nestedCycles = await this.detectCyclesRecursive(
            inputProductId,
            nestedLines,
            [...path, inputProductId],
            visited,
            getProduct,
            getBomLines
          )
          cycles.push(...nestedCycles)
          visited.delete(inputProductId)
        }
      }
    }

    return cycles
  }

  /**
   * Validate all BOM lines
   */
  static validateBomLines(
    bomLines: BomLine[],
    getInput: (type: 'material' | 'product', id: string) => Promise<Material | Product | undefined>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    for (const line of bomLines) {
      // Validate quantity
      const quantityValidation = this.validateQuantity(line)
      if (!quantityValidation.valid) {
        errors.push(`Line ${line.id}: ${quantityValidation.error}`)
      }

      // Validate unit compatibility
      const input = await getInput(line.inputType, line.inputId)
      if (!input) {
        errors.push(`Line ${line.id}: Input ${line.inputType} ${line.inputId} not found`)
      } else {
        const unitValidation = this.validateUnitCompatibility(line, input)
        if (!unitValidation.valid) {
          errors.push(`Line ${line.id}: ${unitValidation.error}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

