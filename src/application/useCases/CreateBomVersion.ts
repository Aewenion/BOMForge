import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import type { BomVersion } from '../../domain/entities/Bom'

export interface CreateBomVersionInput {
  productId: string
  notes?: string
}

export interface CreateBomVersionOutput {
  bomVersion: BomVersion
}

/**
 * Use case: Create a new BOM version for a product
 */
export async function createBomVersion(
  input: CreateBomVersionInput
): Promise<CreateBomVersionOutput> {
  // Validate product exists
  const product = await productRepository.getById(input.productId)
  if (!product) {
    throw new Error(`Product with id ${input.productId} not found`)
  }

  // Get next version number
  const versionNumber = await bomRepository.getNextVersionNumber(input.productId)

  // Create BOM version
  const bomVersion: Omit<BomVersion, 'createdAt'> = {
    id: generateId('bom'),
    productId: input.productId,
    versionNumber,
    notes: input.notes?.trim()
  }

  const versionId = await bomRepository.createVersion(bomVersion)
  const createdVersion = await bomRepository.getVersionById(versionId)

  if (!createdVersion) {
    throw new Error('Failed to retrieve created BOM version')
  }

  return {
    bomVersion: createdVersion
  }
}


