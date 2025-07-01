/**
 * Zod Validation Adapter for Neumorphic Peripheral
 * 
 * This adapter allows you to use Zod schemas for validation
 * Install: npm install zod
 * 
 * Usage:
 * import { z } from 'zod'
 * import { zodAdapter } from 'neumorphic-peripheral/adapters/zod'
 * 
 * const schema = z.string().email().min(5)
 * np.input(element, { validate: zodAdapter(schema) })
 */

import { ValidationFunction, ValidationResult } from '../types'

// Type-only import to avoid bundling Zod when not used
type ZodSchema = any
type ZodError = any

/**
 * Creates a validation function from a Zod schema
 */
export function zodAdapter(schema: ZodSchema): ValidationFunction {
  return (value: string): string | null => {
    try {
      schema.parse(value)
      return null // Valid
    } catch (error: any) {
      // Extract first error message from Zod error
      if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        return error.errors[0].message
      }
      return 'Invalid value'
    }
  }
}

/**
 * Creates a comprehensive validation function that returns all errors
 */
export function zodAdapterDetailed(schema: ZodSchema): (value: string) => ValidationResult {
  return (value: string): ValidationResult => {
    try {
      schema.parse(value)
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error?.errors && Array.isArray(error.errors)) {
        errors.push(...error.errors.map((err: any) => err.message))
      } else {
        errors.push('Invalid value')
      }
      
      return { isValid: false, errors }
    }
  }
}

/**
 * Schema builder utilities for common patterns
 */
export const zodSchemas = {
  email: () => {
    // Dynamic import to avoid bundling issues
    return import('zod').then(({ z }) => 
      z.string().email('Please enter a valid email address')
    )
  },
  
  password: (minLength: number = 8) => {
    return import('zod').then(({ z }) => 
      z.string()
        .min(minLength, `Password must be at least ${minLength} characters`)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    )
  },
  
  phone: () => {
    return import('zod').then(({ z }) => 
      z.string().regex(
        /^\+?[1-9]\d{1,14}$/,
        'Please enter a valid phone number'
      )
    )
  },
  
  url: () => {
    return import('zod').then(({ z }) => 
      z.string().url('Please enter a valid URL')
    )
  },
  
  required: (message: string = 'This field is required') => {
    return import('zod').then(({ z }) => 
      z.string().min(1, message)
    )
  }
}

/**
 * Form-level validation using Zod
 */
export class ZodFormValidator {
  private schema: ZodSchema
  private fields: Map<HTMLElement, string> = new Map()

  constructor(schema: ZodSchema) {
    this.schema = schema
  }

  /**
   * Register a field with its schema key
   */
  registerField(element: HTMLElement, key: string): void {
    this.fields.set(element, key)
  }

  /**
   * Validate a specific field
   */
  validateField(element: HTMLElement): ValidationResult {
    const key = this.fields.get(element)
    if (!key) {
      return { isValid: true, errors: [] }
    }

    const value = this.getElementValue(element)
    
    try {
      // Validate just this field by picking from schema
      const fieldSchema = this.schema.pick({ [key]: true })
      fieldSchema.parse({ [key]: value })
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error?.errors && Array.isArray(error.errors)) {
        errors.push(...error.errors.map((err: any) => err.message))
      }
      
      return { isValid: false, errors }
    }
  }

  /**
   * Validate entire form
   */
  validateForm(): { isValid: boolean; errors: Record<string, string[]>; data?: any } {
    const formData: Record<string, any> = {}
    const errors: Record<string, string[]> = {}

    // Collect all field values
    this.fields.forEach((key, element) => {
      formData[key] = this.getElementValue(element)
    })

    try {
      const validatedData = this.schema.parse(formData)
      return { isValid: true, errors: {}, data: validatedData }
    } catch (error: any) {
      if (error?.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.')
          if (!errors[path]) {
            errors[path] = []
          }
          errors[path].push(err.message)
        })
      }
      
      return { isValid: false, errors }
    }
  }

  private getElementValue(element: HTMLElement): any {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        return element.checked
      }
      if (element.type === 'number') {
        return element.value ? Number(element.value) : undefined
      }
      return element.value
    }
    
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return element.value
    }
    
    return element.textContent || ''
  }
}

/**
 * Helper function to create form validator
 */
export function createZodFormValidator(schema: ZodSchema): ZodFormValidator {
  return new ZodFormValidator(schema)
}

/**
 * Integration with neumorphic components
 */
export const zodIntegration = {
  /**
   * Setup form validation with Zod schema
   */
  async setupForm(
    formElement: HTMLFormElement, 
    schema: ZodSchema,
    components: Record<string, any>
  ): Promise<ZodFormValidator> {
    const validator = new ZodFormValidator(schema)
    
    // Register all components with their field names
    Object.entries(components).forEach(([key, component]) => {
      if (component && component.element) {
        validator.registerField(component.element, key)
        
        // Setup real-time validation
        component.element.addEventListener('blur', () => {
          const result = validator.validateField(component.element)
          if (!result.isValid && component.clearErrors && component.validate) {
            component.clearErrors()
            // Create a validation function that returns the Zod result
            component.validate = () => result
          }
        })
      }
    })

    // Setup form submission validation
    formElement.addEventListener('submit', (e) => {
      e.preventDefault()
      
      const result = validator.validateForm()
      if (result.isValid) {
        // Form is valid, can submit
        const event = new CustomEvent('np:form-valid', {
          detail: { data: result.data }
        })
        formElement.dispatchEvent(event)
      } else {
        // Show field-specific errors
        Object.entries(result.errors).forEach(([fieldName, fieldErrors]) => {
          const component = components[fieldName]
          if (component && component.clearErrors) {
            component.clearErrors()
            // Set custom validation result
            component._validationResult = {
              isValid: false,
              errors: fieldErrors
            }
            component.updateValidationState?.()
          }
        })
        
        const event = new CustomEvent('np:form-invalid', {
          detail: { errors: result.errors }
        })
        formElement.dispatchEvent(event)
      }
    })

    return validator
  }
}

// Example usage documentation
export const examples = {
  basicField: `
    import { z } from 'zod'
    import { zodAdapter } from 'neumorphic-peripheral/adapters/zod'
    
    const emailSchema = z.string().email().min(5)
    np.input(emailElement, {
      validate: zodAdapter(emailSchema)
    })
  `,
  
  complexForm: `
    import { z } from 'zod'
    import { zodIntegration } from 'neumorphic-peripheral/adapters/zod'
    
    const formSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    })
    
    const components = {
      email: np.input(emailEl),
      password: np.password(passwordEl),
      confirmPassword: np.password(confirmEl)
    }
    
    const validator = await zodIntegration.setupForm(
      formElement, 
      formSchema, 
      components
    )
  `
}