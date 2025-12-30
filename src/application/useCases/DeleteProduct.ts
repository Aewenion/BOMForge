import { productRepository } from '../../infrastructure/repositories/ProductRepository'

export interface DeleteProductInput {
  id: string
}

export interface DeleteProductOutput {
  success: boolean
}

/**
 * Use case: Delete a product
 */
export async function deleteProduct(
  input: DeleteProductInput
): Promise<DeleteProductOutput> {
  // Validate product exists
  const existing = await productRepository.getById(input.id)
  if (!existing) {
    throw new Error(`Product with id ${input.id} not found`)
  }

  // Delete product (repository handles cascading deletes for images, BOMs, etc.)
  await productRepository.delete(input.id)

  return {
    success: true
  }
}


