import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import type { Product } from '../../domain/entities/Product'

export interface CreateProductInput {
  type: 'middle' | 'final'
  name: string
  unit: string
  dimension: 'mass' | 'volume' | 'count'
  yieldQty: number
  description?: string
}

export interface CreateProductOutput {
  product: Product
}

/**
 * Use case: Create a new product
 */
export async function createProduct(
  input: CreateProductInput
): Promise<CreateProductOutput> {
  // Validate input
  if (!input.name || !input.name.trim()) {
    throw new Error('Product name is required')
  }

  if (!input.unit || !input.unit.trim()) {
    throw new Error('Product unit is required')
  }

  if (!input.dimension) {
    throw new Error('Product dimension is required')
  }

  if (input.yieldQty <= 0) {
    throw new Error('Yield quantity must be greater than 0')
  }

  // Validate yieldQty has max 5 decimals
  const decimals = getDecimalPlaces(input.yieldQty)
  if (decimals > 5) {
    throw new Error('Yield quantity cannot have more than 5 decimal places')
  }

  // Create product
  const product: Omit<Product, 'createdAt' | 'updatedAt'> = {
    id: generateId('prod'),
    type: input.type,
    name: input.name.trim(),
    unit: input.unit.trim(),
    dimension: input.dimension,
    yieldQty: input.yieldQty,
    description: input.description?.trim(),
    images: []
  }

  const productId = await productRepository.create(product)
  const createdProduct = await productRepository.getById(productId)

  if (!createdProduct) {
    throw new Error('Failed to retrieve created product')
  }

  return {
    product: createdProduct
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




