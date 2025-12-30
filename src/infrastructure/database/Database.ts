import Dexie, { Table } from 'dexie'
import type { Material, MaterialPrice } from '../../domain/entities/Material'
import type { Product, ProductImage } from '../../domain/entities/Product'
import type { BomVersion, BomLine, ProductDependency } from '../../domain/entities/Bom'

/**
 * Database types with Date serialization
 * Dexie stores dates as numbers (timestamps), so we need to handle conversion
 */
type MaterialDB = Omit<Material, 'createdAt' | 'updatedAt'> & {
  createdAt: number
  updatedAt: number
}

type MaterialPriceDB = Omit<MaterialPrice, 'createdAt' | 'effectiveFrom' | 'effectiveTo'> & {
  createdAt: number
  effectiveFrom: number
  effectiveTo?: number
}

type ProductDB = Omit<Product, 'createdAt' | 'updatedAt' | 'images'> & {
  createdAt: number
  updatedAt: number
}

type ProductImageDB = Omit<ProductImage, 'createdAt'> & {
  createdAt: number
}

type BomVersionDB = Omit<BomVersion, 'createdAt'> & {
  createdAt: number
}

type ProductDependencyDB = Omit<ProductDependency, 'createdAt'> & {
  createdAt: number
}

/**
 * Database schema definition using Dexie
 * Version 1: Initial schema
 */
export class BOMForgeDatabase extends Dexie {
  materials!: Table<MaterialDB, string>
  materialPrices!: Table<MaterialPriceDB, string>
  products!: Table<ProductDB, string>
  productImages!: Table<ProductImageDB, string>
  bomVersions!: Table<BomVersionDB, string>
  bomLines!: Table<BomLine, string>
  productDependencies!: Table<ProductDependencyDB, string>

  constructor() {
    super('BOMForgeDB')

    // Version 1: Initial schema
    this.version(1).stores({
      materials: 'id, name, dimension, createdAt',
      materialPrices: 'id, materialId, effectiveFrom, effectiveTo, [materialId+effectiveFrom]',
      products: 'id, type, name, dimension, currentBomVersionId, createdAt',
      productImages: 'id, productId, createdAt',
      bomVersions: 'id, productId, versionNumber, [productId+versionNumber], createdAt',
      bomLines: 'id, bomVersionId, inputType, inputId, [bomVersionId+sortOrder]',
      productDependencies: 'id, productId, dependsOnType, dependsOnId, [productId+dependsOnType+dependsOnId]'
    })
  }
}

// Singleton instance
export const db = new BOMForgeDatabase()

// Export for use in repositories
export default db

