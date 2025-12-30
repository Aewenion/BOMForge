import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import type { Material } from '../../domain/entities/Material'

export interface UpdateMaterialInput {
  id: string
  name?: string
  unit?: string
  dimension?: 'mass' | 'volume' | 'count'
}

export interface UpdateMaterialOutput {
  material: Material
}

/**
 * Use case: Update an existing material
 */
export async function updateMaterial(
  input: UpdateMaterialInput
): Promise<UpdateMaterialOutput> {
  // Validate material exists
  const existing = await materialRepository.getById(input.id)
  if (!existing) {
    throw new Error(`Material with id ${input.id} not found`)
  }

  // Prepare updates
  const updates: Partial<Omit<Material, 'id' | 'createdAt'>> = {}

  if (input.name !== undefined) {
    if (!input.name || !input.name.trim()) {
      throw new Error('Material name cannot be empty')
    }
    updates.name = input.name.trim()
  }

  if (input.unit !== undefined) {
    if (!input.unit || !input.unit.trim()) {
      throw new Error('Material unit cannot be empty')
    }
    updates.unit = input.unit.trim()
  }

  if (input.dimension !== undefined) {
    updates.dimension = input.dimension
  }

  // Update material
  await materialRepository.update(input.id, updates)

  const updatedMaterial = await materialRepository.getById(input.id)
  if (!updatedMaterial) {
    throw new Error('Failed to retrieve updated material')
  }

  return {
    material: updatedMaterial
  }
}



