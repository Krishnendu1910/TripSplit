/**
 * Custom error classes for financial calculation engine.
 */

export class FinanceValidationError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'FinanceValidationError'
    this.details = details
  }
}

export class SplitMismatchError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'SplitMismatchError'
    this.details = details
  }
}

