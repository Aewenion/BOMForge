import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import type { Material } from '../../domain/entities/Material'

export interface ListMaterialsInput {
  searchQuery?: string
}

export interface ListMaterialsOutput {
  materials: Material[]
}

/**
 * Use case: List all materials, optionally filtered by search query
 */
export async function listMaterials(
  input: ListMaterialsInput = {}
): Promise<ListMaterialsOutput> {
  let materials: Material[]

  if (input.searchQuery && input.searchQuery.trim()) {
    materials = await materialRepository.searchByName(input.searchQuery.trim())
  } else {
    materials = await materialRepository.getAll()
  }

  return {
    materials
  }
}




