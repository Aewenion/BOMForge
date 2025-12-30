import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'

export interface DeleteMaterialInput {
  id: string
}

export interface DeleteMaterialOutput {
  success: boolean
}

/**
 * Use case: Delete a material
 */
export async function deleteMaterial(
  input: DeleteMaterialInput
): Promise<DeleteMaterialOutput> {
  // Validate material exists
  const existing = await materialRepository.getById(input.id)
  if (!existing) {
    throw new Error(`Material with id ${input.id} not found`)
  }

  // Delete material (repository handles cascading deletes for prices)
  await materialRepository.delete(input.id)

  return {
    success: true
  }
}




