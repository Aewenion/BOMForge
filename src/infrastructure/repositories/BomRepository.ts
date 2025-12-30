import { db } from '../database/Database'
import type { BomVersion, BomLine, ProductDependency } from '../../domain/entities/Bom'

/**
 * Repository for BOM-related entities
 */
export class BomRepository {
  /**
   * Create a new BOM version
   */
  async createVersion(version: Omit<BomVersion, 'createdAt'>): Promise<string> {
    await db.bomVersions.add({
      ...version,
      createdAt: dateToTimestamp(new Date())
    })
    return version.id
  }

  /**
   * Get BOM version by ID
   */
  async getVersionById(id: string): Promise<BomVersion | undefined> {
    const version = await db.bomVersions.get(id)
    if (!version) return undefined
    return {
      ...version,
      createdAt: timestampToDate(version.createdAt)
    }
  }

  /**
   * Get all versions for a product
   */
  async getVersionsByProductId(productId: string): Promise<BomVersion[]> {
    const versions = await db.bomVersions
      .where('productId')
      .equals(productId)
      .sortBy('versionNumber')
      .then(versions => versions.reverse()) // newest first
    return versions.map(v => ({
      ...v,
      createdAt: timestampToDate(v.createdAt)
    }))
  }

  /**
   * Get current BOM version for a product
   */
  async getCurrentVersion(productId: string): Promise<BomVersion | undefined> {
    const product = await db.products.get(productId)
    if (!product || !product.currentBomVersionId) return undefined
    const version = await db.bomVersions.get(product.currentBomVersionId)
    if (!version) return undefined
    return {
      ...version,
      createdAt: timestampToDate(version.createdAt)
    }
  }

  /**
   * Get next version number for a product
   */
  async getNextVersionNumber(productId: string): Promise<number> {
    const versions = await db.bomVersions
      .where('productId')
      .equals(productId)
      .sortBy('versionNumber')
    
    if (versions.length === 0) return 1
    return versions[versions.length - 1].versionNumber + 1
  }

  /**
   * Set current BOM version for a product
   */
  async setCurrentVersion(productId: string, bomVersionId: string): Promise<void> {
    await db.products.update(productId, {
      currentBomVersionId: bomVersionId,
      updatedAt: dateToTimestamp(new Date())
    })
  }

  // BomLine methods

  /**
   * Add a line to a BOM version
   */
  async addLine(line: BomLine): Promise<string> {
    await db.bomLines.add(line)
    return line.id
  }

  /**
   * Get all lines for a BOM version
   */
  async getLinesByVersionId(bomVersionId: string): Promise<BomLine[]> {
    return await db.bomLines
      .where('bomVersionId')
      .equals(bomVersionId)
      .sortBy('sortOrder')
  }

  /**
   * Get BOM version with all lines
   */
  async getVersionWithLines(bomVersionId: string): Promise<{ version: BomVersion; lines: BomLine[] } | undefined> {
    const version = await db.bomVersions.get(bomVersionId)
    if (!version) return undefined

    const lines = await this.getLinesByVersionId(bomVersionId)
    return {
      version: {
        ...version,
        createdAt: timestampToDate(version.createdAt)
      },
      lines
    }
  }

  /**
   * Update a BOM line
   */
  async updateLine(id: string, updates: Partial<Omit<BomLine, 'id' | 'bomVersionId'>>): Promise<void> {
    await db.bomLines.update(id, updates)
  }

  /**
   * Delete a BOM line
   */
  async deleteLine(id: string): Promise<void> {
    await db.bomLines.delete(id)
  }

  /**
   * Delete all lines for a BOM version
   */
  async deleteLinesByVersionId(bomVersionId: string): Promise<void> {
    await db.bomLines.where('bomVersionId').equals(bomVersionId).delete()
  }

  /**
   * Reorder lines (update sortOrder for multiple lines)
   */
  async reorderLines(updates: { id: string; sortOrder: number }[]): Promise<void> {
    await db.transaction('rw', db.bomLines, async () => {
      for (const update of updates) {
        await db.bomLines.update(update.id, { sortOrder: update.sortOrder })
      }
    })
  }

  // ProductDependency methods

  /**
   * Add a dependency record
   */
  async addDependency(dependency: Omit<ProductDependency, 'createdAt'>): Promise<string> {
    await db.productDependencies.add({
      ...dependency,
      createdAt: dateToTimestamp(new Date())
    })
    return dependency.id
  }

  /**
   * Get all dependencies for a product
   */
  async getDependenciesByProductId(productId: string): Promise<ProductDependency[]> {
    const dependencies = await db.productDependencies.where('productId').equals(productId).toArray()
    return dependencies.map(d => ({
      ...d,
      createdAt: timestampToDate(d.createdAt)
    }))
  }

  /**
   * Get all products that depend on a specific material or product
   */
  async getProductsDependingOn(dependsOnType: 'material' | 'product', dependsOnId: string): Promise<string[]> {
    const dependencies = await db.productDependencies
      .where('[dependsOnType+dependsOnId]')
      .equals([dependsOnType, dependsOnId])
      .toArray()
    
    return [...new Set(dependencies.map(d => d.productId))]
  }

  /**
   * Delete all dependencies for a product
   */
  async deleteDependenciesByProductId(productId: string): Promise<void> {
    await db.productDependencies.where('productId').equals(productId).delete()
  }

  /**
   * Rebuild dependency index for a product's current BOM
   */
  async rebuildDependenciesForProduct(productId: string): Promise<void> {
    // Delete existing dependencies
    await this.deleteDependenciesByProductId(productId)

    // Get current BOM
    const product = await db.products.get(productId)
    if (!product || !product.currentBomVersionId) return

    const lines = await this.getLinesByVersionId(product.currentBomVersionId)

    // Add new dependencies
    for (const line of lines) {
      const dependencyId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await this.addDependency({
        id: dependencyId,
        productId,
        dependsOnType: line.inputType,
        dependsOnId: line.inputId
      })
    }
  }
}

export const bomRepository = new BomRepository()

