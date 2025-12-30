import { UnitConverter } from './UnitConverter'
import { Quantity } from '../valueObjects/Quantity'
import type { BomLine } from '../entities/Bom'
import type { Material, MaterialPrice } from '../entities/Material'
import type { Product } from '../entities/Product'

/**
 * Expanded requirement - represents a material requirement after expansion
 */
export interface ExpandedRequirement {
  materialId: string
  materialName: string
  totalQty: number // Total quantity needed in material's unit
  unit: string
  dimension: 'mass' | 'volume' | 'count'
  costContribution: number // Cost contribution in Toman
  pricePerUnit: number // Current price per unit
}

/**
 * RequirementsExpander domain service
 * Expands BOMs recursively to raw materials only
 */
export class RequirementsExpander {
  /**
   * Expand BOM to raw materials for a given product quantity
   */
  static async expand(
    product: Product,
    requiredQty: number,
    getBomLines: (bomVersionId: string) => Promise<BomLine[]>,
    getMaterial: (id: string) => Promise<Material | undefined>,
    getProduct: (id: string) => Promise<Product | undefined>,
    getCurrentPrice: (materialId: string) => Promise<MaterialPrice | undefined>,
    visitedProducts: Set<string> = new Set()
  ): Promise<ExpandedRequirement[]> {
    // Prevent cycles
    if (visitedProducts.has(product.id)) {
      throw new Error(`Cycle detected: Product ${product.id} already visited`)
    }
    visitedProducts.add(product.id)

    // If product has no BOM, return empty
    if (!product.currentBomVersionId) {
      return []
    }

    // Get BOM lines
    const bomLines = await getBomLines(product.currentBomVersionId)

    // Calculate scale factor based on yield
    // scale = required_qty_in_product_unit / product_yield_qty
    const scale = requiredQty / product.yieldQty

    // Aggregate requirements by material
    const requirements = new Map<string, ExpandedRequirement>()

    for (const line of bomLines) {
      // Calculate effective quantity (with waste)
      const effectiveQty = line.qty * (1 + (line.wastePct || 0) / 100)
      const scaledQty = effectiveQty * scale

      if (line.inputType === 'material') {
        // Direct material - add to requirements
        const material = await getMaterial(line.inputId)
        if (!material) {
          throw new Error(`Material ${line.inputId} not found`)
        }

        // Convert quantity to material's unit
        const quantity = Quantity.create(scaledQty, line.unit, material.dimension)
        const convertedQty = UnitConverter.convert(quantity, material.unit)

        // Get current price
        const price = await getCurrentPrice(material.id)
        const pricePerUnit = price?.priceToman || 0
        const costContribution = convertedQty.value * pricePerUnit

        // Aggregate with existing requirement
        const existing = requirements.get(material.id)
        if (existing) {
          existing.totalQty += convertedQty.value
          existing.costContribution += costContribution
        } else {
          requirements.set(material.id, {
            materialId: material.id,
            materialName: material.name,
            totalQty: convertedQty.value,
            unit: material.unit,
            dimension: material.dimension,
            costContribution,
            pricePerUnit
          })
        }
      } else {
        // Nested product - recursively expand
        const nestedProduct = await getProduct(line.inputId)
        if (!nestedProduct) {
          throw new Error(`Product ${line.inputId} not found`)
        }

        // Convert quantity to nested product's unit
        const quantity = Quantity.create(scaledQty, line.unit, nestedProduct.dimension)
        const convertedQty = UnitConverter.convert(quantity, nestedProduct.unit)

        // Recursively expand nested product
        const nestedRequirements = await this.expand(
          nestedProduct,
          convertedQty.value,
          getBomLines,
          getMaterial,
          getProduct,
          getCurrentPrice,
          new Set(visitedProducts) // Pass copy to allow same product in different branches
        )

        // Merge nested requirements
        for (const req of nestedRequirements) {
          const existing = requirements.get(req.materialId)
          if (existing) {
            existing.totalQty += req.totalQty
            existing.costContribution += req.costContribution
          } else {
            requirements.set(req.materialId, { ...req })
          }
        }
      }
    }

    visitedProducts.delete(product.id)
    return Array.from(requirements.values())
  }

  /**
   * Calculate total cost from expanded requirements
   */
  static calculateTotalCost(requirements: ExpandedRequirement[]): number {
    return requirements.reduce((total, req) => total + req.costContribution, 0)
  }
}

