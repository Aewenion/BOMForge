import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import type { Product } from '../../domain/entities/Product'

export interface UpdateProductInput {
  id: string
  type?: 'middle' | 'final'
  name?: string
  unit?: string
  dimension?: 'mass' | 'volume' | 'count'
  yieldQty?: number
  description?: string
}

export interface UpdateProductOutput {
  product: Product
}

/**
 * Use case: Update an existing product
 */
export async function updateProduct(
  input: UpdateProductInput
): Promise<UpdateProductOutput> {
  // Validate product exists
  const existing = await productRepository.getById(input.id)
  if (!existing) {
    throw new Error(`Product with id ${input.id} not found`)
  }

  // Prepare updates
  const updates: Partial<Omit<Product, 'id' | 'createdAt' | 'images'>> = {}

  if (input.type !== undefined) {
    updates.type = input.type
  }

  if (input.name !== undefined) {
    if (!input.name || !input.name.trim()) {
      throw new Error('Product name cannot be empty')
    }
    updates.name = input.name.trim()
  }

  if (input.unit !== undefined) {
    if (!input.unit || !input.unit.trim()) {
      throw new Error('Product unit cannot be empty')
    }
    updates.unit = input.unit.trim()
  }

  if (input.dimension !== undefined) {
    updates.dimension = input.dimension
  }

  if (input.yieldQty !== undefined) {
    if (input.yieldQty <= 0) {
      throw new Error('Yield quantity must be greater than 0')
    }
    const decimals = getDecimalPlaces(input.yieldQty)
    if (decimals > 5) {
      throw new Error('Yield quantity cannot have more than 5 decimal places')
    }
    updates.yieldQty = input.yieldQty
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim()
  }

  // Update product
  await productRepository.update(input.id, updates)

  const updatedProduct = await productRepository.getById(input.id)
  if (!updatedProduct) {
    throw new Error('Failed to retrieve updated product')
  }

  return {
    product: updatedProduct
  }
}

function getDecimalPlaces(num: number): number {
  if (Math.floor(num) === num) return 0
  const str = num.toString()
  if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
    return str.split('.')[1].length
  } else if (str.indexOf('e-') !== -1) {
    const parts = str.split('e-')
    return parseInt(parts[1], 10) + (parts[0].split('.')[1] || '').length
  }
  return 0
}




