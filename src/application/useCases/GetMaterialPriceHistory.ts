import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import type { MaterialPrice } from '../../domain/entities/Material'

export interface GetMaterialPriceHistoryInput {
  materialId: string
}

export interface GetMaterialPriceHistoryOutput {
  prices: MaterialPrice[]
  currentPrice?: MaterialPrice
}

/**
 * Use case: Get price history for a material
 */
export async function getMaterialPriceHistory(
  input: GetMaterialPriceHistoryInput
): Promise<GetMaterialPriceHistoryOutput> {
  // Validate material exists
  const material = await materialRepository.getById(input.materialId)
  if (!material) {
    throw new Error(`Material with id ${input.materialId} not found`)
  }

  // Get price history
  const prices = await materialRepository.getPriceHistory(input.materialId)
  const currentPrice = await materialRepository.getCurrentPrice(input.materialId)

  return {
    prices,
    currentPrice: currentPrice || undefined
  }
}


