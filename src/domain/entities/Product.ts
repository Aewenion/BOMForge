/**
 * Product entity - represents a product (middle or final)
 */
export interface Product {
  id: string
  type: 'middle' | 'final'
  name: string
  unit: string // product unit (e.g., 'L', 'ml', 'kg', 'g', 'unit')
  dimension: 'mass' | 'volume' | 'count'
  yieldQty: number // recipe basis quantity in product unit (e.g., 1 L)
  description?: string
  images: ProductImage[] // up to 3 images
  currentBomVersionId?: string
  computedCostMaterialsOnly?: number // cached cost (in Toman)
  computedPrice?: number // optional: cost + margin (in Toman)
  createdAt: Date
  updatedAt: Date
}

/**
 * ProductImage entity - represents an image attached to a product
 */
export interface ProductImage {
  id: string
  productId: string
  blob: Blob // compressed image blob (≤ ~1MB)
  thumbnail: Blob // thumbnail for lists
  mimeType: string
  size: number // size in bytes
  createdAt: Date
}

