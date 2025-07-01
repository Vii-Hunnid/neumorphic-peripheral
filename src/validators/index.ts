import { ValidationConfig, ValidationFunction, ValidationResult } from '../types'
import { isValidEmail } from '../utils'

// Built-in validation functions
export const validators = {
  required: (value: string): string | null => {
    return value.trim() === '' ? 'This field is required' : null
  },
  
  email: (value: string): string | null => {
    return value && !isValidEmail(value) ? 'Please enter a valid email address' : null
  },
  
  minLength: (min: number) => (value: string): string | null => {
    return value && value.length < min ? `Must be at least ${min} characters` : null
  },
  
  maxLength: (max: number) => (value: string): string | null => {
    return value && value.length > max ? `Must be no more than ${max} characters` : null
  },
  
  pattern: (regex: RegExp, message: string = 'Invalid format') => (value: string): string | null => {
    return value && !regex.test(value) ? message : null
  },
  
  number: (value: string): string | null => {
    const num = parseFloat(value)
    return value && (isNaN(num) || !isFinite(num)) ? 'Must be a valid number' : null
  },
  
  integer: (value: string): string | null => {
    const num = parseInt(value, 10)
    return value && (isNaN(num) || !Number.isInteger(num)) ? 'Must be a whole number' : null
  },
  
  min: (min: number) => (value: string): string | null => {
    const num = parseFloat(value)
    return value && !isNaN(num) && num < min ? `Must be at least ${min}` : null
  },
  
  max: (max: number) => (value: string): string | null => {
    const num = parseFloat(value)
    return value && !isNaN(num) && num > max ? `Must be no more than ${max}` : null
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong'
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }
  
  // Uppercase letter
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }
  
  // Lowercase letter
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }
  
  // Numbers
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }
  
  // Special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }
  
  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score <= 2) strength = 'weak'
  else if (score === 3) strength = 'fair'
  else if (score === 4) strength = 'good'
  else strength = 'strong'
  
  return { score, feedback, strength }
}

// Main validation function
export function validateValue(
  value: string,
  config: ValidationConfig | ValidationFunction
): ValidationResult {
  const errors: string[] = []
  
  if (typeof config === 'function') {
    const result = config(value)
    if (result) errors.push(result)
  } else {
    // Required validation (runs first)
    if (config.required) {
      const error = validators.required(value)
      if (error) {
        errors.push(error)
        // If required validation fails, skip other validations for empty values
        if (value.trim() === '') {
          return { isValid: false, errors }
        }
      }
    }
    
    // Skip other validations for empty values (unless required failed)
    if (value.trim() === '') {
      return { isValid: true, errors: [] }
    }
    
    // Email validation
    if (config.email) {
      const error = validators.email(value)
      if (error) errors.push(error)
    }
    
    // Length validations
    if (config.minLength !== undefined) {
      const error = validators.minLength(config.minLength)(value)
      if (error) errors.push(error)
    }
    
    if (config.maxLength !== undefined) {
      const error = validators.maxLength(config.maxLength)(value)
      if (error) errors.push(error)
    }
    
    // Pattern validation
    if (config.pattern) {
      const error = validators.pattern(config.pattern)(value)
      if (error) errors.push(error)
    }
    
    // Custom validations
    if (config.custom) {
      config.custom.forEach(validator => {
        const error = validator(value)
        if (error) errors.push(error)
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validation state management
export class ValidationManager {
  private validationState = new Map<HTMLElement, ValidationResult>()
  private errorElements = new Map<HTMLElement, HTMLElement>()
  
  validate(element: HTMLElement, config: ValidationConfig | ValidationFunction): ValidationResult {
    const value = this.getElementValue(element)
    const result = validateValue(value, config)
    
    this.validationState.set(element, result)
    this.updateErrorDisplay(element, result)
    
    return result
  }
  
  clearValidation(element: HTMLElement): void {
    this.validationState.delete(element)
    this.removeErrorDisplay(element)
  }
  
  getValidationState(element: HTMLElement): ValidationResult | null {
    return this.validationState.get(element) || null
  }
  
  isValid(element: HTMLElement): boolean {
    const state = this.validationState.get(element)
    return state ? state.isValid : true
  }
  
  getAllErrors(): string[] {
    const allErrors: string[] = []
    this.validationState.forEach(result => {
      allErrors.push(...result.errors)
    })
    return allErrors
  }
  
  private getElementValue(element: HTMLElement): string {
    if (element instanceof HTMLInputElement || 
        element instanceof HTMLTextAreaElement || 
        element instanceof HTMLSelectElement) {
      return element.value
    }
    return element.textContent || ''
  }
  
  private updateErrorDisplay(element: HTMLElement, result: ValidationResult): void {
    if (result.isValid) {
      this.removeErrorDisplay(element)
      element.classList.remove('np-error')
    } else {
      this.showErrorDisplay(element, result.errors[0]) // Show first error
      element.classList.add('np-error')
    }
  }
  
  private showErrorDisplay(element: HTMLElement, errorMessage: string): void {
    let errorElement = this.errorElements.get(element)
    
    if (!errorElement) {
      errorElement = document.createElement('div')
      errorElement.className = 'np-error-message'
      errorElement.setAttribute('role', 'alert')
      errorElement.setAttribute('aria-live', 'polite')
      
      // Insert after the element
      const parent = element.parentElement
      if (parent) {
        const nextSibling = element.nextSibling
        if (nextSibling) {
          parent.insertBefore(errorElement, nextSibling)
        } else {
          parent.appendChild(errorElement)
        }
      }
      
      this.errorElements.set(element, errorElement)
    }
    
    errorElement.textContent = errorMessage
    errorElement.style.display = 'block'
  }
  
  private removeErrorDisplay(element: HTMLElement): void {
    const errorElement = this.errorElements.get(element)
    if (errorElement) {
      errorElement.style.display = 'none'
      errorElement.textContent = ''
    }
  }
  
  destroy(): void {
    // Clean up all error elements
    this.errorElements.forEach(errorElement => {
      if (errorElement.parentElement) {
        errorElement.parentElement.removeChild(errorElement)
      }
    })
    
    this.validationState.clear()
    this.errorElements.clear()
  }
}

// Global validation manager instance
export const globalValidationManager = new ValidationManager()