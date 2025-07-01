/**
 * Yup Validation Adapter for Neumorphic Peripheral
 * 
 * This adapter allows you to use Yup schemas for validation
 * Install: npm install yup
 * 
 * Usage:
 * import * as yup from 'yup'
 * import { yupAdapter } from 'neumorphic-peripheral/adapters/yup'
 * 
 * const schema = yup.string().email().min(5)
 * np.input(element, { validate: yupAdapter(schema) })
 */

import { ValidationFunction, ValidationResult } from '../types'

// Type-only imports to avoid bundling Yup when not used
type YupSchema = any
type YupValidationError = any

/**
 * Creates a validation function from a Yup schema
 */
export function yupAdapter(schema: YupSchema): ValidationFunction {
  return (value: string): string | null => {
    try {
      schema.validateSync(value)
      return null // Valid
    } catch (error: any) {
      // Return first error message from Yup
      return error.message || 'Invalid value'
    }
  }
}

/**
 * Creates a comprehensive validation function that returns all errors
 */
export function yupAdapterDetailed(schema: YupSchema): (value: string) => ValidationResult {
  return (value: string): ValidationResult => {
    try {
      schema.validateSync(value, { abortEarly: false })
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error.inner && Array.isArray(error.inner)) {
        errors.push(...error.inner.map((err: any) => err.message))
      } else if (error.message) {
        errors.push(error.message)
      } else {
        errors.push('Invalid value')
      }
      
      return { isValid: false, errors }
    }
  }
}

/**
 * Async validation adapter for Yup schemas
 */
export function yupAdapterAsync(schema: YupSchema): (value: string) => Promise<ValidationResult> {
  return async (value: string): Promise<ValidationResult> => {
    try {
      await schema.validate(value, { abortEarly: false })
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error.inner && Array.isArray(error.inner)) {
        errors.push(...error.inner.map((err: any) => err.message))
      } else if (error.message) {
        errors.push(error.message)
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
export const yupSchemas = {
  email: () => {
    return import('yup').then(yup => 
      yup.string().email('Please enter a valid email address').required('Email is required')
    )
  },
  
  password: (minLength: number = 8) => {
    return import('yup').then(yup => 
      yup.string()
        .min(minLength, `Password must be at least ${minLength} characters`)
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .required('Password is required')
    )
  },
  
  phone: () => {
    return import('yup').then(yup => 
      yup.string()
        .matches(
          /^\+?[1-9]\d{1,14}$/,
          'Please enter a valid phone number'
        )
        .required('Phone number is required')
    )
  },
  
  url: () => {
    return import('yup').then(yup => 
      yup.string().url('Please enter a valid URL').required('URL is required')
    )
  },
  
  required: (message: string = 'This field is required') => {
    return import('yup').then(yup => 
      yup.string().required(message)
    )
  },
  
  number: (min?: number, max?: number) => {
    return import('yup').then(yup => {
      let schema = yup.number().typeError('Must be a number')
      
      if (min !== undefined) {
        schema = schema.min(min, `Must be at least ${min}`)
      }
      
      if (max !== undefined) {
        schema = schema.max(max, `Must be no more than ${max}`)
      }
      
      return schema.required('This field is required')
    })
  }
}

/**
 * Form-level validation using Yup
 */
export class YupFormValidator {
  private schema: YupSchema
  private fields: Map<HTMLElement, string> = new Map()

  constructor(schema: YupSchema) {
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
  async validateField(element: HTMLElement): Promise<ValidationResult> {
    const key = this.fields.get(element)
    if (!key) {
      return { isValid: true, errors: [] }
    }

    const value = this.getElementValue(element)
    
    try {
      // Get field schema from object schema
      const fieldSchema = this.schema.fields[key]
      if (!fieldSchema) {
        return { isValid: true, errors: [] }
      }
      
      await fieldSchema.validate(value, { abortEarly: false })
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error.inner && Array.isArray(error.inner)) {
        errors.push(...error.inner.map((err: any) => err.message))
      } else if (error.message) {
        errors.push(error.message)
      } else {
        errors.push('Invalid value')
      }
      
      return { isValid: false, errors }
    }
  }

  /**
   * Validate entire form
   */
  async validateForm(): Promise<{ isValid: boolean; errors: Record<string, string[]>; data?: any }> {
    const formData: Record<string, any> = {}
    const errors: Record<string, string[]> = {}

    // Collect all field values
    this.fields.forEach((key, element) => {
      formData[key] = this.getElementValue(element)
    })

    try {
      const validatedData = await this.schema.validate(formData, { abortEarly: false })
      return { isValid: true, errors: {}, data: validatedData }
    } catch (error: any) {
      if (error.inner && Array.isArray(error.inner)) {
        error.inner.forEach((err: any) => {
          const path = err.path || 'unknown'
          if (!errors[path]) {
            errors[path] = []
          }
          errors[path].push(err.message)
        })
      } else if (error.message) {
        errors.general = [error.message]
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
      if (element.type === 'date') {
        return element.value ? new Date(element.value) : undefined
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
export function createYupFormValidator(schema: YupSchema): YupFormValidator {
  return new YupFormValidator(schema)
}

/**
 * Integration with neumorphic components
 */
export const yupIntegration = {
  /**
   * Setup form validation with Yup schema
   */
  async setupForm(
    formElement: HTMLFormElement, 
    schema: YupSchema,
    components: Record<string, any>
  ): Promise<YupFormValidator> {
    const validator = new YupFormValidator(schema)
    
    // Register all components with their field names
    Object.entries(components).forEach(([key, component]) => {
      if (component && component.element) {
        validator.registerField(component.element, key)
        
        // Setup real-time validation
        component.element.addEventListener('blur', async () => {
          const result = await validator.validateField(component.element)
          if (!result.isValid && component.clearErrors && component.validate) {
            component.clearErrors()
            // Create a validation function that returns the Yup result
            component.validate = () => result
            component.updateValidationState?.()
          }
        })
      }
    })

    // Setup form submission validation
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const result = await validator.validateForm()
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
  },

  /**
   * Setup field-level validation with conditional schemas
   */
  setupConditionalValidation(
    component: any,
    schemaBuilder: (formData: Record<string, any>) => YupSchema,
    getFormData: () => Record<string, any>
  ): void {
    if (!component || !component.element) return

    component.element.addEventListener('blur', async () => {
      try {
        const formData = getFormData()
        const schema = schemaBuilder(formData)
        const fieldName = component.element.name || component.element.id
        
        if (schema.fields && schema.fields[fieldName]) {
          const value = component.getValue ? component.getValue() : component.element.value
          await schema.fields[fieldName].validate(value)
          
          if (component.clearErrors) {
            component.clearErrors()
          }
        }
      } catch (error: any) {
        if (component.clearErrors && component.validate) {
          component.clearErrors()
          component._validationResult = {
            isValid: false,
            errors: [error.message || 'Invalid value']
          }
          component.updateValidationState?.()
        }
      }
    })
  }
}

/**
 * Advanced Yup utilities for neumorphic components
 */
export const yupUtils = {
  /**
   * Create a cross-field validation schema
   */
  createCrossFieldValidation: async (dependencies: string[]) => {
    const yup = await import('yup')
    
    return yup.object().test(
      'cross-field',
      'Fields must match',
      function(value: any) {
        const { path, createError } = this
        
        // Example: password confirmation
        if (dependencies.includes('password') && dependencies.includes('confirmPassword')) {
          if (value.password !== value.confirmPassword) {
            return createError({
              path: 'confirmPassword',
              message: 'Passwords must match'
            })
          }
        }
        
        return true
      }
    )
  },

  /**
   * Create async validation (e.g., for username availability)
   */
  createAsyncValidation: (
    checkFunction: (value: string) => Promise<boolean>,
    errorMessage: string = 'Value is not available'
  ) => {
    return import('yup').then(yup =>
      yup.string().test('async-validation', errorMessage, async function(value) {
        if (!value) return true // Let required handle empty values
        
        try {
          const isValid = await checkFunction(value)
          return isValid
        } catch {
          return false
        }
      })
    )
  },

  /**
   * Create conditional validation based on other fields
   */
  createConditionalValidation: (
    condition: (formData: any) => boolean,
    trueSchema: any,
    falseSchema?: any
  ) => {
    return import('yup').then(yup =>
      yup.mixed().when('$context', (context: any, schema: any) => {
        return condition(context) ? trueSchema : (falseSchema || schema)
      })
    )
  }
}

// Example usage documentation
export const examples = {
  basicField: `
    import * as yup from 'yup'
    import { yupAdapter } from 'neumorphic-peripheral/adapters/yup'
    
    const emailSchema = yup.string().email().required()
    np.input(emailElement, {
      validate: yupAdapter(emailSchema)
    })
  `,
  
  asyncValidation: `
    import { yupUtils } from 'neumorphic-peripheral/adapters/yup'
    
    const checkUsernameAvailability = async (username) => {
      const response = await fetch(\`/api/check-username/\${username}\`)
      return response.ok
    }
    
    const usernameSchema = await yupUtils.createAsyncValidation(
      checkUsernameAvailability,
      'Username is already taken'
    )
    
    np.input(usernameElement, {
      validate: yupAdapterAsync(usernameSchema)
    })
  `,
  
  complexForm: `
    import * as yup from 'yup'
    import { yupIntegration } from 'neumorphic-peripheral/adapters/yup'
    
    const formSchema = yup.object({
      email: yup.string().email().required(),
      password: yup.string().min(8).required(),
      confirmPassword: yup.string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required(),
      age: yup.number().min(18, 'Must be at least 18').required()
    })
    
    const components = {
      email: np.input(emailEl),
      password: np.password(passwordEl),
      confirmPassword: np.password(confirmEl),
      age: np.input(ageEl)
    }
    
    const validator = await yupIntegration.setupForm(
      formElement, 
      formSchema, 
      components
    )
  `
}