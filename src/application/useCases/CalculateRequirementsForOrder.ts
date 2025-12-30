import { RequirementsExpander } from '../../domain/services/RequirementsExpander'
import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import type { ExpandedRequirement } from '../../domain/services/RequirementsExpander'

export interface CalculateRequirementsForOrderInput {
  productId: string
  targetQuantity: number
  targetUnit: string
}

export interface CalculateRequirementsForOrderOutput {
  productName: string
  targetQuantity: number
  targetUnit: string
  totalCost: number
  requirements: ExpandedRequirement[]
  calculatedAt: Date
}

/**
 * Use case: Calculate required raw materials for producing N units of a product
 */
export async function calculateRequirementsForOrder(
  input: CalculateRequirementsForOrderInput
): Promise<CalculateRequirementsForOrderOutput> {
  // Get product
  const product = await productRepository.getById(input.productId)
  if (!product) {
    throw new Error(`Product with id ${input.productId} not found`)
  }

  // Convert target quantity to product's unit if needed
  const { UnitConverter } = await import('../../domain/services/UnitConverter')
  const { Quantity } = await import('../../domain/valueObjects/Quantity')
  
  let requiredQty = input.targetQuantity
  if (input.targetUnit !== product.unit) {
    // Convert to product unit
    const quantity = Quantity.create(input.targetQuantity, input.targetUnit, product.dimension)
    const converted = UnitConverter.convert(quantity, product.unit)
    requiredQty = converted.value
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

  // Expand BOM to raw materials
  const requirements = await RequirementsExpander.expand(
    product,
    requiredQty,
    getBomLines,
    getMaterial,
    getProduct,
    getCurrentPrice
  )

  // Calculate total cost
  const totalCost = RequirementsExpander.calculateTotalCost(requirements)

  return {
    productName: product.name,
    targetQuantity: input.targetQuantity,
    targetUnit: input.targetUnit,
    totalCost: Math.round(totalCost),
    requirements,
    calculatedAt: new Date()
  }
}

