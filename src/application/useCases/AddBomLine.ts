import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { BomValidator } from '../../domain/services/BomValidator'
import { generateId } from '../../infrastructure/utils/idGenerator'
import type { BomLine } from '../../domain/entities/Bom'

export interface AddBomLineInput {
  bomVersionId: string
  inputType: 'material' | 'product'
  inputId: string
  qty: number
  unit: string
  wastePct?: number
  sortOrder: number
}

export interface AddBomLineOutput {
  bomLine: BomLine
}

/**
 * Use case: Add a line to a BOM version
 */
export async function addBomLine(
  input: AddBomLineInput
): Promise<AddBomLineOutput> {
  // Validate BOM version exists
  const bomVersion = await bomRepository.getVersionById(input.bomVersionId)
  if (!bomVersion) {
    throw new Error(`BOM version with id ${input.bomVersionId} not found`)
  }

  // Get input (material or product)
  let inputEntity
  if (input.inputType === 'material') {
    inputEntity = await materialRepository.getById(input.inputId)
  } else {
    inputEntity = await productRepository.getById(input.inputId)
  }

  if (!inputEntity) {
    throw new Error(`${input.inputType} with id ${input.inputId} not found`)
  }

  // Validate quantity
  const quantityValidation = BomValidator.validateQuantity({
    id: '',
    bomVersionId: input.bomVersionId,
    inputType: input.inputType,
    inputId: input.inputId,
    qty: input.qty,
    unit: input.unit,
    sortOrder: input.sortOrder
  })

  if (!quantityValidation.valid) {
    throw new Error(quantityValidation.error || 'Invalid quantity')
  }

  // Validate unit compatibility
  const unitValidation = BomValidator.validateUnitCompatibility(
    {
      id: '',
      bomVersionId: input.bomVersionId,
      inputType: input.inputType,
      inputId: input.inputId,
      qty: input.qty,
      unit: input.unit,
      sortOrder: input.sortOrder
    },
    inputEntity
  )

  if (!unitValidation.valid) {
    throw new Error(unitValidation.error || 'Unit incompatibility')
  }

  // Create BOM line
  const bomLine: BomLine = {
    id: generateId('line'),
    bomVersionId: input.bomVersionId,
    inputType: input.inputType,
    inputId: input.inputId,
    qty: input.qty,
    unit: input.unit,
    wastePct: input.wastePct,
    sortOrder: input.sortOrder
  }

  const lineId = await bomRepository.addLine(bomLine)
  const createdLine = await bomRepository.getLinesByVersionId(input.bomVersionId)
    .then(lines => lines.find(l => l.id === lineId))

  if (!createdLine) {
    throw new Error('Failed to retrieve created BOM line')
  }

  return {
    bomLine: createdLine
  }
}


