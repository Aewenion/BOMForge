/**
 * Image compression and thumbnail generation utilities
 */

const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB
const THUMBNAIL_SIZE = 200 // 200x200px for thumbnails
const COMPRESSION_QUALITY = 0.8 // 80% quality for compression

/**
 * Compress an image file to ≤1MB
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions to fit within 1MB
        // Start with original size and reduce if needed
        let quality = COMPRESSION_QUALITY
        let blob: Blob | null = null

        // Try to compress with quality reduction first
        do {
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (compressedBlob) => {
              if (compressedBlob) {
                if (compressedBlob.size <= MAX_IMAGE_SIZE) {
                  resolve(compressedBlob)
                } else {
                  // If still too large, reduce dimensions
                  width = Math.floor(width * 0.9)
                  height = Math.floor(height * 0.9)
                  quality = Math.max(0.5, quality - 0.1)
                  
                  if (width < 100 || height < 100) {
                    reject(new Error('Image too large to compress to 1MB'))
                    return
                  }
                  
                  // Retry with smaller dimensions
                  canvas.width = width
                  canvas.height = height
                  ctx.drawImage(img, 0, 0, width, height)
                  canvas.toBlob(
                    (retryBlob) => {
                      if (retryBlob && retryBlob.size <= MAX_IMAGE_SIZE) {
                        resolve(retryBlob)
                      } else if (retryBlob) {
                        // Continue reducing
                        const newWidth = Math.floor(width * 0.9)
                        const newHeight = Math.floor(height * 0.9)
                        if (newWidth < 100 || newHeight < 100) {
                          reject(new Error('Image too large to compress to 1MB'))
                        } else {
                          width = newWidth
                          height = newHeight
                          canvas.width = width
                          canvas.height = height
                          ctx.drawImage(img, 0, 0, width, height)
                          canvas.toBlob((finalBlob) => {
                            if (finalBlob) {
                              resolve(finalBlob)
                            } else {
                              reject(new Error('Compression failed'))
                            }
                          }, file.type, quality)
                        }
                      } else {
                        reject(new Error('Compression failed'))
                      }
                    },
                    file.type,
                    quality
                  )
                }
              } else {
                reject(new Error('Compression failed'))
              }
            },
            file.type,
            quality
          )
        } while (blob === null)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Calculate thumbnail dimensions (maintain aspect ratio)
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > THUMBNAIL_SIZE) {
            height = (height * THUMBNAIL_SIZE) / width
            width = THUMBNAIL_SIZE
          }
        } else {
          if (height > THUMBNAIL_SIZE) {
            width = (width * THUMBNAIL_SIZE) / height
            height = THUMBNAIL_SIZE
          }
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to generate thumbnail'))
            }
          },
          'image/jpeg',
          0.85 // Slightly lower quality for thumbnails
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
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

  // Compress image
  const compressed = await compressImage(file)

  // Generate thumbnail
  const thumbnail = await generateThumbnail(file)

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


