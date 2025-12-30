import { productRepository } from '../../infrastructure/repositories/ProductRepository'

export interface DeleteProductImageInput {
  imageId: string
}

export interface DeleteProductImageOutput {
  success: boolean
}

/**
 * Use case: Delete a product image
 */
export async function deleteProductImage(
  input: DeleteProductImageInput
): Promise<DeleteProductImageOutput> {
  // Validate image exists
  const existing = await productRepository.getImageById(input.imageId)
  if (!existing) {
    throw new Error(`Image with id ${input.imageId} not found`)
  }

  // Delete image
  await productRepository.deleteImage(input.imageId)

  return {
    success: true
  }
}


