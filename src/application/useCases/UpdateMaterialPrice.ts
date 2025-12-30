import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import { recalculateAffectedProducts } from './RecalculateAffectedProducts'
import type { MaterialPrice } from '../../domain/entities/Material'

export interface UpdateMaterialPriceInput {
  materialId: string
  priceToman: number
  effectiveFrom: Date
}

export interface UpdateMaterialPriceOutput {
  newPrice: MaterialPrice
  previousPrice?: MaterialPrice
}

/**
 * Use case: Update material price
 * This closes the previous current price and creates a new one
 */
export async function updateMaterialPrice(
  input: UpdateMaterialPriceInput
): Promise<UpdateMaterialPriceOutput> {
  // Validate material exists
  const material = await materialRepository.getById(input.materialId)
  if (!material) {
    throw new Error(`Material with id ${input.materialId} not found`)
  }

  // Validate price
  if (input.priceToman < 0 || !Number.isInteger(input.priceToman)) {
    throw new Error('Price must be a non-negative integer (Toman)')
  }

  // Get current price (if exists)
  const currentPrice = await materialRepository.getCurrentPrice(input.materialId)

  // Update price (repository handles closing previous and creating new)
  const newPriceId = await materialRepository.updatePrice(input.materialId, {
    priceToman: input.priceToman,
    effectiveFrom: input.effectiveFrom
  })

  const newPrice = await materialRepository.getPriceHistory(input.materialId)
    .then(prices => prices.find(p => p.id === newPriceId))

  if (!newPrice) {
    throw new Error('Failed to retrieve new price record')
  }

  // Trigger recalculation for affected products (async, don't wait)
  recalculateAffectedProducts({ materialId: input.materialId }).catch(err => {
    console.error('Failed to recalculate affected products:', err)
  })

  return {
    newPrice,
    previousPrice: currentPrice || undefined
  }
}



