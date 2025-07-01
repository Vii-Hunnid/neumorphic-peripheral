import { ButtonConfig } from '../types'
import { BaseComponent } from './base'
import { addClassName, getSizeValue, createElement } from '../utils'

export class ButtonComponent extends BaseComponent {
  private _buttonConfig: ButtonConfig
  private _loadingSpinner?: HTMLElement
  private _originalContent?: string

  constructor(element: HTMLElement, config: ButtonConfig = {}) {
    if (!(element instanceof HTMLButtonElement)) {
      throw new Error('Button component requires an HTMLButtonElement')
    }

    super(element, config)
    this._buttonConfig = {
      variant: 'primary',
      size: 'md',
      loading: false,
      ...config
    }
  }

  get buttonElement(): HTMLButtonElement {
    return this._element as HTMLButtonElement
  }

  protected init(): void {
    this.applyBaseStyles()
    this.applyButtonStyles()
    this.setupInteractions()
  }

  protected bindEvents(): void {
    super.bindEvents()

    // Click handler
    this.addEventListener(this._element, 'click', (e) => {
      if (this._config.disabled || this._buttonConfig.loading) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      if (this._buttonConfig.onClick) {
        this._buttonConfig.onClick(e)
      }

      this.emit('click', { event: e })
    })

    // Keyboard handler
    this.addEventListener(this._element, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.buttonElement.click()
      }
    })
  }

  private applyButtonStyles(): void {
    addClassName(this._element, 'button')
    addClassName(this._element, `button-${this._buttonConfig.variant}`)
    addClassName(this._element, `button-${this._buttonConfig.size}`)

    // Core button styles
    this._element.style.cursor = 'pointer'
    this._element.style.userSelect = 'none'
    this._element.style.display = 'inline-flex'
    this._element.style.alignItems = 'center'
    this._element.style.justifyContent = 'center'
    this._element.style.gap = '8px'
    this._element.style.fontWeight = '500'
    this._element.style.textDecoration = 'none'
    this._element.style.whiteSpace = 'nowrap'
    this._element.style.position = 'relative'
    this._element.style.overflow = 'hidden'

    // Apply variant-specific styles
    this.applyVariantStyles()

    // Apply size-specific styles
    this.applySizeStyles()

    // Handle loading state
    if (this._buttonConfig.loading) {
      this.setLoading(true)
    }
  }

  private applyVariantStyles(): void {
    const variant = this._buttonConfig.variant!

    switch (variant) {
      case 'primary':
        this._element.style.backgroundColor = this._theme.colors.accent
        this._element.style.color = '#ffffff'
        this._element.style.boxShadow = this.createShadowStyle('raised')
        break

      case 'secondary':
        this._element.style.backgroundColor = this._theme.colors.surface
        this._element.style.color = this._theme.colors.text
        this._element.style.boxShadow = this.createShadowStyle('raised')
        break

      case 'ghost':
        this._element.style.backgroundColor = 'transparent'
        this._element.style.color = this._theme.colors.text
        this._element.style.boxShadow = 'none'
        break
    }
  }

  private applySizeStyles(): void {
    const size = this._buttonConfig.size!
    
    this._element.style.padding = getSizeValue(size, 'padding')
    this._element.style.fontSize = getSizeValue(size, 'fontSize')
    this._element.style.minHeight = getSizeValue(size, 'height')
  }

  private setupInteractions(): void {
    const variant = this._buttonConfig.variant!

    // Mouse interactions
    this.addEventListener(this._element, 'mouseenter', () => {
      if (this._config.disabled || this._buttonConfig.loading) return

      switch (variant) {
        case 'primary':
          this._element.style.boxShadow = this.createHoverShadowStyle('raised')
          this._element.style.transform = 'translateY(-1px)'
          break
        case 'secondary':
          this._element.style.boxShadow = this.createHoverShadowStyle('raised')
          this._element.style.transform = 'translateY(-1px)'
          break
        case 'ghost':
          this._element.style.backgroundColor = this._theme.colors.surface
          this._element.style.boxShadow = this.createShadowStyle('flat')
          break
      }
    })

    this.addEventListener(this._element, 'mouseleave', () => {
      if (this._config.disabled || this._buttonConfig.loading) return

      switch (variant) {
        case 'primary':
        case 'secondary':
          this._element.style.boxShadow = this.createShadowStyle('raised')
          this._element.style.transform = 'translateY(0)'
          break
        case 'ghost':
          this._element.style.backgroundColor = 'transparent'
          this._element.style.boxShadow = 'none'
          break
      }
    })

    // Active state
    this.addEventListener(this._element, 'mousedown', () => {
      if (this._config.disabled || this._buttonConfig.loading) return

      switch (variant) {
        case 'primary':
        case 'secondary':
          this._element.style.boxShadow = this.createActiveShadowStyle('raised')
          this._element.style.transform = 'translateY(1px)'
          break
        case 'ghost':
          this._element.style.boxShadow = this.createShadowStyle('inset')
          break
      }
    })

    this.addEventListener(this._element, 'mouseup', () => {
      if (this._config.disabled || this._buttonConfig.loading) return

      // Return to hover state
      this.buttonElement.dispatchEvent(new Event('mouseenter'))
    })

    // Focus styles
    this.addEventListener(this._element, 'focus', () => {
      this._element.style.outline = `2px solid ${this._theme.colors.accent}40`
      this._element.style.outlineOffset = '2px'
    })

    this.addEventListener(this._element, 'blur', () => {
      this._element.style.outline = 'none'
    })
  }

  private createLoadingSpinner(): HTMLElement {
    const spinner = createElement('span', {
      class: 'np-loading-spinner'
    })

    spinner.style.display = 'inline-block'
    spinner.style.width = '16px'
    spinner.style.height = '16px'
    spinner.style.border = '2px solid transparent'
    spinner.style.borderTop = '2px solid currentColor'
    spinner.style.borderRadius = '50%'
    spinner.style.animation = 'np-spin 1s linear infinite'

    // Add spinner keyframes if not already added
    this.ensureSpinnerKeyframes()

    return spinner
  }

  private ensureSpinnerKeyframes(): void {
    const styleId = 'np-spinner-keyframes'
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes np-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `
      document.head.appendChild(style)
    }
  }

  // Public API methods
  setLoading(loading: boolean): void {
    this._buttonConfig.loading = loading

    if (loading) {
      // Store original content
      this._originalContent = this._element.innerHTML

      // Disable button
      this.buttonElement.disabled = true
      this._element.style.cursor = 'not-allowed'
      this._element.style.opacity = '0.7'

      // Add loading spinner
      this._loadingSpinner = this.createLoadingSpinner()
      this._element.innerHTML = ''
      this._element.appendChild(this._loadingSpinner)

      // Add loading text if desired
      const loadingText = createElement('span')
      loadingText.textContent = 'Loading...'
      this._element.appendChild(loadingText)

      addClassName(this._element, 'loading')
    } else {
      // Restore original content
      if (this._originalContent) {
        this._element.innerHTML = this._originalContent
      }

      // Re-enable button
      this.buttonElement.disabled = this._config.disabled || false
      this._element.style.cursor = this._config.disabled ? 'not-allowed' : 'pointer'
      this._element.style.opacity = this._config.disabled ? '0.5' : '1'

      // Remove loading spinner
      this._loadingSpinner = undefined
      this._element.classList.remove('np-loading')
    }

    this.emit('loading-change', { loading })
  }

  setVariant(variant: 'primary' | 'secondary' | 'ghost'): void {
    this.update({ variant })
  }

  setSize(size: 'sm' | 'md' | 'lg'): void {
    this.update({ size })
  }

  click(): void {
    this.buttonElement.click()
  }

  protected onUpdate(newConfig: Partial<ButtonConfig>): void {
    const oldConfig = { ...this._buttonConfig }
    this._buttonConfig = { ...this._buttonConfig, ...newConfig }

    // Update variant if changed
    if (newConfig.variant && newConfig.variant !== oldConfig.variant) {
      this._element.classList.remove(`np-button-${oldConfig.variant}`)
      addClassName(this._element, `button-${newConfig.variant}`)
      this.applyVariantStyles()
      this.setupInteractions()
    }

    // Update size if changed
    if (newConfig.size && newConfig.size !== oldConfig.size) {
      this._element.classList.remove(`np-button-${oldConfig.size}`)
      addClassName(this._element, `button-${newConfig.size}`)
      this.applySizeStyles()
    }

    // Update loading state if changed
    if (newConfig.loading !== oldConfig.loading) {
      this.setLoading(newConfig.loading || false)
    }

    // Update click handler if changed
    if (newConfig.onClick !== oldConfig.onClick) {
      // Event handler will be updated automatically through the config
    }
  }

  protected onDestroy(): void {
    // Restore original content if in loading state
    if (this._buttonConfig.loading && this._originalContent) {
      this._element.innerHTML = this._originalContent
    }
  }
}

// Factory function for easy usage
export function button(element: HTMLElement, config: ButtonConfig = {}): ButtonComponent {
  return new ButtonComponent(element, config)
}