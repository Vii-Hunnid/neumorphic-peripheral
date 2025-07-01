import { TextareaConfig, InputInstance } from '../types'
import { BaseComponent } from './base'
import { addClassName, getElementValue, setElementValue, debounce } from '../utils'
import { validateValue, globalValidationManager } from '../validators'

export class TextareaComponent extends BaseComponent implements InputInstance {
  private _textareaConfig: TextareaConfig
  private _validationResult: any = null
  private _debouncedValidate: () => void
  private _resizeObserver?: ResizeObserver

  constructor(element: HTMLElement, config: TextareaConfig = {}) {
    if (!(element instanceof HTMLTextAreaElement)) {
      throw new Error('Textarea component requires an HTMLTextAreaElement')
    }

    super(element, config)
    this._textareaConfig = {
      autoResize: true,
      maxHeight: '200px',
      minHeight: '80px',
      validateOn: 'blur',
      showValidation: true,
      ...config
    }

    this._debouncedValidate = debounce(() => this.performValidation(), 300)
  }

  get textareaElement(): HTMLTextAreaElement {
    return this._element as HTMLTextAreaElement
  }

  protected init(): void {
    this.applyBaseStyles()
    this.applyTextareaStyles()
    this.setupAutoResize()
    this.setupValidation()
  }

  protected bindEvents(): void {
    super.bindEvents()

    // Focus events
    this.addEventListener(this._element, 'focus', this.handleFocus.bind(this))
    this.addEventListener(this._element, 'blur', this.handleBlur.bind(this))

    // Input validation events
    if (this._textareaConfig.validateOn === 'change') {
      this.addEventListener(this._element, 'input', this._debouncedValidate)
    } else if (this._textareaConfig.validateOn === 'blur') {
      this.addEventListener(this._element, 'blur', () => this.performValidation())
    }

    // Auto-resize on input
    if (this._textareaConfig.autoResize) {
      this.addEventListener(this._element, 'input', () => this.autoResize())
    }

    // Custom input event
    this.addEventListener(this._element, 'input', () => {
      this.emit('input', { value: this.getValue() })
    })
  }

  private applyTextareaStyles(): void {
    addClassName(this._element, 'textarea')

    // Core textarea styles
    this._element.style.boxShadow = this.createShadowStyle('inset')
    this._element.style.padding = '12px 16px'
    this._element.style.fontSize = '16px'
    this._element.style.lineHeight = '1.5'
    this._element.style.width = this._element.style.width || '100%'
    this._element.style.boxSizing = 'border-box'
    this._element.style.resize = this._textareaConfig.autoResize ? 'none' : 'vertical'
    this._element.style.minHeight = this._textareaConfig.minHeight!
    this._element.style.maxHeight = this._textareaConfig.maxHeight!
    this._element.style.fontFamily = 'inherit'

    // Placeholder styling
    this.applyPlaceholderStyles()

    // Set up hover and focus effects
    this.setupInteractionEffects()
  }

  private applyPlaceholderStyles(): void {
    if (this._textareaConfig.placeholder) {
      this.textareaElement.placeholder = this._textareaConfig.placeholder
    }

    // Reuse placeholder styles from input component
    const placeholderColor = `color: ${this._theme.colors.textSecondary}; opacity: 1;`
    const styleId = 'np-textarea-placeholder-styles'
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .np-textarea::placeholder {
          ${placeholderColor}
        }
        .np-textarea::-webkit-input-placeholder {
          ${placeholderColor}
        }
        .np-textarea::-moz-placeholder {
          ${placeholderColor}
        }
        .np-textarea:-ms-input-placeholder {
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
      if (!this._config.disabled && !this.textareaElement.matches(':focus')) {
        this._element.style.boxShadow = this.createHoverShadowStyle('inset')
      }
    })

    this.addEventListener(this._element, 'mouseleave', () => {
      if (!this.textareaElement.matches(':focus')) {
        this._element.style.boxShadow = originalShadow
      }
    })
  }

  private setupAutoResize(): void {
    if (!this._textareaConfig.autoResize) return

    // Set initial height
    this.autoResize()

    // Use ResizeObserver if available for better performance
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        this.autoResize()
      })
      this._resizeObserver.observe(this._element)
    }
  }

  private autoResize(): void {
    if (!this._textareaConfig.autoResize) return

    const element = this.textareaElement
    const minHeight = parseInt(this._textareaConfig.minHeight!) || 80
    const maxHeight = parseInt(this._textareaConfig.maxHeight!) || 200

    // Reset height to auto to get the scroll height
    element.style.height = 'auto'
    
    // Calculate new height
    const scrollHeight = element.scrollHeight
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    
    // Apply new height
    element.style.height = `${newHeight}px`
    
    // Show/hide scrollbar based on content
    element.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'

    // Emit resize event
    this.emit('resize', { 
      height: newHeight,
      scrollHeight,
      isScrollable: scrollHeight > maxHeight
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
    if (!this._textareaConfig.validate) return

    // Set up ARIA attributes for accessibility
    this._element.setAttribute('aria-invalid', 'false')
    
    if (this._textareaConfig.errorMessage) {
      const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this._element.setAttribute('aria-describedby', errorId)
    }
  }

  private performValidation(): any {
    if (!this._textareaConfig.validate || !this._textareaConfig.showValidation) return

    const value = this.getValue()
    this._validationResult = validateValue(value, this._textareaConfig.validate)
    
    // Update global validation manager
    globalValidationManager.validate(this._element, this._textareaConfig.validate)

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
  validate(): any {
    return this.performValidation() || { isValid: true, errors: [] }
  }

  getValue(): string {
    return getElementValue(this._element)
  }

  setValue(value: string): void {
    setElementValue(this._element, value)
    this.emit('input', { value })
    
    // Trigger auto-resize and validation
    if (this._textareaConfig.autoResize) {
      this.autoResize()
    }
    
    if (this._textareaConfig.validateOn === 'change') {
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
    this.textareaElement.focus()
  }

  blur(): void {
    this.textareaElement.blur()
  }

  select(): void {
    this.textareaElement.select()
  }

  isValid(): boolean {
    return this._validationResult ? this._validationResult.isValid : true
  }

  getValidationResult(): any {
    return this._validationResult
  }

  // Textarea-specific methods
  insertAtCursor(text: string): void {
    const element = this.textareaElement
    const startPos = element.selectionStart || 0
    const endPos = element.selectionEnd || 0
    const value = element.value

    element.value = value.substring(0, startPos) + text + value.substring(endPos)
    element.selectionStart = element.selectionEnd = startPos + text.length
    
    if (this._textareaConfig.autoResize) {
      this.autoResize()
    }
    
    this.emit('input', { value: element.value })
  }

  getSelection(): { start: number; end: number; text: string } {
    const element = this.textareaElement
    return {
      start: element.selectionStart || 0,
      end: element.selectionEnd || 0,
      text: element.value.substring(element.selectionStart || 0, element.selectionEnd || 0)
    }
  }

  setSelection(start: number, end: number): void {
    this.textareaElement.setSelectionRange(start, end)
  }

  protected onUpdate(newConfig: Partial<TextareaConfig>): void {
    const oldConfig = { ...this._textareaConfig }
    this._textareaConfig = { ...this._textareaConfig, ...newConfig }

    // Update placeholder
    if (newConfig.placeholder !== oldConfig.placeholder) {
      this.applyPlaceholderStyles()
    }

    // Update auto-resize settings
    if (newConfig.autoResize !== oldConfig.autoResize) {
      if (newConfig.autoResize) {
        this.setupAutoResize()
      } else {
        this._element.style.resize = 'vertical'
        if (this._resizeObserver) {
          this._resizeObserver.disconnect()
          this._resizeObserver = undefined
        }
      }
    }

    // Update height constraints
    if (newConfig.minHeight !== oldConfig.minHeight) {
      this._element.style.minHeight = newConfig.minHeight!
    }
    
    if (newConfig.maxHeight !== oldConfig.maxHeight) {
      this._element.style.maxHeight = newConfig.maxHeight!
    }

    // Update validation configuration
    if (newConfig.validate !== oldConfig.validate) {
      this.clearErrors()
      if (newConfig.validate) {
        this.setupValidation()
      }
    }
  }

  protected onDestroy(): void {
    globalValidationManager.clearValidation(this._element)
    
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = undefined
    }
  }
}

// Factory function for easy usage
export function textarea(element: HTMLElement, config: TextareaConfig = {}): TextareaComponent {
  return new TextareaComponent(element, config)
}