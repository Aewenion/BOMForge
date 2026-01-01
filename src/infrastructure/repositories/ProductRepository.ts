import { db } from '../database/Database'
import type { Product, ProductImage } from '../../domain/entities/Product'
import { dateToTimestamp, timestampToDate } from '../utils/dateConverter'

/**
 * Repository for Product and ProductImage entities
 */
export class ProductRepository {
  /**
   * Create a new product
   */
  async create(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    await db.products.add({
      ...product,
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now)
    })
    return product.id
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | undefined> {
    const product = await db.products.get(id)
    if (!product) return undefined

    // Load images
    const images = await db.productImages.where('productId').equals(id).toArray()
    const imagesWithDates = images.map(img => ({
      ...img,
      createdAt: timestampToDate(img.createdAt)
    }))
    
    return {
      ...product,
      createdAt: timestampToDate(product.createdAt),
      updatedAt: timestampToDate(product.updatedAt),
      images: imagesWithDates
    }
  }

  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const products = await db.products.toArray()
    // Load images for all products
    const productIds = products.map(p => p.id)
    const allImages = await db.productImages
      .where('productId')
      .anyOf(productIds)
      .toArray()

    const imagesByProductId = new Map<string, ProductImage[]>()
    for (const image of allImages) {
      const existing = imagesByProductId.get(image.productId) || []
      existing.push({
        ...image,
        createdAt: timestampToDate(image.createdAt)
      })
      imagesByProductId.set(image.productId, existing)
    }

    return products.map(product => ({
      ...product,
      createdAt: timestampToDate(product.createdAt),
      updatedAt: timestampToDate(product.updatedAt),
      images: imagesByProductId.get(product.id) || []
    }))
  }

  /**
   * Update product
   */
  async update(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'images'>>): Promise<void> {
    await db.products.update(id, {
      ...updates,
      updatedAt: dateToTimestamp(new Date())
    })
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    // Also delete associated images, BOMs, and dependencies
    await db.productImages.where('productId').equals(id).delete()
    const bomVersions = await db.bomVersions.where('productId').equals(id).toArray()
    const bomVersionIds = bomVersions.map(bv => bv.id)
    await db.bomLines.where('bomVersionId').anyOf(bomVersionIds).delete()
    await db.bomVersions.where('productId').equals(id).delete()
    await db.productDependencies.where('productId').equals(id).delete()
    await db.products.delete(id)
  }

  /**
   * Search products by name
   */
  async searchByName(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase()
    const products = await db.products
      .filter(p => p.name.toLowerCase().includes(lowerQuery))
      .toArray()

    // Load images
    const productIds = products.map(p => p.id)
    const allImages = await db.productImages
      .where('productId')
      .anyOf(productIds)
      .toArray()

    const imagesByProductId = new Map<string, ProductImage[]>()
    for (const image of allImages) {
      const existing = imagesByProductId.get(image.productId) || []
      existing.push({
        ...image,
        createdAt: timestampToDate(image.createdAt)
      })
      imagesByProductId.set(image.productId, existing)
    }

    return products.map(product => ({
      ...product,
      createdAt: timestampToDate(product.createdAt),
      updatedAt: timestampToDate(product.updatedAt),
      images: imagesByProductId.get(product.id) || []
    }))
  }

  /**
   * Get products by type
   */
  async getByType(type: 'middle' | 'final'): Promise<Product[]> {
    const products = await db.products.where('type').equals(type).toArray()
    
    // Load images
    const productIds = products.map(p => p.id)
    const allImages = await db.productImages
      .where('productId')
      .anyOf(productIds)
      .toArray()

    const imagesByProductId = new Map<string, ProductImage[]>()
    for (const image of allImages) {
      const existing = imagesByProductId.get(image.productId) || []
      existing.push({
        ...image,
        createdAt: timestampToDate(image.createdAt)
      })
      imagesByProductId.set(image.productId, existing)
    }

    return products.map(product => ({
      ...product,
      createdAt: timestampToDate(product.createdAt),
      updatedAt: timestampToDate(product.updatedAt),
      images: imagesByProductId.get(product.id) || []
    }))
  }

  // ProductImage methods

  /**
   * Add an image to a product
   */
  async addImage(image: Omit<ProductImage, 'createdAt'>): Promise<string> {
    // Check if product already has 3 images
    const existingImages = await db.productImages.where('productId').equals(image.productId).count()
    if (existingImages >= 3) {
      throw new Error('Product can have at most 3 images')
    }

    await db.productImages.add({
      ...image,
      createdAt: dateToTimestamp(new Date())
    })
    return image.id
  }

  /**
   * Get image by ID
   */
  async getImageById(id: string): Promise<ProductImage | undefined> {
    const image = await db.productImages.get(id)
    if (!image) return undefined
    return {
      ...image,
      createdAt: timestampToDate(image.createdAt)
    }
  }

  /**
   * Get all images for a product
   */
  async getImagesByProductId(productId: string): Promise<ProductImage[]> {
    const images = await db.productImages.where('productId').equals(productId).toArray()
    return images.map(img => ({
      ...img,
      createdAt: timestampToDate(img.createdAt)
    }))
  }

  /**
   * Delete image
   */
  async deleteImage(id: string): Promise<void> {
    await db.productImages.delete(id)
  }

  /**
   * Delete all images for a product
   */
  async deleteImagesByProductId(productId: string): Promise<void> {
    await db.productImages.where('productId').equals(productId).delete()
  }
}

export const productRepository = new ProductRepository()

