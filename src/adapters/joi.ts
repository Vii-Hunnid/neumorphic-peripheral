/**
 * Joi Validation Adapter for Neumorphic Peripheral
 * 
 * This adapter allows you to use Joi schemas for validation
 * Install: npm install joi
 * 
 * Usage:
 * import Joi from 'joi'
 * import { joiAdapter } from 'neumorphic-peripheral/adapters/joi'
 * 
 * const schema = Joi.string().email().min(5)
 * np.input(element, { validate: joiAdapter(schema) })
 */

import { ValidationFunction, ValidationResult } from '../types'

// Type-only imports to avoid bundling Joi when not used
type JoiSchema = any
type JoiValidationError = any

/**
 * Creates a validation function from a Joi schema
 */
export function joiAdapter(schema: JoiSchema): ValidationFunction {
  return (value: string): string | null => {
    const result = schema.validate(value)
    
    if (result.error) {
      // Return first error message from Joi
      return result.error.details[0]?.message || 'Invalid value'
    }
    
    return null // Valid
  }
}

/**
 * Creates a comprehensive validation function that returns all errors
 */
export function joiAdapterDetailed(schema: JoiSchema): (value: string) => ValidationResult {
  return (value: string): ValidationResult => {
    const result = schema.validate(value, { abortEarly: false })
    
    if (result.error) {
      const errors = result.error.details.map((detail: any) => detail.message)
      return { isValid: false, errors }
    }
    
    return { isValid: true, errors: [] }
  }
}

/**
 * Async validation adapter for Joi schemas
 */
export function joiAdapterAsync(schema: JoiSchema): (value: string) => Promise<ValidationResult> {
  return async (value: string): Promise<ValidationResult> => {
    try {
      await schema.validateAsync(value, { abortEarly: false })
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error.details && Array.isArray(error.details)) {
        errors.push(...error.details.map((detail: any) => detail.message))
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
export const joiSchemas = {
  email: () => {
    return import('joi').then(Joi => 
      Joi.default.string().email({ tlds: { allow: false } }).required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      })
    )
  },
  
  password: (minLength: number = 8) => {
    return import('joi').then(Joi => 
      Joi.default.string()
        .min(minLength)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.min': `Password must be at least ${minLength} characters`,
          'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
          'any.required': 'Password is required'
        })
    )
  },
  
  phone: () => {
    return import('joi').then(Joi => 
      Joi.default.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
        .messages({
          'string.pattern.base': 'Please enter a valid phone number',
          'any.required': 'Phone number is required'
        })
    )
  },
  
  url: () => {
    return import('joi').then(Joi => 
      Joi.default.string().uri().required().messages({
        'string.uri': 'Please enter a valid URL',
        'any.required': 'URL is required'
      })
    )
  },
  
  required: (message: string = 'This field is required') => {
    return import('joi').then(Joi => 
      Joi.default.string().required().messages({
        'any.required': message
      })
    )
  },
  
  number: (min?: number, max?: number) => {
    return import('joi').then(Joi => {
      let schema = Joi.default.number()
      
      if (min !== undefined) {
        schema = schema.min(min)
      }
      
      if (max !== undefined) {
        schema = schema.max(max)
      }
      
      return schema.required().messages({
        'number.base': 'Must be a number',
        'number.min': `Must be at least ${min}`,
        'number.max': `Must be no more than ${max}`,
        'any.required': 'This field is required'
      })
    })
  },

  /**
   * Date validation schemas
   */
  date: () => {
    return import('joi').then(Joi => ({
      birthDate: Joi.default.date()
        .max('now')
        .min('1900-01-01')
        .messages({
          'date.max': 'Birth date cannot be in the future',
          'date.min': 'Birth date must be after 1900'
        }),
      
      futureDate: Joi.default.date()
        .min('now')
        .messages({
          'date.min': 'Date must be in the future'
        }),
      
      pastDate: Joi.default.date()
        .max('now')
        .messages({
          'date.max': 'Date must be in the past'
        }),

      ageRange: (minAge: number, maxAge: number) => 
        Joi.default.date()
          .max(new Date(Date.now() - minAge * 365.25 * 24 * 60 * 60 * 1000))
          .min(new Date(Date.now() - maxAge * 365.25 * 24 * 60 * 60 * 1000))
          .messages({
            'date.max': `Must be at least ${minAge} years old`,
            'date.min': `Must be no more than ${maxAge} years old`
          })
    }))
  }
}

/**
 * Form-level validation using Joi
 */
export class JoiFormValidator {
  private schema: JoiSchema
  private fields: Map<HTMLElement, string> = new Map()

  constructor(schema: JoiSchema) {
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
      // Try to extract field schema from object schema
      let fieldSchema: JoiSchema
      
      if (this.schema.extract) {
        fieldSchema = this.schema.extract(key)
      } else {
        // If extract is not available, create a simple test
        const testData = { [key]: value }
        const result = this.schema.validate(testData, { abortEarly: false, allowUnknown: true })
        
        if (result.error) {
          const fieldErrors = result.error.details
            .filter((detail: any) => detail.path[0] === key)
            .map((detail: any) => detail.message)
          
          return { isValid: fieldErrors.length === 0, errors: fieldErrors }
        }
        
        return { isValid: true, errors: [] }
      }
      
      const result = fieldSchema.validate(value, { abortEarly: false })
      
      if (result.error) {
        const errors = result.error.details.map((detail: any) => detail.message)
        return { isValid: false, errors }
      }
      
      return { isValid: true, errors: [] }
    } catch (error: any) {
      // Fallback: validate the whole object with just this field
      const testData = { [key]: value }
      const result = this.schema.validate(testData, { abortEarly: false, allowUnknown: true })
      
      if (result.error) {
        const fieldErrors = result.error.details
          .filter((detail: any) => detail.path[0] === key)
          .map((detail: any) => detail.message)
        
        return { isValid: fieldErrors.length === 0, errors: fieldErrors }
      }
      
      return { isValid: true, errors: [] }
    }
  }

  /**
   * Async field validation
   */
  async validateFieldAsync(element: HTMLElement): Promise<ValidationResult> {
    const key = this.fields.get(element)
    if (!key) {
      return { isValid: true, errors: [] }
    }

    const value = this.getElementValue(element)
    
    try {
      // Try async validation
      let fieldSchema: JoiSchema
      
      if (this.schema.extract) {
        fieldSchema = this.schema.extract(key)
        await fieldSchema.validateAsync(value, { abortEarly: false })
      } else {
        // Fallback to full object validation
        const testData = { [key]: value }
        const result = await this.schema.validateAsync(testData, { abortEarly: false, allowUnknown: true })
        
        return { isValid: true, errors: [] }
      }
      
      return { isValid: true, errors: [] }
    } catch (error: any) {
      const errors: string[] = []
      
      if (error.details && Array.isArray(error.details)) {
        errors.push(...error.details.map((detail: any) => detail.message))
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
  validateForm(): { isValid: boolean; errors: Record<string, string[]>; data?: any } {
    const formData: Record<string, any> = {}
    const errors: Record<string, string[]> = {}

    // Collect all field values
    this.fields.forEach((key, element) => {
      formData[key] = this.getElementValue(element)
    })

    const result = this.schema.validate(formData, { abortEarly: false })
    
    if (result.error) {
      result.error.details.forEach((detail: any) => {
        const path = detail.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(detail.message)
      })
      
      return { isValid: false, errors }
    }
    
    return { isValid: true, errors: {}, data: result.value }
  }

  /**
   * Async form validation
   */
  async validateFormAsync(): Promise<{ isValid: boolean; errors: Record<string, string[]>; data?: any }> {
    const formData: Record<string, any> = {}
    const errors: Record<string, string[]> = {}

    // Collect all field values
    this.fields.forEach((key, element) => {
      formData[key] = this.getElementValue(element)
    })

    try {
      const result = await this.schema.validateAsync(formData, { abortEarly: false })
      return { isValid: true, errors: {}, data: result }
    } catch (error: any) {
      if (error.details && Array.isArray(error.details)) {
        error.details.forEach((detail: any) => {
          const path = detail.path.join('.')
          if (!errors[path]) {
            errors[path] = []
          }
          errors[path].push(detail.message)
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
export function createJoiFormValidator(schema: JoiSchema): JoiFormValidator {
  return new JoiFormValidator(schema)
}

/**
 * Integration with neumorphic components
 */
export const joiIntegration = {
  /**
   * Setup form validation with Joi schema
   */
  setupForm(
    formElement: HTMLFormElement, 
    schema: JoiSchema,
    components: Record<string, any>
  ): JoiFormValidator {
    const validator = new JoiFormValidator(schema)
    
    // Register all components with their field names
    Object.entries(components).forEach(([key, component]) => {
      if (component && component.element) {
        validator.registerField(component.element, key)
        
        // Setup real-time validation
        component.element.addEventListener('blur', () => {
          const result = validator.validateField(component.element)
          if (!result.isValid && component.clearErrors && component.validate) {
            component.clearErrors()
            // Create a validation function that returns the Joi result
            component.validate = () => result
            component.updateValidationState?.()
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
  },

  /**
   * Setup async form validation
   */
  setupAsyncForm(
    formElement: HTMLFormElement, 
    schema: JoiSchema,
    components: Record<string, any>
  ): JoiFormValidator {
    const validator = new JoiFormValidator(schema)
    
    // Register all components with their field names
    Object.entries(components).forEach(([key, component]) => {
      if (component && component.element) {
        validator.registerField(component.element, key)
        
        // Setup real-time async validation
        component.element.addEventListener('blur', async () => {
          const result = await validator.validateFieldAsync(component.element)
          if (!result.isValid && component.clearErrors && component.validate) {
            component.clearErrors()
            component.validate = () => result
            component.updateValidationState?.()
          }
        })
      }
    })

    // Setup async form submission validation
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const result = await validator.validateFormAsync()
      if (result.isValid) {
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
   * Setup conditional validation based on other fields
   */
  setupConditionalValidation(
    component: any,
    schemaBuilder: (formData: Record<string, any>) => JoiSchema,
    getFormData: () => Record<string, any>
  ): void {
    if (!component || !component.element) return

    component.element.addEventListener('blur', () => {
      try {
        const formData = getFormData()
        const schema = schemaBuilder(formData)
        const fieldName = component.element.name || component.element.id
        const value = component.getValue ? component.getValue() : component.element.value
        
        let fieldSchema: JoiSchema
        if (schema.extract) {
          fieldSchema = schema.extract(fieldName)
        } else {
          // Use the full schema
          fieldSchema = schema
        }
        
        const result = fieldSchema.validate(value)
        
        if (result.error) {
          if (component.clearErrors && component.validate) {
            component.clearErrors()
            component._validationResult = {
              isValid: false,
              errors: [result.error.details[0]?.message || 'Invalid value']
            }
            component.updateValidationState?.()
          }
        } else {
          if (component.clearErrors) {
            component.clearErrors()
          }
        }
      } catch (error: any) {
        console.warn('Conditional validation error:', error.message)
      }
    })
  }
}

/**
 * Advanced Joi utilities for neumorphic components
 */
export const joiUtils = {
  /**
   * Create a cross-field validation schema
   */
  createCrossFieldValidation: async (dependencies: string[]) => {
    const Joi = await import('joi')
    
    return Joi.default.object().custom((value: any, helpers) => {
      // Example: password confirmation
      if (dependencies.includes('password') && dependencies.includes('confirmPassword')) {
        if (value.password !== value.confirmPassword) {
          return helpers.error('any.invalid', { 
            message: 'Passwords must match' 
          })
        }
      }
      
      return value
    })
  },

  /**
   * Create async validation (e.g., for username availability)
   */
  createAsyncValidation: (
    checkFunction: (value: string) => Promise<boolean>,
    errorMessage: string = 'Value is not available'
  ) => {
    return import('joi').then(Joi =>
      Joi.default.string().external(async (value: string) => {
        if (!value) return value // Let required handle empty values
        
        try {
          const isValid = await checkFunction(value)
          if (!isValid) {
            throw new Error(errorMessage)
          }
          return value
        } catch (error) {
          throw new Error(errorMessage)
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
    return import('joi').then(Joi =>
      Joi.default.alternatives().conditional(Joi.default.ref('$context'), {
        is: condition,
        then: trueSchema,
        otherwise: falseSchema || Joi.default.any()
      })
    )
  },

  /**
   * Create date validation with relative constraints
   */
  createDateValidation: () => {
    return import('joi').then(Joi => ({
      birthDate: Joi.default.date()
        .max('now')
        .min('1900-01-01')
        .messages({
          'date.max': 'Birth date cannot be in the future',
          'date.min': 'Birth date must be after 1900'
        }),
      
      futureDate: Joi.default.date()
        .min('now')
        .messages({
          'date.min': 'Date must be in the future'
        }),

      pastDate: Joi.default.date()
        .max('now')
        .messages({
          'date.max': 'Date must be in the past'
        }),
      
      ageRange: (minAge: number, maxAge: number) => 
        Joi.default.date()
          .max(new Date(Date.now() - minAge * 365.25 * 24 * 60 * 60 * 1000))
          .min(new Date(Date.now() - maxAge * 365.25 * 24 * 60 * 60 * 1000))
          .messages({
            'date.max': `Must be at least ${minAge} years old`,
            'date.min': `Must be no more than ${maxAge} years old`
          })
    }))
  },

  /**
   * Create file validation schemas
   */
  createFileValidation: () => {
    return import('joi').then(Joi => ({
      imageFile: Joi.default.object({
        mimetype: Joi.default.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp')
          .messages({
            'any.only': 'Only JPEG, PNG, GIF, and WebP images are allowed'
          }),
        size: Joi.default.number().max(5 * 1024 * 1024) // 5MB
          .messages({
            'number.max': 'File size must be less than 5MB'
          })
      }),

      documentFile: Joi.default.object({
        mimetype: Joi.default.string().valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
          .messages({
            'any.only': 'Only PDF and Word documents are allowed'
          }),
        size: Joi.default.number().max(10 * 1024 * 1024) // 10MB
          .messages({
            'number.max': 'File size must be less than 10MB'
          })
      })
    }))
  }
}

// Example usage documentation
export const examples = {
  basicField: `
    import Joi from 'joi'
    import { joiAdapter } from 'neumorphic-peripheral/adapters/joi'
    
    const emailSchema = Joi.string().email().required()
    np.input(emailElement, {
      validate: joiAdapter(emailSchema)
    })
  `,
  
  asyncValidation: `
    import { joiUtils } from 'neumorphic-peripheral/adapters/joi'
    
    const checkUsernameAvailability = async (username) => {
      const response = await fetch(\`/api/check-username/\${username}\`)
      return response.ok
    }
    
    const usernameSchema = await joiUtils.createAsyncValidation(
      checkUsernameAvailability,
      'Username is already taken'
    )
    
    np.input(usernameElement, {
      validate: joiAdapterAsync(usernameSchema)
    })
  `,
  
  complexForm: `
    import Joi from 'joi'
    import { joiIntegration } from 'neumorphic-peripheral/adapters/joi'
    
    const formSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
          'any.only': 'Passwords must match'
        }),
      age: Joi.number().min(18).required().messages({
        'number.min': 'Must be at least 18 years old'
      })
    })
    
    const components = {
      email: np.input(emailEl),
      password: np.password(passwordEl),
      confirmPassword: np.password(confirmEl),
      age: np.input(ageEl)
    }
    
    const validator = joiIntegration.setupForm(
      formElement, 
      formSchema, 
      components
    )
  `,
  
  dateValidation: `
    import { joiUtils } from 'neumorphic-peripheral/adapters/joi'
    
    const dateSchemas = await joiUtils.createDateValidation()
    
    // Birth date validation
    np.input(birthDateEl, {
      validate: joiAdapter(dateSchemas.birthDate)
    })
    
    // Age range validation (18-65 years old)
    np.input(dobEl, {
      validate: joiAdapter(dateSchemas.ageRange(18, 65))
    })
  `,

  fileValidation: `
    import { joiUtils } from 'neumorphic-peripheral/adapters/joi'
    
    const fileSchemas = await joiUtils.createFileValidation()
    
    // Image file validation
    np.input(imageUploadEl, {
      validate: joiAdapter(fileSchemas.imageFile)
    })
    
    // Document file validation
    np.input(documentUploadEl, {
      validate: joiAdapter(fileSchemas.documentFile)
    })
  `
}