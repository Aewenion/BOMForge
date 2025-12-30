import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import { processImage } from '../../infrastructure/utils/imageCompression'
import type { ProductImage } from '../../domain/entities/Product'

export interface AddProductImageInput {
  productId: string
  file: File
}

export interface AddProductImageOutput {
  image: ProductImage
}

/**
 * Use case: Add an image to a product (max 3 images)
 */
export async function addProductImage(
  input: AddProductImageInput
): Promise<AddProductImageOutput> {
  // Validate product exists
  const product = await productRepository.getById(input.productId)
  if (!product) {
    throw new Error(`Product with id ${input.productId} not found`)
  }

  // Check current image count
  const currentImages = await productRepository.getImagesByProductId(input.productId)
  if (currentImages.length >= 3) {
    throw new Error('Product can have at most 3 images')
  }

  // Process image (compress and generate thumbnail)
  const processed = await processImage(input.file)

  // Create image entity
  const image: Omit<ProductImage, 'createdAt'> = {
    id: generateId('img'),
    productId: input.productId,
    blob: processed.compressed,
    thumbnail: processed.thumbnail,
    mimeType: processed.mimeType,
    size: processed.size
  }

  // Add image
  const imageId = await productRepository.addImage(image)
  const createdImage = await productRepository.getImageById(imageId)

  if (!createdImage) {
    throw new Error('Failed to retrieve created image')
  }

  return {
    image: createdImage
  }
}


