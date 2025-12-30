import { bomRepository } from '../../infrastructure/repositories/BomRepository'

export interface DeleteBomLineInput {
  lineId: string
}

export interface DeleteBomLineOutput {
  success: boolean
}

/**
 * Use case: Delete a BOM line
 */
export async function deleteBomLine(
  input: DeleteBomLineInput
): Promise<DeleteBomLineOutput> {
  await bomRepository.deleteLine(input.lineId)
  return {
    success: true
  }
}

