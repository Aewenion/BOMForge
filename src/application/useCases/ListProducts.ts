import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import type { Product } from '../../domain/entities/Product'

export interface ListProductsInput {
  searchQuery?: string
  type?: 'middle' | 'final'
}

export interface ListProductsOutput {
  products: Product[]
}

/**
 * Use case: List all products, optionally filtered by search query and type
 */
export async function listProducts(
  input: ListProductsInput = {}
): Promise<ListProductsOutput> {
  let products: Product[]

  if (input.type) {
    products = await productRepository.getByType(input.type)
  } else {
    products = await productRepository.getAll()
  }

  // Apply search filter if provided
  if (input.searchQuery && input.searchQuery.trim()) {
    const query = input.searchQuery.trim().toLowerCase()
    products = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }

  return {
    products
  }
}



