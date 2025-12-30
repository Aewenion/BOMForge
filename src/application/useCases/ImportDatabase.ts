import { importDatabase as importDatabaseUtil } from '../../infrastructure/utils/exportImport'

export interface ImportDatabaseInput {
  data: string // JSON string
  merge?: boolean // If true, merge with existing data. If false, replace all.
}

export interface ImportDatabaseOutput {
  imported: {
    materials: number
    products: number
    bomVersions: number
    success: boolean
  }
  errors: string[]
}

/**
 * Use case: Import database from JSON
 * Validates data structure and imports entities
 */
export async function importDatabaseUseCase(
  input: ImportDatabaseInput
): Promise<ImportDatabaseOutput> {
  let parsedData: any
  const errors: string[] = []

  // Parse JSON
  try {
    parsedData = JSON.parse(input.data)
  } catch (err) {
    throw new Error('Invalid JSON format')
  }

  // Validate structure
  if (!parsedData || typeof parsedData !== 'object') {
    throw new Error('Invalid data format')
  }

  // Import data
  try {
    const result = await importDatabaseUtil(parsedData, input.merge !== false)
    return {
      imported: {
        materials: result.materials || 0,
        products: result.products || 0,
        bomVersions: result.bomVersions || 0,
        success: result.errors.length === 0
      },
      errors: result.errors || []
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Import failed')
    return {
      imported: {
        materials: 0,
        products: 0,
        bomVersions: 0,
        success: false
      },
      errors
    }
  }
}

