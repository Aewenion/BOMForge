import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import type { Material } from '../../domain/entities/Material'

export interface CreateMaterialInput {
  name: string
  unit: string
  dimension: 'mass' | 'volume' | 'count'
}

export interface CreateMaterialOutput {
  material: Material
}

/**
 * Use case: Create a new material
 */
export async function createMaterial(
  input: CreateMaterialInput
): Promise<CreateMaterialOutput> {
  // Validate input
  if (!input.name || !input.name.trim()) {
    throw new Error('Material name is required')
  }

  if (!input.unit || !input.unit.trim()) {
    throw new Error('Material unit is required')
  }

  if (!input.dimension) {
    throw new Error('Material dimension is required')
  }

  // Create material
  const material: Omit<Material, 'createdAt' | 'updatedAt'> = {
    id: generateId('mat'),
    name: input.name.trim(),
    unit: input.unit.trim(),
    dimension: input.dimension
  }

  const materialId = await materialRepository.create(material)
  const createdMaterial = await materialRepository.getById(materialId)

  if (!createdMaterial) {
    throw new Error('Failed to retrieve created material')
  }

  return {
    material: createdMaterial
  }
}



