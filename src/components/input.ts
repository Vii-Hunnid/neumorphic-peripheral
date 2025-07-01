import { InputConfig, InputInstance, ValidationResult } from '../types'
import { BaseComponent } from './base'
import { addClassName, getElementValue, setElementValue, debounce } from '../utils'
import { validateValue, globalValidationManager } from '../validators'

export class InputComponent extends BaseComponent implements InputInstance {
  private _inputConfig: InputConfig
  private _validationResult: ValidationResult | null = null
  private _debouncedValidate: () => void

  constructor(element: HTMLElement, config: InputConfig = {}) {
    if (!(element instanceof HTMLInputElement)) {
      throw new Error('Input component requires an HTMLInputElement')
    }

    super(element, config)
    this._inputConfig = {
      validateOn: 'blur',
      showValidation: true,
      ...config
    }

    this._debouncedValidate = debounce(() => this.performValidation(), 300)
  }

  get inputElement(): HTMLInputElement {
    return this._element as HTMLInputElement
  }

  protected init(): void {
    this.applyBaseStyles()
    this.applyInputStyles()
    this.setupValidation()
  }

  protected bindEvents(): void {
    super.bindEvents()

    // Focus events
    this.addEventListener(this._element, 'focus', this.handleFocus.bind(this))
    this.addEventListener(this._element, 'blur', this.handleBlur.bind(this))

    // Input validation events
    if (this._inputConfig.validateOn === 'change') {
      this.addEventListener(this._element, 'input', this._debouncedValidate)
    } else if (this._inputConfig.validateOn === 'blur') {
      this.addEventListener(this._element, 'blur', () => this.performValidation())
    }

    // Custom input event
    this.addEventListener(this._element, 'input', () => {
      this.emit('input', { value: this.getValue() })
    })
  }

  private applyInputStyles(): void {
    addClassName(this._element, 'input')

    // Core input styles
    this._element.style.boxShadow = this.createShadowStyle('inset')
    this._element.style.padding = '12px 16px'
    this._element.style.fontSize = '16px'
    this._element.style.lineHeight = '1.5'
    this._element.style.width = this._element.style.width || '100%'
    this._element.style.boxSizing = 'border-box'

    // Placeholder styling
    this.applyPlaceholderStyles()

    // Set up hover and focus effects
    this.setupInteractionEffects()
  }

  private applyPlaceholderStyles(): void {
    if (this._inputConfig.placeholder) {
      this.inputElement.placeholder = this._inputConfig.placeholder
    }

    // Create placeholder color CSS if it doesn't exist
    const placeholderColor = `color: ${this._theme.colors.textSecondary}; opacity: 1;`
    const styleId = 'np-placeholder-styles'
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .np-input::placeholder {
          ${placeholderColor}
        }
        .np-input::-webkit-input-placeholder {
          ${placeholderColor}
        }
        .np-input::-moz-placeholder {
          ${placeholderColor}
        }
        .np-input:-ms-input-placeholder {
          ${placeholderColor}
        }
      `
      document.head.appendChild(style)
    }
  }

  private setupInteractionEffects(): void {
    const originalShadow = this.createShadowStyle('inset')
    const focusShadow = `${this.createShadowStyle('inset')}, 0 0 0 2px ${this._theme.colors.accent}40`

    this.addEventListener(this._element, 'mouseenter', () => {
      if (!this._config.disabled && !this.inputElement.matches(':focus')) {
        this._element.style.boxShadow = this.createHoverShadowStyle('inset')
      }
    })

    this.addEventListener(this._element, 'mouseleave', () => {
      if (!this.inputElement.matches(':focus')) {
        this._element.style.boxShadow = originalShadow
      }
    })
  }

  private handleFocus(): void {
    addClassName(this._element, 'focused')
    this._element.style.boxShadow = `${this.createShadowStyle('inset')}, 0 0 0 2px ${this._theme.colors.accent}40`
    this.emit('focus')
  }

  private handleBlur(): void {
    this._element.classList.remove('np-focused')
    this._element.style.boxShadow = this.createShadowStyle('inset')
    this.emit('blur')
  }

  private setupValidation(): void {
    if (!this._inputConfig.validate) return

    // Set up ARIA attributes for accessibility
    this._element.setAttribute('aria-invalid', 'false')
    
    if (this._inputConfig.errorMessage) {
      const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this._element.setAttribute('aria-describedby', errorId)
    }
  }

  private performValidation(): void {
    if (!this._inputConfig.validate || !this._inputConfig.showValidation) return

    const value = this.getValue()
    this._validationResult = validateValue(value, this._inputConfig.validate)
    
    // Update global validation manager
    globalValidationManager.validate(this._element, this._inputConfig.validate)

    // Update visual state
    this.updateValidationState()

    // Emit validation event
    this.emit('validation', { 
      result: this._validationResult,
      value 
    })

    return this._validationResult
  }

  private updateValidationState(): void {
    if (!this._validationResult) return

    // Update ARIA attributes
    this._element.setAttribute('aria-invalid', this._validationResult.isValid ? 'false' : 'true')

    if (this._validationResult.isValid) {
      this._element.classList.remove('np-error')
      this._element.style.boxShadow = this.createShadowStyle('inset')
    } else {
      addClassName(this._element, 'error')
      this._element.style.boxShadow = `${this.createShadowStyle('inset')}, 0 0 0 2px ${this._theme.colors.error}40`
    }
  }

  // Public API methods
  validate(): ValidationResult {
    return this.performValidation() || { isValid: true, errors: [] }
  }

  getValue(): string {
    return getElementValue(this._element)
  }

  setValue(value: string): void {
    setElementValue(this._element, value)
    this.emit('input', { value })
    
    // Trigger validation if configured
    if (this._inputConfig.validateOn === 'change') {
      this._debouncedValidate()
    }
  }

  clearErrors(): void {
    this._validationResult = null
    globalValidationManager.clearValidation(this._element)
    this._element.classList.remove('np-error')
    this._element.setAttribute('aria-invalid', 'false')
    this._element.style.boxShadow = this.createShadowStyle('inset')
  }

  focus(): void {
    this.inputElement.focus()
  }

  blur(): void {
    this.inputElement.blur()
  }

  select(): void {
    this.inputElement.select()
  }

  isValid(): boolean {
    return this._validationResult ? this._validationResult.isValid : true
  }

  getValidationResult(): ValidationResult | null {
    return this._validationResult
  }

  protected onUpdate(newConfig: Partial<InputConfig>): void {
    const oldConfig = { ...this._inputConfig }
    this._inputConfig = { ...this._inputConfig, ...newConfig }

    // Update placeholder
    if (newConfig.placeholder !== oldConfig.placeholder) {
      this.applyPlaceholderStyles()
    }

    // Update validation configuration
    if (newConfig.validate !== oldConfig.validate) {
      this.clearErrors()
      if (newConfig.validate) {
        this.setupValidation()
      }
    }

    // Update validation timing
    if (newConfig.validateOn !== oldConfig.validateOn) {
      // Re-bind validation events
      this.bindEvents()
    }
  }

  protected onDestroy(): void {
    globalValidationManager.clearValidation(this._element)
  }
}

// Factory function for easy usage
export function input(element: HTMLElement, config: InputConfig = {}): InputComponent {
  return new InputComponent(element, config)
}