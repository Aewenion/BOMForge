/**
 * Material entity - represents a raw material
 */
export interface Material {
  id: string
  name: string
  unit: string // default unit user registers with (e.g., 'kg', 'L', 'unit')
  dimension: 'mass' | 'volume' | 'count'
  createdAt: Date
  updatedAt: Date
}

/**
 * MaterialPrice entity - represents a price record for a material
 */
export interface MaterialPrice {
  id: string
  materialId: string
  priceToman: number // integer value, no decimals
  effectiveFrom: Date
  effectiveTo?: Date // null = current price
  createdAt: Date
}





