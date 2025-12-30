import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  addProductImage,
  deleteProductImage
} from '../../application/useCases'
import type { Product, ProductImage } from '../../domain/entities/Product'
import { createImageUrl, revokeImageUrl } from '../../infrastructure/utils/imageCompression'

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedProduct = ref<Product | null>(null)
  const imageUrls = ref<Map<string, string>>(new Map()) // Cache for image URLs
  const thumbnailUrls = ref<Map<string, string>>(new Map()) // Cache for thumbnail URLs

  // Getters
  const productsCount = computed(() => products.value.length)
  const hasProducts = computed(() => products.value.length > 0)
  const middleProducts = computed(() => products.value.filter(p => p.type === 'middle'))
  const finalProducts = computed(() => products.value.filter(p => p.type === 'final'))

  // Actions
  async function loadProducts(searchQuery?: string, type?: 'middle' | 'final') {
    loading.value = true
    error.value = null
    try {
      const result = await listProducts({ searchQuery, type })
      products.value = result.products
      // Preload thumbnails for list view
      await preloadThumbnails(result.products)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load products'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createNewProduct(input: {
    type: 'middle' | 'final'
    name: string
    unit: string
    dimension: 'mass' | 'volume' | 'count'
    yieldQty: number
    description?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await createProduct(input)
      products.value.push(result.product)
      return result.product
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateExistingProduct(input: {
    id: string
    type?: 'middle' | 'final'
    name?: string
    unit?: string
    dimension?: 'mass' | 'volume' | 'count'
    yieldQty?: number
    description?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await updateProduct(input)
      const index = products.value.findIndex(p => p.id === result.product.id)
      if (index !== -1) {
        products.value[index] = result.product
      }
      if (selectedProduct.value?.id === result.product.id) {
        selectedProduct.value = result.product
        await preloadImages(result.product)
      }
      return result.product
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeProduct(id: string) {
    loading.value = true
    error.value = null
    try {
      await deleteProduct({ id })
      products.value = products.value.filter(p => p.id !== id)
      if (selectedProduct.value?.id === id) {
        clearImageUrls(selectedProduct.value)
        selectedProduct.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete product'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function selectProduct(id: string) {
    const product = products.value.find(p => p.id === id)
    if (product) {
      selectedProduct.value = product
      await preloadImages(product)
    } else {
      // Try to load from repository if not in list
      const { productRepository } = await import('../../infrastructure/repositories/ProductRepository')
      const loaded = await productRepository.getById(id)
      if (loaded) {
        selectedProduct.value = loaded
        await preloadImages(loaded)
      }
    }
  }

  async function addImage(productId: string, file: File) {
    loading.value = true
    error.value = null
    try {
      const result = await addProductImage({ productId, file })
      
      // Update selected product if it's the one we're adding to
      if (selectedProduct.value?.id === productId) {
        selectedProduct.value.images.push(result.image)
        await preloadImage(result.image)
      }
      
      // Update product in list
      const product = products.value.find(p => p.id === productId)
      if (product) {
        product.images.push(result.image)
        await preloadThumbnail(result.image)
      }
      
      return result.image
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add image'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeImage(imageId: string) {
    loading.value = true
    error.value = null
    try {
      await deleteProductImage({ imageId })
      
      // Find and remove image from selected product
      if (selectedProduct.value) {
        const image = selectedProduct.value.images.find(img => img.id === imageId)
        if (image) {
          revokeImageUrl(imageUrls.value.get(imageId) || '')
          revokeImageUrl(thumbnailUrls.value.get(imageId) || '')
          imageUrls.value.delete(imageId)
          thumbnailUrls.value.delete(imageId)
          selectedProduct.value.images = selectedProduct.value.images.filter(img => img.id !== imageId)
        }
      }
      
      // Remove from products list
      for (const product of products.value) {
        const image = product.images.find(img => img.id === imageId)
        if (image) {
          product.images = product.images.filter(img => img.id !== imageId)
          break
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete image'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Image URL management
  function getImageUrl(imageId: string): string | null {
    return imageUrls.value.get(imageId) || null
  }

  function getThumbnailUrl(imageId: string): string | null {
    return thumbnailUrls.value.get(imageId) || null
  }

  async function preloadImage(image: ProductImage) {
    if (!imageUrls.value.has(image.id)) {
      const url = createImageUrl(image.blob)
      imageUrls.value.set(image.id, url)
    }
    if (!thumbnailUrls.value.has(image.id)) {
      const url = createImageUrl(image.thumbnail)
      thumbnailUrls.value.set(image.id, url)
    }
  }

  async function preloadThumbnail(image: ProductImage) {
    if (!thumbnailUrls.value.has(image.id)) {
      const url = createImageUrl(image.thumbnail)
      thumbnailUrls.value.set(image.id, url)
    }
  }

  async function preloadImages(product: Product) {
    for (const image of product.images) {
      await preloadImage(image)
    }
  }

  async function preloadThumbnails(products: Product[]) {
    for (const product of products) {
      for (const image of product.images) {
        await preloadThumbnail(image)
      }
    }
  }

  function clearImageUrls(product: Product) {
    for (const image of product.images) {
      const imageUrl = imageUrls.value.get(image.id)
      const thumbUrl = thumbnailUrls.value.get(image.id)
      if (imageUrl) revokeImageUrl(imageUrl)
      if (thumbUrl) revokeImageUrl(thumbUrl)
      imageUrls.value.delete(image.id)
      thumbnailUrls.value.delete(image.id)
    }
  }

  function clearSelection() {
    if (selectedProduct.value) {
      clearImageUrls(selectedProduct.value)
    }
    selectedProduct.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    products,
    loading,
    error,
    selectedProduct,
    // Getters
    productsCount,
    hasProducts,
    middleProducts,
    finalProducts,
    // Actions
    loadProducts,
    createNewProduct,
    updateExistingProduct,
    removeProduct,
    selectProduct,
    addImage,
    removeImage,
    getImageUrl,
    getThumbnailUrl,
    clearSelection,
    clearError
  }
})

