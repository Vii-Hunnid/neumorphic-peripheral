import { InputComponent, input } from '../../components/input'
import { globalValidationManager } from '../../validators'

describe('InputComponent', () => {
  let element: HTMLInputElement

  beforeEach(() => {
    element = document.createElement('input')
    element.type = 'text'
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
    globalValidationManager.clearValidation(element)
  })

  describe('initialization', () => {
    it('should create an input component with default config', () => {
      const inputInstance = new InputComponent(element)
      
      expect(inputInstance.element).toBe(element)
      expect(inputInstance.config).toMatchObject({
        validateOn: 'blur',
        showValidation: true
      })
    })

    it('should throw error for non-input element', () => {
      const div = document.createElement('div')
      expect(() => {
        new InputComponent(div)
      }).toThrow('Input component requires an HTMLInputElement')
    })

    it('should apply base classes and styles', () => {
      new InputComponent(element)
      
      expect(element.classList.contains('np-component')).toBe(true)
      expect(element.classList.contains('np-input')).toBe(true)
      expect(element.style.boxShadow).toContain('inset')
    })
  })

  describe('validation', () => {
    it('should validate email format', () => {
      const inputInstance = new InputComponent(element, {
        validate: { email: true }
      })

      inputInstance.setValue('invalid-email')
      const result = inputInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Please enter a valid email address')
    })

    it('should validate required fields', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true }
      })

      inputInstance.setValue('')
      const result = inputInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('This field is required')
    })

    it('should validate minimum length', () => {
      const inputInstance = new InputComponent(element, {
        validate: { minLength: 5 }
      })

      inputInstance.setValue('abc')
      const result = inputInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Must be at least 5 characters')
    })

    it('should pass validation for valid input', () => {
      const inputInstance = new InputComponent(element, {
        validate: { email: true, required: true }
      })

      inputInstance.setValue('test@example.com')
      const result = inputInstance.validate()

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle custom validation', () => {
      const customValidator = (value: string) => 
        value.includes('test') ? null : 'Must contain "test"'

      const inputInstance = new InputComponent(element, {
        validate: customValidator
      })

      inputInstance.setValue('hello')
      const result = inputInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Must contain "test"')
    })

    it('should update validation state visually', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true }
      })

      inputInstance.setValue('')
      inputInstance.validate()

      expect(element.classList.contains('np-error')).toBe(true)
      expect(element.getAttribute('aria-invalid')).toBe('true')

      inputInstance.setValue('valid')
      inputInstance.validate()

      expect(element.classList.contains('np-error')).toBe(false)
      expect(element.getAttribute('aria-invalid')).toBe('false')
    })
  })

  describe('interaction', () => {
    it('should handle focus and blur events', () => {
      const inputInstance = new InputComponent(element)

      element.dispatchEvent(new Event('focus'))
      expect(element.classList.contains('np-focused')).toBe(true)

      element.dispatchEvent(new Event('blur'))
      expect(element.classList.contains('np-focused')).toBe(false)
    })

    it('should emit custom events', (done) => {
      const inputInstance = new InputComponent(element)
      let eventCount = 0

      element.addEventListener('np:input', (e: any) => {
        expect(e.detail.value).toBe('test')
        eventCount++
        if (eventCount === 1) done()
      })

      inputInstance.setValue('test')
    })

    it('should handle validation on different triggers', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true },
        validateOn: 'change'
      })

      inputInstance.setValue('')
      // Should trigger validation on change
      element.dispatchEvent(new Event('input'))
      
      // Wait for debounced validation
      setTimeout(() => {
        expect(inputInstance.isValid()).toBe(false)
      }, 350)
    })
  })

  describe('value management', () => {
    it('should get and set values correctly', () => {
      const inputInstance = new InputComponent(element)

      inputInstance.setValue('test value')
      expect(inputInstance.getValue()).toBe('test value')
      expect(element.value).toBe('test value')
    })

    it('should clear errors', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true }
      })

      inputInstance.setValue('')
      inputInstance.validate()
      expect(inputInstance.isValid()).toBe(false)

      inputInstance.clearErrors()
      expect(inputInstance.isValid()).toBe(true)
      expect(element.classList.contains('np-error')).toBe(false)
    })
  })

  describe('configuration updates', () => {
    it('should update validation configuration', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true }
      })

      inputInstance.update({
        validate: { email: true }
      })

      inputInstance.setValue('invalid-email')
      const result = inputInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Please enter a valid email address')
    })

    it('should update placeholder', () => {
      const inputInstance = new InputComponent(element)

      inputInstance.update({
        placeholder: 'New placeholder'
      })

      expect(element.placeholder).toBe('New placeholder')
    })
  })

  describe('accessibility', () => {
    it('should set proper ARIA attributes', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true }
      })

      expect(element.getAttribute('aria-invalid')).toBe('false')

      inputInstance.setValue('')
      inputInstance.validate()

      expect(element.getAttribute('aria-invalid')).toBe('true')
    })
  })

  describe('factory function', () => {
    it('should create input instance using factory function', () => {
      const inputInstance = input(element, { 
        validate: { email: true } 
      })
      
      expect(inputInstance).toBeInstanceOf(InputComponent)
    })
  })

  describe('destruction', () => {
    it('should clean up validation when destroyed', () => {
      const inputInstance = new InputComponent(element, {
        validate: { required: true }
      })

      inputInstance.setValue('')
      inputInstance.validate()

      expect(globalValidationManager.getValidationState(element)).toBeTruthy()

      inputInstance.destroy()

      expect(globalValidationManager.getValidationState(element)).toBeNull()
    })
  })
})