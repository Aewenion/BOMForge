/**
 * BomVersion entity - represents a version of a BOM (immutable snapshot)
 */
export interface BomVersion {
  id: string
  productId: string
  versionNumber: number
  createdAt: Date
  notes?: string
}

/**
 * BomLine entity - represents a line item in a BOM
 */
export interface BomLine {
  id: string
  bomVersionId: string
  inputType: 'material' | 'product'
  inputId: string // ID of material or product
  qty: number // decimal up to 5 decimals (e.g., 0.00001)
  unit: string
  wastePct?: number // optional waste percentage
  sortOrder: number
}

/**
 * ProductDependency entity - dependency index for fast recalculation
 * Tracks which products depend on which materials/products
 */
export interface ProductDependency {
  id: string
  productId: string // the product whose BOM contains something
  dependsOnType: 'material' | 'product'
  dependsOnId: string // ID of material or product it depends on
  createdAt: Date
}





