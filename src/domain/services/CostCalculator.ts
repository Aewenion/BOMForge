import { RequirementsExpander } from './RequirementsExpander'
import type { Product } from '../entities/Product'
import type { BomLine } from '../entities/Bom'
import type { Material, MaterialPrice } from '../entities/Material'

/**
 * Cost breakdown for a product
 */
export interface CostBreakdown {
  productId: string
  productName: string
  totalCost: number // Total cost in Toman (materials-only)
  requirements: RequirementsExpander.ExpandedRequirement[]
  calculatedAt: Date
}

/**
 * CostCalculator domain service
 * Calculates materials-only cost for products
 */
export class CostCalculator {
  /**
   * Calculate cost for a product (materials-only)
   */
  static async calculateCost(
    product: Product,
    getBomLines: (bomVersionId: string) => Promise<BomLine[]>,
    getMaterial: (id: string) => Promise<Material | undefined>,
    getProduct: (id: string) => Promise<Product | undefined>,
    getCurrentPrice: (materialId: string) => Promise<MaterialPrice | undefined>
  ): Promise<CostBreakdown> {
    // If product has no BOM, cost is 0
    if (!product.currentBomVersionId) {
      return {
        productId: product.id,
        productName: product.name,
        totalCost: 0,
        requirements: [],
        calculatedAt: new Date()
      }
    }

    // Expand BOM to raw materials (for 1 unit of yield)
    const requirements = await RequirementsExpander.expand(
      product,
      product.yieldQty, // Calculate cost for yield quantity
      getBomLines,
      getMaterial,
      getProduct,
      getCurrentPrice
    )

    // Calculate total cost
    const totalCost = RequirementsExpander.calculateTotalCost(requirements)

    return {
      productId: product.id,
      productName: product.name,
      totalCost: Math.round(totalCost), // Round to integer (Toman)
      requirements,
      calculatedAt: new Date()
    }
  }

  /**
   * Calculate cost per unit (based on yield)
   */
  static calculateCostPerUnit(costBreakdown: CostBreakdown, yieldQty: number): number {
    if (yieldQty === 0) return 0
    return Math.round(costBreakdown.totalCost / yieldQty)
  }
}



