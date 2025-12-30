/**
 * Quantity value object - represents a quantity with unit and dimension
 * Supports up to 5 decimal places as per requirements
 */
export class Quantity {
  private static readonly MAX_DECIMALS = 5
  private static readonly PRECISION = 100000 // 10^5 for 5 decimal places

  constructor(
    public readonly value: number,
    public readonly unit: string,
    public readonly dimension: 'mass' | 'volume' | 'count'
  ) {
    this.validate()
  }

  /**
   * Validate quantity value
   */
  private validate(): void {
    if (this.value < 0) {
      throw new Error('Quantity value cannot be negative')
    }

    if (!Number.isFinite(this.value)) {
      throw new Error('Quantity value must be a finite number')
    }

    // Check decimal places
    const decimals = this.getDecimalPlaces(this.value)
    if (decimals > Quantity.MAX_DECIMALS) {
      throw new Error(`Quantity cannot have more than ${Quantity.MAX_DECIMALS} decimal places`)
    }
  }

  /**
   * Get number of decimal places in a number
   */
  private getDecimalPlaces(num: number): number {
    if (Math.floor(num) === num) return 0
    const str = num.toString()
    if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
      return str.split('.')[1].length
    } else if (str.indexOf('e-') !== -1) {
      const parts = str.split('e-')
      return parseInt(parts[1], 10) + (parts[0].split('.')[1] || '').length
    }
    return 0
  }

  /**
   * Normalize value to ensure it respects max decimals
   */
  static normalize(value: number): number {
    return Math.round(value * Quantity.PRECISION) / Quantity.PRECISION
  }

  /**
   * Create quantity from normalized value
   */
  static create(value: number, unit: string, dimension: 'mass' | 'volume' | 'count'): Quantity {
    return new Quantity(Quantity.normalize(value), unit, dimension)
  }

  /**
   * Format quantity for display
   */
  format(decimalPlaces: number = 2): string {
    return this.value.toFixed(decimalPlaces)
  }

  /**
   * Check if quantity is zero
   */
  isZero(): boolean {
    return this.value === 0
  }

  /**
   * Check if quantity is positive
   */
  isPositive(): boolean {
    return this.value > 0
  }

  /**
   * Add another quantity (must have same unit and dimension)
   */
  add(other: Quantity): Quantity {
    if (this.unit !== other.unit || this.dimension !== other.dimension) {
      throw new Error('Cannot add quantities with different units or dimensions')
    }
    return new Quantity(
      Quantity.normalize(this.value + other.value),
      this.unit,
      this.dimension
    )
  }

  /**
   * Multiply by a scalar
   */
  multiply(scalar: number): Quantity {
    return new Quantity(
      Quantity.normalize(this.value * scalar),
      this.unit,
      this.dimension
    )
  }

  /**
   * Divide by a scalar
   */
  divide(scalar: number): Quantity {
    if (scalar === 0) {
      throw new Error('Cannot divide by zero')
    }
    return new Quantity(
      Quantity.normalize(this.value / scalar),
      this.unit,
      this.dimension
    )
  }

  /**
   * Compare with another quantity (must have same unit and dimension)
   */
  compare(other: Quantity): number {
    if (this.unit !== other.unit || this.dimension !== other.dimension) {
      throw new Error('Cannot compare quantities with different units or dimensions')
    }
    if (this.value < other.value) return -1
    if (this.value > other.value) return 1
    return 0
  }

  /**
   * Check equality with another quantity
   */
  equals(other: Quantity): boolean {
    return (
      this.value === other.value &&
      this.unit === other.unit &&
      this.dimension === other.dimension
    )
  }

  /**
   * Clone quantity
   */
  clone(): Quantity {
    return new Quantity(this.value, this.unit, this.dimension)
  }
}


