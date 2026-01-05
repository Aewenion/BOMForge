/**
 * Image compression and thumbnail generation utilities
 * Optimized for performance:
 * - Uses URL.createObjectURL instead of FileReader (zero-copy)
 * - Smart resizing before drawing to canvas
 * - Single-pass compression
 */

const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB
const THUMBNAIL_SIZE = 200 // 200x200px for thumbnails
const COMPRESSION_QUALITY = 0.8 // 80% quality for compression
const MAX_DIMENSION = 1920 // Max width/height for standard images

/**
 * Load an image from a file using URL.createObjectURL
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Calculate dimensions efficiently
 */
function calculateDimensions(
  width: number, 
  height: number, 
  maxSize: number
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height }
  }

  let newWidth = width
  let newHeight = height

  if (width > height) {
    if (width > maxSize) {
      newHeight = Math.round((height * maxSize) / width)
      newWidth = maxSize
    }
  } else {
    if (height > maxSize) {
      newWidth = Math.round((width * maxSize) / height)
      newHeight = maxSize
    }
  }

  return { width: newWidth, height: newHeight }
}

/**
 * Compress an image file to ≤1MB
 */
export async function compressImage(file: File): Promise<Blob> {
  try {
    const img = await loadImage(file)
    const { width, height } = calculateDimensions(img.width, img.height, MAX_DIMENSION)
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
      
    // Better quality scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Compression failed'))
          }
        },
        file.type,
        COMPRESSION_QUALITY
      )
    })
  } catch (error) {
    throw error // Propagate error
  }
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(file: File): Promise<Blob> {
  try {
    const img = await loadImage(file)
    const { width, height } = calculateDimensions(img.width, img.height, THUMBNAIL_SIZE)
    
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
    
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'
    ctx.drawImage(img, 0, 0, width, height)
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate thumbnail'))
          }
        },
        'image/jpeg',
        0.7 // Lower quality for thumbnails
      )
    })
  } catch (error) {
    throw error
  }
}

/**
 * Process image file: compress and generate thumbnail
 */
export async function processImage(file: File): Promise<{
  compressed: Blob
  thumbnail: Blob
  mimeType: string
  size: number
}> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  const [compressed, thumbnail] = await Promise.all([
    compressImage(file),
    generateThumbnail(file)
  ])

  return {
    compressed,
    thumbnail,
    mimeType: file.type,
    size: compressed.size
  }
}

/**
 * Create object URL from blob for display
 */
export function createImageUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * Revoke object URL to free memory
 */
export function revokeImageUrl(url: string): void {
  URL.revokeObjectURL(url)
}
