import { db } from '../database/Database'
import type { Material, MaterialPrice } from '../../domain/entities/Material'
import { 
  dateToTimestamp, 
  timestampToDate, 
  dateToTimestampOptional, 
  timestampToDateOptional 
} from '../utils/dateConverter'

/**
 * Repository for Material and MaterialPrice entities
 */
export class MaterialRepository {
  /**
   * Create a new material
   */
  async create(material: Omit<Material, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    await db.materials.add({
      ...material,
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now)
    })
    return material.id
  }

  /**
   * Get material by ID
   */
  async getById(id: string): Promise<Material | undefined> {
    const material = await db.materials.get(id)
    if (!material) return undefined
    return {
      ...material,
      createdAt: timestampToDate(material.createdAt),
      updatedAt: timestampToDate(material.updatedAt)
    }
  }

  /**
   * Get all materials
   */
  async getAll(): Promise<Material[]> {
    const materials = await db.materials.toArray()
    return materials.map(m => ({
      ...m,
      createdAt: timestampToDate(m.createdAt),
      updatedAt: timestampToDate(m.updatedAt)
    }))
  }

  /**
   * Update material
   */
  async update(id: string, updates: Partial<Omit<Material, 'id' | 'createdAt'>>): Promise<void> {
    await db.materials.update(id, {
      ...updates,
      updatedAt: dateToTimestamp(new Date())
    })
  }

  /**
   * Delete material
   */
  async delete(id: string): Promise<void> {
    // Also delete associated prices
    await db.materialPrices.where('materialId').equals(id).delete()
    await db.materials.delete(id)
  }

  /**
   * Search materials by name
   */
  async searchByName(query: string): Promise<Material[]> {
    const lowerQuery = query.toLowerCase()
    const materials = await db.materials
      .filter(m => m.name.toLowerCase().includes(lowerQuery))
      .toArray()
    return materials.map(m => ({
      ...m,
      createdAt: timestampToDate(m.createdAt),
      updatedAt: timestampToDate(m.updatedAt)
    }))
  }

  // MaterialPrice methods

  /**
   * Add a price record for a material
   */
  async addPrice(price: Omit<MaterialPrice, 'createdAt'>): Promise<string> {
    await db.materialPrices.add({
      ...price,
      effectiveFrom: dateToTimestamp(price.effectiveFrom),
      effectiveTo: dateToTimestampOptional(price.effectiveTo),
      createdAt: dateToTimestamp(new Date())
    })
    return price.id
  }

  /**
   * Get current price for a material (where effectiveTo is null)
   */
  async getCurrentPrice(materialId: string): Promise<MaterialPrice | undefined> {
    const price = await db.materialPrices
      .where('materialId')
      .equals(materialId)
      .filter(p => !p.effectiveTo)
      .first()
    if (!price) return undefined
    return {
      ...price,
      effectiveFrom: timestampToDate(price.effectiveFrom),
      effectiveTo: timestampToDateOptional(price.effectiveTo),
      createdAt: timestampToDate(price.createdAt)
    }
  }

  /**
   * Get all prices for a material (ordered by effectiveFrom desc)
   */
  async getPriceHistory(materialId: string): Promise<MaterialPrice[]> {
    const prices = await db.materialPrices
      .where('materialId')
      .equals(materialId)
      .sortBy('effectiveFrom')
      .then(prices => prices.reverse())
    return prices.map(p => ({
      ...p,
      effectiveFrom: timestampToDate(p.effectiveFrom),
      effectiveTo: timestampToDateOptional(p.effectiveTo),
      createdAt: timestampToDate(p.createdAt)
    }))
  }

  /**
   * Update material price (closes previous price and creates new one)
   */
  async updatePrice(
    materialId: string,
    newPrice: Omit<MaterialPrice, 'id' | 'createdAt' | 'materialId'>
  ): Promise<string> {
    // Close previous current price
    const currentPrice = await db.materialPrices
      .where('materialId')
      .equals(materialId)
      .filter(p => !p.effectiveTo)
      .first()
    
    if (currentPrice) {
      await db.materialPrices.update(currentPrice.id, {
        effectiveTo: dateToTimestamp(new Date())
      })
    }

    // Add new price record
    const priceId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await this.addPrice({
      id: priceId,
      materialId,
      ...newPrice
    })

    return priceId
  }

  /**
   * Get price as of a specific date
   */
  async getPriceAsOf(materialId: string, date: Date): Promise<MaterialPrice | undefined> {
    const targetTime = date.getTime()
    const price = await db.materialPrices
      .where('materialId')
      .equals(materialId)
      .filter(p => {
        const from = p.effectiveFrom
        const to = p.effectiveTo || Date.now()
        return from <= targetTime && targetTime < to
      })
      .first()
    
    if (!price) return undefined
    return {
      ...price,
      effectiveFrom: timestampToDate(price.effectiveFrom),
      effectiveTo: timestampToDateOptional(price.effectiveTo),
      createdAt: timestampToDate(price.createdAt)
    }
  }
}

export const materialRepository = new MaterialRepository()

