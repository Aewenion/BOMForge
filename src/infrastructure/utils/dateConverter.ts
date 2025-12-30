/**
 * Utilities for converting between Date objects and timestamps for database storage
 */

/**
 * Convert Date to timestamp (number) for database storage
 */
export function dateToTimestamp(date: Date): number {
  return date.getTime()
}

/**
 * Convert timestamp (number) to Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp)
}

/**
 * Convert Date to timestamp, handling undefined
 */
export function dateToTimestampOptional(date: Date | undefined): number | undefined {
  return date ? date.getTime() : undefined
}

/**
 * Convert timestamp to Date, handling undefined
 */
export function timestampToDateOptional(timestamp: number | undefined): Date | undefined {
  return timestamp ? new Date(timestamp) : undefined
}


