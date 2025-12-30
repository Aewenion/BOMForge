/**
 * Generate a unique ID for entities
 * Uses timestamp + random string for uniqueness
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}_${timestamp}_${random}`
}


