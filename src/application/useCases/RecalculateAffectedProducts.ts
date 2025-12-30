import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { calculateProductCost } from './CalculateProductCost'

export interface RecalculateAffectedProductsInput {
  materialId?: string
  productId?: string
}

export interface RecalculateAffectedProductsOutput {
  recalculatedCount: number
  affectedProductIds: string[]
}

/**
 * Use case: Recalculate costs for products affected by a change
 * Triggers when:
 * - Material price is updated
 * - Product BOM current version changes
 * - Nested product changes
 */
export async function recalculateAffectedProducts(
  input: RecalculateAffectedProductsInput
): Promise<RecalculateAffectedProductsOutput> {
  const affectedProductIds: string[] = []

  if (input.materialId) {
    // Find all products that depend on this material
    const dependentProducts = await bomRepository.getProductsDependingOn('material', input.materialId)
    affectedProductIds.push(...dependentProducts)
  }

  if (input.productId) {
    // Find all products that depend on this product
    const dependentProducts = await bomRepository.getProductsDependingOn('product', input.productId)
    affectedProductIds.push(...dependentProducts)
    
    // Also include the product itself if it has a BOM
    const product = await productRepository.getById(input.productId)
    if (product && product.currentBomVersionId) {
      affectedProductIds.push(input.productId)
    }
  }

  // Remove duplicates
  const uniqueProductIds = [...new Set(affectedProductIds)]

  // Recalculate costs for all affected products
  for (const productId of uniqueProductIds) {
    try {
      await calculateProductCost({ productId })
    } catch (err) {
      // Log error but continue with other products
      console.error(`Failed to recalculate cost for product ${productId}:`, err)
    }
  }

  return {
    recalculatedCount: uniqueProductIds.length,
    affectedProductIds: uniqueProductIds
  }
}


