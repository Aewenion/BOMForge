/**
 * Error handling utilities for database operations
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Handle database errors with recovery strategies
 */
export async function handleDatabaseError<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('Database error:', error)

    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new DatabaseError(
        'Storage quota exceeded. Please free up space or delete old data.',
        'QUOTA_EXCEEDED',
        error
      )
    }

    // Check if it's a constraint error
    if (error instanceof Error && error.name === 'ConstraintError') {
      throw new DatabaseError(
        'Data constraint violation. The operation conflicts with existing data.',
        'CONSTRAINT_ERROR',
        error
      )
    }

    // Try fallback if provided
    if (fallback) {
      try {
        return await fallback()
      } catch (fallbackError) {
        throw new DatabaseError(
          'Operation failed and fallback also failed.',
          'FALLBACK_FAILED',
          fallbackError as Error
        )
      }
    }

    // Re-throw as DatabaseError
    throw new DatabaseError(
      'Database operation failed',
      'UNKNOWN_ERROR',
      error as Error
    )
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new DatabaseError(
    `Operation failed after ${maxRetries} attempts`,
    'RETRY_EXHAUSTED',
    lastError
  )
}

/**
 * Check if database is available
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Try to open the database
    const db = await import('../database/Database').then(m => m.db)
    await db.open()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}




