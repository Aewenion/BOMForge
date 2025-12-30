import { CostCalculator } from '../../domain/services/CostCalculator'
import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import type { CostBreakdown } from '../../domain/services/CostCalculator'

export interface CalculateProductCostInput {
  productId: string
}

export interface CalculateProductCostOutput {
  costBreakdown: CostBreakdown
}

/**
 * Use case: Calculate cost for a product
 */
export async function calculateProductCost(
  input: CalculateProductCostInput
): Promise<CalculateProductCostOutput> {
  // Get product
  const product = await productRepository.getById(input.productId)
  if (!product) {
    throw new Error(`Product with id ${input.productId} not found`)
  }

  // Create helper functions
  const getBomLines = async (bomVersionId: string) => {
    return await bomRepository.getLinesByVersionId(bomVersionId)
  }

  const getMaterial = async (id: string) => {
    return await materialRepository.getById(id)
  }

  const getProduct = async (id: string) => {
    return await productRepository.getById(id)
  }

  const getCurrentPrice = async (materialId: string) => {
    return await materialRepository.getCurrentPrice(materialId)
  }

  // Calculate cost
  const costBreakdown = await CostCalculator.calculateCost(
    product,
    getBomLines,
    getMaterial,
    getProduct,
    getCurrentPrice
  )

  // Update cached cost on product
  await productRepository.update(product.id, {
    computedCostMaterialsOnly: costBreakdown.totalCost
  })

  return {
    costBreakdown
  }
}


