import { exportDatabase as exportDatabaseUtil } from '../../infrastructure/utils/exportImport'
import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { bomRepository } from '../../infrastructure/repositories/BomRepository'

export interface ExportDatabaseInput {
  includeBlobs?: boolean
}

export interface ExportDatabaseOutput {
  data: string // JSON string
  timestamp: Date
  version: string
}

/**
 * Use case: Export entire database to JSON
 */
export async function exportDatabaseUseCase(
  input: ExportDatabaseInput = {}
): Promise<ExportDatabaseOutput> {
  const data = await exportDatabaseUtil(input.includeBlobs !== false)
  
  return {
    data: JSON.stringify(data, null, 2),
    timestamp: new Date(),
    version: import.meta.env.__APP_VERSION__ || '1.0.0'
  }
}

