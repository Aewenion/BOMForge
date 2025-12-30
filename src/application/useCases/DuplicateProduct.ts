import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { bomRepository } from '../../infrastructure/repositories/BomRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import type { Product } from '../../domain/entities/Product'

export interface DuplicateProductInput {
  productId: string
  newName?: string
  duplicateBom?: boolean
}

export interface DuplicateProductOutput {
  newProduct: Product
  bomDuplicated: boolean
}

/**
 * Use case: Duplicate a product (and optionally its BOM)
 */
export async function duplicateProduct(
  input: DuplicateProductInput
): Promise<DuplicateProductOutput> {
  // Get original product
  const original = await productRepository.getById(input.productId)
  if (!original) {
    throw new Error(`Product with id ${input.productId} not found`)
  }

  // Create new product
  const newProduct: Omit<Product, 'createdAt' | 'updatedAt'> = {
    id: generateId('prod'),
    type: original.type,
    name: input.newName || `${original.name} (کپی)`,
    unit: original.unit,
    dimension: original.dimension,
    yieldQty: original.yieldQty,
    description: original.description,
    images: [], // Don't duplicate images
    currentBomVersionId: undefined // Will be set if BOM is duplicated
  }

  const newProductId = await productRepository.create(newProduct)
  let bomDuplicated = false

  // Duplicate BOM if requested and original has one
  if (input.duplicateBom && original.currentBomVersionId) {
    // Get original BOM version and lines
    const originalVersion = await bomRepository.getVersionById(original.currentBomVersionId)
    if (originalVersion) {
      const originalLines = await bomRepository.getLinesByVersionId(original.currentBomVersionId)

      // Create new BOM version
      const newVersionId = generateId('bom')
      await bomRepository.createVersion({
        id: newVersionId,
        productId: newProductId,
        versionNumber: 1,
        notes: `Duplicated from ${original.name}`
      })

      // Copy all lines
      for (let i = 0; i < originalLines.length; i++) {
        const originalLine = originalLines[i]
        await bomRepository.addLine({
          id: generateId('line'),
          bomVersionId: newVersionId,
          inputType: originalLine.inputType,
          inputId: originalLine.inputId,
          qty: originalLine.qty,
          unit: originalLine.unit,
          wastePct: originalLine.wastePct,
          sortOrder: i
        })
      }

      // Set as current version
      await bomRepository.setCurrentVersion(newProductId, newVersionId)
      bomDuplicated = true
    }
  }

  const createdProduct = await productRepository.getById(newProductId)
  if (!createdProduct) {
    throw new Error('Failed to retrieve created product')
  }

  return {
    newProduct: createdProduct,
    bomDuplicated
  }
}


