import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { BomValidator } from '../../domain/services/BomValidator'
import type { BomLine } from '../../domain/entities/Bom'

export interface UpdateBomLineInput {
  lineId: string
  qty?: number
  unit?: string
  wastePct?: number
  sortOrder?: number
}

export interface UpdateBomLineOutput {
  bomLine: BomLine
}

/**
 * Use case: Update a BOM line
 */
export async function updateBomLine(
  input: UpdateBomLineInput
): Promise<UpdateBomLineOutput> {
  // Get existing line
  const line = await bomRepository.getLineById(input.lineId)

  if (!line) {
    throw new Error(`BOM line with id ${input.lineId} not found`)
  }

  // Get BOM version to validate
  const bomVersion = await bomRepository.getVersionById(line.bomVersionId)
  if (!bomVersion) {
    throw new Error('BOM version not found')
  }

  // Get input entity for validation
  let inputEntity
  if (line.inputType === 'material') {
    inputEntity = await materialRepository.getById(line.inputId)
  } else {
    inputEntity = await productRepository.getById(line.inputId)
  }

  if (!inputEntity) {
    throw new Error('Input entity not found')
  }

  // Prepare updates
  const updates: Partial<Omit<BomLine, 'id' | 'bomVersionId' | 'inputType' | 'inputId'>> = {}

  if (input.qty !== undefined) {
    // Validate quantity
    const quantityValidation = BomValidator.validateQuantity({
      ...line,
      qty: input.qty
    })
    if (!quantityValidation.valid) {
      throw new Error(quantityValidation.error || 'Invalid quantity')
    }
    updates.qty = input.qty
  }

  if (input.unit !== undefined) {
    // Validate unit compatibility
    const unitValidation = BomValidator.validateUnitCompatibility(
      {
        ...line,
        unit: input.unit
      },
      inputEntity
    )
    if (!unitValidation.valid) {
      throw new Error(unitValidation.error || 'Unit incompatibility')
    }
    updates.unit = input.unit
  }

  if (input.wastePct !== undefined) {
    updates.wastePct = input.wastePct
  }

  if (input.sortOrder !== undefined) {
    updates.sortOrder = input.sortOrder
  }

  // Update line
  await bomRepository.updateLine(input.lineId, updates)

  // Get updated line
  const updatedLines = await bomRepository.getLinesByVersionId(line.bomVersionId)
  const updatedLine = updatedLines.find(l => l.id === input.lineId)

  if (!updatedLine) {
    throw new Error('Failed to retrieve updated BOM line')
  }

  return {
    bomLine: updatedLine
  }
}

