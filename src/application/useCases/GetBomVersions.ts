import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import type { BomVersion } from '../../domain/entities/Bom'

export interface GetBomVersionsInput {
  productId: string
}

export interface GetBomVersionsOutput {
  versions: BomVersion[]
  currentVersion?: BomVersion
}

/**
 * Use case: Get all BOM versions for a product
 */
export async function getBomVersions(
  input: GetBomVersionsInput
): Promise<GetBomVersionsOutput> {
  const versions = await bomRepository.getVersionsByProductId(input.productId)
  const currentVersion = await bomRepository.getCurrentVersion(input.productId)

  return {
    versions,
    currentVersion: currentVersion || undefined
  }
}

