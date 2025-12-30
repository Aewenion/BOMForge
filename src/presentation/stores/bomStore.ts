import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createBomVersion,
  addBomLine,
  updateBomLine,
  deleteBomLine,
  setCurrentBomVersion,
  getBomWithLines,
  getBomVersions,
  reorderBomLines
} from '../../application/useCases'
import type { BomVersion, BomLine } from '../../domain/entities/Bom'

export const useBomStore = defineStore('bom', () => {
  // State
  const currentBomVersion = ref<BomVersion | null>(null)
  const bomLines = ref<BomLine[]>([])
  const bomVersions = ref<BomVersion[]>([])
  const currentVersion = ref<BomVersion | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const editingProductId = ref<string | null>(null)

  // Getters
  const hasLines = computed(() => bomLines.value.length > 0)
  const linesCount = computed(() => bomLines.value.length)

  // Actions
  async function loadBomVersions(productId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await getBomVersions({ productId })
      bomVersions.value = result.versions
      currentVersion.value = result.currentVersion || null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load BOM versions'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadBom(bomVersionId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await getBomWithLines({ bomVersionId })
      currentBomVersion.value = result.version
      bomLines.value = result.lines
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load BOM'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function startEditing(productId: string) {
    editingProductId.value = productId
    await loadBomVersions(productId)
    
    // Load current version if exists
    if (currentVersion.value) {
      await loadBom(currentVersion.value.id)
    } else {
      // Create new version for editing
      const result = await createBomVersion({ productId })
      currentBomVersion.value = result.bomVersion
      bomLines.value = []
    }
  }

  async function createNewVersion(productId: string, notes?: string) {
    loading.value = true
    error.value = null
    try {
      const result = await createBomVersion({ productId, notes })
      currentBomVersion.value = result.bomVersion
      bomLines.value = []
      await loadBomVersions(productId)
      return result.bomVersion
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create BOM version'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addLine(input: {
    inputType: 'material' | 'product'
    inputId: string
    qty: number
    unit: string
    wastePct?: number
  }) {
    if (!currentBomVersion.value) {
      throw new Error('No BOM version selected')
    }

    loading.value = true
    error.value = null
    try {
      const sortOrder = bomLines.value.length
      const result = await addBomLine({
        bomVersionId: currentBomVersion.value.id,
        ...input,
        sortOrder
      })
      bomLines.value.push(result.bomLine)
      // Re-sort by sortOrder
      bomLines.value.sort((a, b) => a.sortOrder - b.sortOrder)
      return result.bomLine
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add BOM line'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateLine(lineId: string, updates: {
    qty?: number
    unit?: string
    wastePct?: number
    sortOrder?: number
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await updateBomLine({ lineId, ...updates })
      const index = bomLines.value.findIndex(l => l.id === lineId)
      if (index !== -1) {
        bomLines.value[index] = result.bomLine
        // Re-sort if sortOrder changed
        if (updates.sortOrder !== undefined) {
          bomLines.value.sort((a, b) => a.sortOrder - b.sortOrder)
        }
      }
      return result.bomLine
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update BOM line'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeLine(lineId: string) {
    loading.value = true
    error.value = null
    try {
      await deleteBomLine({ lineId })
      bomLines.value = bomLines.value.filter(l => l.id !== lineId)
      // Reorder remaining lines
      bomLines.value.forEach((line, index) => {
        if (line.sortOrder !== index) {
          line.sortOrder = index
        }
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete BOM line'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function reorderLines(newOrder: { lineId: string; sortOrder: number }[]) {
    if (!currentBomVersion.value) {
      throw new Error('No BOM version selected')
    }

    loading.value = true
    error.value = null
    try {
      await reorderBomLines({
        bomVersionId: currentBomVersion.value.id,
        lineOrders: newOrder
      })
      // Reload lines to get updated order
      await loadBom(currentBomVersion.value.id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder BOM lines'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveAsCurrent(productId: string) {
    if (!currentBomVersion.value) {
      throw new Error('No BOM version to save')
    }

    loading.value = true
    error.value = null
    try {
      await setCurrentBomVersion({
        productId,
        bomVersionId: currentBomVersion.value.id
      })
      await loadBomVersions(productId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to set current BOM version'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function switchToVersion(bomVersionId: string) {
    await loadBom(bomVersionId)
  }

  function clearEditing() {
    editingProductId.value = null
    currentBomVersion.value = null
    bomLines.value = []
    bomVersions.value = []
    currentVersion.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    currentBomVersion,
    bomLines,
    bomVersions,
    currentVersion,
    loading,
    error,
    editingProductId,
    // Getters
    hasLines,
    linesCount,
    // Actions
    loadBomVersions,
    loadBom,
    startEditing,
    createNewVersion,
    addLine,
    updateLine,
    removeLine,
    reorderLines,
    saveAsCurrent,
    switchToVersion,
    clearEditing,
    clearError
  }
})

