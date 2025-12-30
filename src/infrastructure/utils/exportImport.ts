import { db } from '../database/Database'
import type { Material, MaterialPrice } from '../../domain/entities/Material'
import type { Product, ProductImage } from '../../domain/entities/Product'
import type { BomVersion, BomLine, ProductDependency } from '../../domain/entities/Bom'

/**
 * Export format for backup/restore
 */
export interface ExportData {
  version: string // schema version
  exportedAt: string // ISO date string
  data: {
    materials: Material[]
    materialPrices: MaterialPrice[]
    products: Product[]
    productImages: ProductImage[] // Note: blobs will be base64 encoded
    bomVersions: BomVersion[]
    bomLines: BomLine[]
    productDependencies: ProductDependency[]
  }
}

/**
 * Export all data to JSON format
 */
export async function exportData(): Promise<ExportData> {
  const materials = await db.materials.toArray()
  const materialPrices = await db.materialPrices.toArray()
  const products = await db.products.toArray()
  const productImages = await db.productImages.toArray()
  const bomVersions = await db.bomVersions.toArray()
  const bomLines = await db.bomLines.toArray()
  const productDependencies = await db.productDependencies.toArray()

  // Convert blobs to base64 for JSON export
  const productImagesWithBase64 = await Promise.all(
    productImages.map(async (image) => {
      const blobBase64 = await blobToBase64(image.blob)
      const thumbnailBase64 = await blobToBase64(image.thumbnail)
      return {
        ...image,
        blob: blobBase64,
        thumbnail: thumbnailBase64,
        blobType: 'base64' // marker for import
      }
    })
  )

  return {
    version: '1.0.0', // Current schema version
    exportedAt: new Date().toISOString(),
    data: {
      materials,
      materialPrices,
      products,
      productImages: productImagesWithBase64 as any,
      bomVersions,
      bomLines,
      productDependencies
    }
  }
}

/**
 * Import data from JSON format
 */
export async function importData(exportData: ExportData, merge: boolean = false): Promise<void> {
  if (!merge) {
    // Clear all existing data
    await db.materials.clear()
    await db.materialPrices.clear()
    await db.products.clear()
    await db.productImages.clear()
    await db.bomVersions.clear()
    await db.bomLines.clear()
    await db.productDependencies.clear()
  }

  // Import in order (respecting foreign key dependencies)
  await db.transaction('rw', [
    db.materials,
    db.materialPrices,
    db.products,
    db.productImages,
    db.bomVersions,
    db.bomLines,
    db.productDependencies
  ], async () => {
    // 1. Materials
    if (exportData.data.materials) {
      await db.materials.bulkAdd(exportData.data.materials)
    }

    // 2. Material Prices
    if (exportData.data.materialPrices) {
      await db.materialPrices.bulkAdd(exportData.data.materialPrices)
    }

    // 3. Products
    if (exportData.data.products) {
      // Remove images from products (they'll be added separately)
      const productsWithoutImages = exportData.data.products.map(p => ({
        ...p,
        images: []
      }))
      await db.products.bulkAdd(productsWithoutImages)
    }

    // 4. Product Images (convert base64 back to blobs)
    if (exportData.data.productImages) {
      const productImagesWithBlobs = await Promise.all(
        exportData.data.productImages.map(async (image: any) => {
          const blob = image.blobType === 'base64' 
            ? await base64ToBlob(image.blob, image.mimeType)
            : image.blob
          const thumbnail = image.blobType === 'base64'
            ? await base64ToBlob(image.thumbnail, image.mimeType)
            : image.thumbnail

          return {
            ...image,
            blob,
            thumbnail,
            blobType: undefined
          }
        })
      )
      await db.productImages.bulkAdd(productImagesWithBlobs)
    }

    // 5. BOM Versions
    if (exportData.data.bomVersions) {
      await db.bomVersions.bulkAdd(exportData.data.bomVersions)
    }

    // 6. BOM Lines
    if (exportData.data.bomLines) {
      await db.bomLines.bulkAdd(exportData.data.bomLines)
    }

    // 7. Product Dependencies
    if (exportData.data.productDependencies) {
      await db.productDependencies.bulkAdd(exportData.data.productDependencies)
    }
  })
}

/**
 * Convert blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove data URL prefix
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 string to blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Download export data as JSON file
 */
export function downloadExport(data: ExportData, filename: string = 'bomforge-backup.json'): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Read import data from file
 */
export function readImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      try {
        const data = JSON.parse(reader.result as string) as ExportData
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}


