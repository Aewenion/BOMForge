import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { BomValidator } from '../../domain/services/BomValidator'

export interface SetCurrentBomVersionInput {
  productId: string
  bomVersionId: string
}

export interface SetCurrentBomVersionOutput {
  success: boolean
}

/**
 * Use case: Set a BOM version as current for a product
 * This also rebuilds the dependency index
 */
export async function setCurrentBomVersion(
  input: SetCurrentBomVersionInput
): Promise<SetCurrentBomVersionOutput> {
  // Validate product exists
  const product = await productRepository.getById(input.productId)
  if (!product) {
    throw new Error(`Product with id ${input.productId} not found`)
  }

  // Validate BOM version exists and belongs to product
  const bomVersion = await bomRepository.getVersionById(input.bomVersionId)
  if (!bomVersion) {
    throw new Error(`BOM version with id ${input.bomVersionId} not found`)
  }

  if (bomVersion.productId !== input.productId) {
    throw new Error('BOM version does not belong to this product')
  }

  // Get BOM lines
  const lines = await bomRepository.getLinesByVersionId(input.bomVersionId)

  // Validate BOM (cycle detection and unit compatibility)
  const getProduct = async (id: string) => await productRepository.getById(id)
  const getBomLines = async (productId: string) => {
    const prod = await productRepository.getById(productId)
    if (!prod || !prod.currentBomVersionId) return []
    return await bomRepository.getLinesByVersionId(prod.currentBomVersionId)
  }

  // Check for cycles (using current versions of nested products)
  const cycles = await BomValidator.detectCycles(
    input.productId,
    lines,
    getProduct,
    getBomLines
  )

  if (cycles.length > 0) {
    const cyclePaths = cycles.map(c => c.join(' → ')).join(', ')
    throw new Error(`Cycle detected in BOM: ${cyclePaths}`)
  }

  // Validate all lines
  const getInput = async (type: 'material' | 'product', id: string) => {
    if (type === 'material') {
      const { materialRepository } = await import('../../infrastructure/repositories/MaterialRepository')
      return await materialRepository.getById(id)
    } else {
      return await productRepository.getById(id)
    }
  }

  const validation = await BomValidator.validateBomLines(lines, getInput)
  if (!validation.valid) {
    throw new Error(`BOM validation failed: ${validation.errors.join(', ')}`)
  }

  // Set as current version
  await bomRepository.setCurrentVersion(input.productId, input.bomVersionId)

  // Rebuild dependency index
  await bomRepository.rebuildDependenciesForProduct(input.productId)

  return {
    success: true
  }
}

