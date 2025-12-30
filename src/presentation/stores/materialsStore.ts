import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterialPrice,
  getMaterialPriceHistory
} from '../../application/useCases'
import type { Material, MaterialPrice } from '../../domain/entities/Material'

export const useMaterialsStore = defineStore('materials', () => {
  // State
  const materials = ref<Material[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedMaterial = ref<Material | null>(null)
  const priceHistory = ref<MaterialPrice[]>([])
  const currentPrice = ref<MaterialPrice | null>(null)

  // Getters
  const materialsCount = computed(() => materials.value.length)
  const hasMaterials = computed(() => materials.value.length > 0)

  // Actions
  async function loadMaterials(searchQuery?: string) {
    loading.value = true
    error.value = null
    try {
      const result = await listMaterials({ searchQuery })
      materials.value = result.materials
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load materials'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createNewMaterial(input: {
    name: string
    unit: string
    dimension: 'mass' | 'volume' | 'count'
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await createMaterial(input)
      materials.value.push(result.material)
      return result.material
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create material'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateExistingMaterial(input: {
    id: string
    name?: string
    unit?: string
    dimension?: 'mass' | 'volume' | 'count'
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await updateMaterial(input)
      const index = materials.value.findIndex(m => m.id === result.material.id)
      if (index !== -1) {
        materials.value[index] = result.material
      }
      if (selectedMaterial.value?.id === result.material.id) {
        selectedMaterial.value = result.material
      }
      return result.material
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update material'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeMaterial(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteMaterial({ id })
      materials.value = materials.value.filter(m => m.id !== id)
      if (selectedMaterial.value?.id === id) {
        selectedMaterial.value = null
        priceHistory.value = []
        currentPrice.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete material'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function selectMaterial(id: string) {
    const material = materials.value.find(m => m.id === id)
    if (material) {
      selectedMaterial.value = material
      await loadPriceHistory(id)
    } else {
      // Try to load from repository if not in list
      const { materialRepository } = await import('../../infrastructure/repositories/MaterialRepository')
      const loaded = await materialRepository.getById(id)
      if (loaded) {
        selectedMaterial.value = loaded
        await loadPriceHistory(id)
      }
    }
  }

  async function loadPriceHistory(materialId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await getMaterialPriceHistory({ materialId })
      priceHistory.value = result.prices
      currentPrice.value = result.currentPrice || null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load price history'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePrice(input: {
    materialId: string
    priceToman: number
    effectiveFrom: Date
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await updateMaterialPrice(input)
      // Reload price history
      await loadPriceHistory(input.materialId)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update price'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearSelection() {
    selectedMaterial.value = null
    priceHistory.value = []
    currentPrice.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    materials,
    loading,
    error,
    selectedMaterial,
    priceHistory,
    currentPrice,
    // Getters
    materialsCount,
    hasMaterials,
    // Actions
    loadMaterials,
    createNewMaterial,
    updateExistingMaterial,
    removeMaterial,
    selectMaterial,
    loadPriceHistory,
    updatePrice,
    clearSelection,
    clearError
  }
})



