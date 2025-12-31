import { bomRepository } from '../../infrastructure/repositories/BomRepository'

export interface ReorderBomLinesInput {
  bomVersionId: string
  lineOrders: { lineId: string; sortOrder: number }[]
}

export interface ReorderBomLinesOutput {
  success: boolean
}

/**
 * Use case: Reorder BOM lines
 */
export async function reorderBomLines(
  input: ReorderBomLinesInput
): Promise<ReorderBomLinesOutput> {
  await bomRepository.reorderLines(input.lineOrders)
  return {
    success: true
  }
}



