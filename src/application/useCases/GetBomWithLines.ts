import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import type { BomVersion, BomLine } from '../../domain/entities/Bom'

export interface GetBomWithLinesInput {
  bomVersionId: string
}

export interface GetBomWithLinesOutput {
  version: BomVersion
  lines: BomLine[]
}

/**
 * Use case: Get a BOM version with all its lines
 */
export async function getBomWithLines(
  input: GetBomWithLinesInput
): Promise<GetBomWithLinesOutput> {
  const result = await bomRepository.getVersionWithLines(input.bomVersionId)

  if (!result) {
    throw new Error(`BOM version with id ${input.bomVersionId} not found`)
  }

  return result
}



