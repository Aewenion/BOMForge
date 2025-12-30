<template>
  <div class="database-test-view">
    <div class="glass-card">
      <h2>Database Test (Phase 2 Demo)</h2>
      <p>This page tests CRUD operations for Materials and Products.</p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
      </div>

      <!-- Material CRUD -->
      <section class="test-section">
        <h3>Material CRUD Test</h3>
        <div class="form-group">
          <input
            v-model="materialName"
            type="text"
            placeholder="Material name"
            class="input-field"
          />
          <select v-model="materialUnit" class="input-field">
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="L">L</option>
            <option value="ml">ml</option>
            <option value="unit">unit</option>
          </select>
          <select v-model="materialDimension" class="input-field">
            <option value="mass">Mass</option>
            <option value="volume">Volume</option>
            <option value="count">Count</option>
          </select>
          <button @click="createMaterial" class="btn-primary">Create Material</button>
        </div>

        <div class="list-section">
          <h4>Materials ({{ materials.length }})</h4>
          <div v-for="material in materials" :key="material.id" class="list-item">
            <span>{{ material.name }} ({{ material.unit }}, {{ material.dimension }})</span>
            <button @click="deleteMaterial(material.id)" class="btn-danger">Delete</button>
          </div>
        </div>
      </section>

      <!-- Product CRUD -->
      <section class="test-section">
        <h3>Product CRUD Test</h3>
        <div class="form-group">
          <input
            v-model="productName"
            type="text"
            placeholder="Product name"
            class="input-field"
          />
          <select v-model="productType" class="input-field">
            <option value="middle">Middle</option>
            <option value="final">Final</option>
          </select>
          <input
            v-model.number="productYieldQty"
            type="number"
            step="0.00001"
            placeholder="Yield quantity"
            class="input-field"
          />
          <select v-model="productUnit" class="input-field">
            <option value="L">L</option>
            <option value="ml">ml</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="unit">unit</option>
          </select>
          <select v-model="productDimension" class="input-field">
            <option value="volume">Volume</option>
            <option value="mass">Mass</option>
            <option value="count">Count</option>
          </select>
          <button @click="createProduct" class="btn-primary">Create Product</button>
        </div>

        <div class="list-section">
          <h4>Products ({{ products.length }})</h4>
          <div v-for="product in products" :key="product.id" class="list-item">
            <span>
              {{ product.name }} ({{ product.type }}, {{ product.yieldQty }} {{ product.unit }})
            </span>
            <button @click="deleteProduct(product.id)" class="btn-danger">Delete</button>
          </div>
        </div>
      </section>

      <!-- Database Info -->
      <section class="test-section">
        <h3>Database Info</h3>
        <button @click="loadAllData" class="btn-secondary">Refresh Data</button>
        <button @click="clearAllData" class="btn-danger">Clear All Data</button>
        <p>Database is {{ dbHealthy ? 'healthy' : 'unhealthy' }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { materialRepository } from '../../infrastructure/repositories/MaterialRepository'
import { productRepository } from '../../infrastructure/repositories/ProductRepository'
import { generateId } from '../../infrastructure/utils/idGenerator'
import { checkDatabaseHealth } from '../../infrastructure/utils/errorHandler'
import type { Material } from '../../domain/entities/Material'
import type { Product } from '../../domain/entities/Product'

const materials = ref<Material[]>([])
const products = ref<Product[]>([])
const error = ref<string>('')
const success = ref<string>('')
const dbHealthy = ref<boolean>(true)

// Material form
const materialName = ref('')
const materialUnit = ref('kg')
const materialDimension = ref<'mass' | 'volume' | 'count'>('mass')

// Product form
const productName = ref('')
const productType = ref<'middle' | 'final'>('final')
const productYieldQty = ref(1)
const productUnit = ref('L')
const productDimension = ref<'mass' | 'volume' | 'count'>('volume')

onMounted(async () => {
  await loadAllData()
  await checkHealth()
})

async function checkHealth() {
  dbHealthy.value = await checkDatabaseHealth()
}

async function loadAllData() {
  try {
    error.value = ''
    materials.value = await materialRepository.getAll()
    products.value = await productRepository.getAll()
    success.value = 'Data loaded successfully'
    setTimeout(() => { success.value = '' }, 2000)
  } catch (err) {
    error.value = `Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

async function createMaterial() {
  if (!materialName.value.trim()) {
    error.value = 'Material name is required'
    return
  }

  try {
    error.value = ''
    const material: Omit<Material, 'createdAt' | 'updatedAt'> = {
      id: generateId('mat'),
      name: materialName.value.trim(),
      unit: materialUnit.value,
      dimension: materialDimension.value
    }
    await materialRepository.create(material)
    materialName.value = ''
    success.value = 'Material created successfully'
    setTimeout(() => { success.value = '' }, 2000)
    await loadAllData()
  } catch (err) {
    error.value = `Failed to create material: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

async function deleteMaterial(id: string) {
  if (!confirm('Are you sure you want to delete this material?')) return

  try {
    error.value = ''
    await materialRepository.delete(id)
    success.value = 'Material deleted successfully'
    setTimeout(() => { success.value = '' }, 2000)
    await loadAllData()
  } catch (err) {
    error.value = `Failed to delete material: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

async function createProduct() {
  if (!productName.value.trim()) {
    error.value = 'Product name is required'
    return
  }

  if (productYieldQty.value <= 0) {
    error.value = 'Yield quantity must be greater than 0'
    return
  }

  try {
    error.value = ''
    const product: Omit<Product, 'createdAt' | 'updatedAt'> = {
      id: generateId('prod'),
      type: productType.value,
      name: productName.value.trim(),
      unit: productUnit.value,
      dimension: productDimension.value,
      yieldQty: productYieldQty.value,
      images: []
    }
    await productRepository.create(product)
    productName.value = ''
    productYieldQty.value = 1
    success.value = 'Product created successfully'
    setTimeout(() => { success.value = '' }, 2000)
    await loadAllData()
  } catch (err) {
    error.value = `Failed to create product: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

async function deleteProduct(id: string) {
  if (!confirm('Are you sure you want to delete this product?')) return

  try {
    error.value = ''
    await productRepository.delete(id)
    success.value = 'Product deleted successfully'
    setTimeout(() => { success.value = '' }, 2000)
    await loadAllData()
  } catch (err) {
    error.value = `Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}

async function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL data? This cannot be undone!')) return

  try {
    error.value = ''
    // Clear all tables
    const { db } = await import('../../infrastructure/database/Database')
    await db.transaction('rw', [
      db.materials,
      db.materialPrices,
      db.products,
      db.productImages,
      db.bomVersions,
      db.bomLines,
      db.productDependencies
    ], async () => {
      await db.materials.clear()
      await db.materialPrices.clear()
      await db.products.clear()
      await db.productImages.clear()
      await db.bomVersions.clear()
      await db.bomLines.clear()
      await db.productDependencies.clear()
    })
    success.value = 'All data cleared successfully'
    setTimeout(() => { success.value = '' }, 2000)
    await loadAllData()
  } catch (err) {
    error.value = `Failed to clear data: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
</script>

<style scoped>
.database-test-view {
  display: grid;
  gap: 2rem;
}

.test-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--glass-border);
}

.test-section:last-child {
  border-bottom: none;
}

.form-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.input-field {
  padding: 0.5rem;
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-family: inherit;
  flex: 1;
  min-width: 120px;
}

.list-section {
  margin-top: 1rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.5rem;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
}

.btn-danger:hover {
  background: #dc2626;
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
</style>

