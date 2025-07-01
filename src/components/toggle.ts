import { ToggleConfig } from '../types'
import { BaseComponent } from './base'
import { addClassName, createElement, getSizeValue } from '../utils'

export class ToggleComponent extends BaseComponent {
  private _toggleConfig: ToggleConfig
  private _isChecked: boolean = false
  private _wrapper?: HTMLElement
  private _slider?: HTMLElement
  private _originalInput?: HTMLInputElement

  constructor(element: HTMLElement, config: ToggleConfig = {}) {
    if (!(element instanceof HTMLInputElement) || 
        !['checkbox', 'radio'].includes(element.type)) {
      throw new Error('Toggle component requires an HTMLInputElement with type checkbox or radio')
    }

    super(element, config)
    this._toggleConfig = {
      type: 'switch',
      size: 'md',
      animated: true,
      checked: false,
      ...config
    }

    this._originalInput = element as HTMLInputElement
    this._isChecked = this._originalInput.checked || this._toggleConfig.checked || false
  }

  get inputElement(): HTMLInputElement {
    return this._originalInput!
  }

  protected init(): void {
    this.applyBaseStyles()
    this.createToggleStructure()
    this.applyToggleStyles()
    this.syncState()
  }

  protected bindEvents(): void {
    super.bindEvents()

    // Handle clicks on the wrapper or slider
    if (this._wrapper) {
      this.addEventListener(this._wrapper, 'click', this.handleClick.bind(this))
    }

    // Handle keyboard events
    this.addEventListener(this._element, 'keydown', this.handleKeydown.bind(this))

    // Listen to original input changes (external updates)
    this.addEventListener(this._originalInput, 'change', () => {
      this._isChecked = this._originalInput.checked
      this.updateVisualState()
      this.emitChange()
    })

    // Focus events
    this.addEventListener(this._element, 'focus', this.handleFocus.bind(this))
    this.addEventListener(this._element, 'blur', this.handleBlur.bind(this))
  }

  private createToggleStructure(): void {
    const type = this._toggleConfig.type!

    if (type === 'switch') {
      this.createSwitchStructure()
    } else if (type === 'checkbox') {
      this.createCheckboxStructure()
    } else if (type === 'radio') {
      this.createRadioStructure()
    }
  }

  private createSwitchStructure(): void {
    // Hide original input
    this._originalInput.style.position = 'absolute'
    this._originalInput.style.opacity = '0'
    this._originalInput.style.pointerEvents = 'none'

    // Create wrapper
    this._wrapper = createElement('div', {
      class: 'np-toggle-wrapper np-toggle-switch'
    })

    // Create slider
    this._slider = createElement('div', {
      class: 'np-toggle-slider'
    })

    // Insert wrapper after original input
    const parent = this._originalInput.parentElement!
    parent.insertBefore(this._wrapper, this._originalInput.nextSibling)
    
    // Move original input into wrapper for accessibility
    this._wrapper.appendChild(this._originalInput)
    this._wrapper.appendChild(this._slider)

    // Set wrapper as the main element for styling
    this._element = this._wrapper
  }

  private createCheckboxStructure(): void {
    // Hide original input
    this._originalInput.style.position = 'absolute'
    this._originalInput.style.opacity = '0'
    this._originalInput.style.pointerEvents = 'none'

    // Create wrapper
    this._wrapper = createElement('div', {
      class: 'np-toggle-wrapper np-toggle-checkbox'
    })

    // Create checkmark
    this._slider = createElement('div', {
      class: 'np-toggle-checkmark'
    })

    // Add checkmark icon
    this._slider.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
    `

    // Insert wrapper after original input
    const parent = this._originalInput.parentElement!
    parent.insertBefore(this._wrapper, this._originalInput.nextSibling)
    
    this._wrapper.appendChild(this._originalInput)
    this._wrapper.appendChild(this._slider)

    this._element = this._wrapper
  }

  private createRadioStructure(): void {
    // Hide original input
    this._originalInput.style.position = 'absolute'
    this._originalInput.style.opacity = '0'
    this._originalInput.style.pointerEvents = 'none'

    // Create wrapper
    this._wrapper = createElement('div', {
      class: 'np-toggle-wrapper np-toggle-radio'
    })

    // Create radio dot
    this._slider = createElement('div', {
      class: 'np-toggle-radio-dot'
    })

    // Insert wrapper after original input
    const parent = this._originalInput.parentElement!
    parent.insertBefore(this._wrapper, this._originalInput.nextSibling)
    
    this._wrapper.appendChild(this._originalInput)
    this._wrapper.appendChild(this._slider)

    this._element = this._wrapper
  }

  private applyToggleStyles(): void {
    if (!this._wrapper || !this._slider) return

    const type = this._toggleConfig.type!
    const size = this._toggleConfig.size!

    addClassName(this._wrapper, 'toggle')
    addClassName(this._wrapper, `toggle-${type}`)
    addClassName(this._wrapper, `toggle-${size}`)

    // Common wrapper styles
    this._wrapper.style.position = 'relative'
    this._wrapper.style.display = 'inline-flex'
    this._wrapper.style.alignItems = 'center'
    this._wrapper.style.cursor = 'pointer'
    this._wrapper.style.userSelect = 'none'

    if (type === 'switch') {
      this.applySwitchStyles()
    } else if (type === 'checkbox') {
      this.applyCheckboxStyles()
    } else if (type === 'radio') {
      this.applyRadioStyles()
    }

    this.setupInteractionEffects()
  }

  private applySwitchStyles(): void {
    const size = this._toggleConfig.size!
    const sizeMap = {
      sm: { width: 32, height: 18, sliderSize: 14 },
      md: { width: 44, height: 24, sliderSize: 20 },
      lg: { width: 56, height: 32, sliderSize: 28 }
    }
    const dimensions = sizeMap[size]

    // Wrapper (track) styles
    this._wrapper!.style.width = `${dimensions.width}px`
    this._wrapper!.style.height = `${dimensions.height}px`
    this._wrapper!.style.borderRadius = `${dimensions.height / 2}px`
    this._wrapper!.style.backgroundColor = this._theme.colors.surface
    this._wrapper!.style.boxShadow = this.createShadowStyle('inset')
    this._wrapper!.style.transition = `all ${this._theme.animation.duration} ${this._theme.animation.easing}`

    // Slider (thumb) styles
    this._slider!.style.position = 'absolute'
    this._slider!.style.top = '50%'
    this._slider!.style.left = '2px'
    this._slider!.style.width = `${dimensions.sliderSize}px`
    this._slider!.style.height = `${dimensions.sliderSize}px`
    this._slider!.style.borderRadius = '50%'
    this._slider!.style.backgroundColor = this._theme.colors.surface
    this._slider!.style.boxShadow = this.createShadowStyle('raised')
    this._slider!.style.transform = 'translateY(-50%)'
    this._slider!.style.transition = `all ${this._theme.animation.duration} ${this._theme.animation.easing}`
  }

  private applyCheckboxStyles(): void {
    const size = this._toggleConfig.size!
    const sizeMap = {
      sm: 18,
      md: 24,
      lg: 32
    }
    const dimensions = sizeMap[size]

    // Wrapper styles
    this._wrapper!.style.width = `${dimensions}px`
    this._wrapper!.style.height = `${dimensions}px`
    this._wrapper!.style.borderRadius = '4px'
    this._wrapper!.style.backgroundColor = this._theme.colors.surface
    this._wrapper!.style.boxShadow = this.createShadowStyle('inset')
    this._wrapper!.style.transition = `all ${this._theme.animation.duration} ${this._theme.animation.easing}`

    // Checkmark styles
    this._slider!.style.position = 'absolute'
    this._slider!.style.top = '50%'
    this._slider!.style.left = '50%'
    this._slider!.style.transform = 'translate(-50%, -50%) scale(0)'
    this._slider!.style.color = this._theme.colors.accent
    this._slider!.style.transition = `transform ${this._theme.animation.duration} ${this._theme.animation.easing}`
  }

  private applyRadioStyles(): void {
    const size = this._toggleConfig.size!
    const sizeMap = {
      sm: { outer: 18, inner: 8 },
      md: { outer: 24, inner: 12 },
      lg: { outer: 32, inner: 16 }
    }
    const dimensions = sizeMap[size]

    // Wrapper styles
    this._wrapper!.style.width = `${dimensions.outer}px`
    this._wrapper!.style.height = `${dimensions.outer}px`
    this._wrapper!.style.borderRadius = '50%'
    this._wrapper!.style.backgroundColor = this._theme.colors.surface
    this._wrapper!.style.boxShadow = this.createShadowStyle('inset')
    this._wrapper!.style.transition = `all ${this._theme.animation.duration} ${this._theme.animation.easing}`

    // Radio dot styles
    this._slider!.style.position = 'absolute'
    this._slider!.style.top = '50%'
    this._slider!.style.left = '50%'
    this._slider!.style.width = `${dimensions.inner}px`
    this._slider!.style.height = `${dimensions.inner}px`
    this._slider!.style.borderRadius = '50%'
    this._slider!.style.backgroundColor = this._theme.colors.accent
    this._slider!.style.transform = 'translate(-50%, -50%) scale(0)'
    this._slider!.style.transition = `transform ${this._theme.animation.duration} ${this._theme.animation.easing}`
  }

  private setupInteractionEffects(): void {
    if (!this._wrapper) return

    // Hover effects
    this.addEventListener(this._wrapper, 'mouseenter', () => {
      if (!this._config.disabled) {
        this._wrapper!.style.boxShadow = this.createHoverShadowStyle('inset')
      }
    })

    this.addEventListener(this._wrapper, 'mouseleave', () => {
      if (!this._config.disabled) {
        this._wrapper!.style.boxShadow = this.createShadowStyle('inset')
      }
    })

    // Active state
    this.addEventListener(this._wrapper, 'mousedown', () => {
      if (!this._config.disabled) {
        this._wrapper!.style.boxShadow = this.createActiveShadowStyle('inset')
      }
    })

    this.addEventListener(this._wrapper, 'mouseup', () => {
      if (!this._config.disabled) {
        this._wrapper!.style.boxShadow = this.createHoverShadowStyle('inset')
      }
    })
  }

  private handleClick(e: Event): void {
    e.preventDefault()
    
    if (this._config.disabled) return

    this.toggle()
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      this.toggle()
    }
  }

  private handleFocus(): void {
    if (this._wrapper) {
      this._wrapper.style.outline = `2px solid ${this._theme.colors.accent}40`
      this._wrapper.style.outlineOffset = '2px'
    }
    this.emit('focus')
  }

  private handleBlur(): void {
    if (this._wrapper) {
      this._wrapper.style.outline = 'none'
    }
    this.emit('blur')
  }

  private syncState(): void {
    this._isChecked = this._originalInput.checked
    this.updateVisualState()
  }

  private updateVisualState(): void {
    const type = this._toggleConfig.type!

    if (type === 'switch') {
      this.updateSwitchState()
    } else if (type === 'checkbox') {
      this.updateCheckboxState()
    } else if (type === 'radio') {
      this.updateRadioState()
    }

    // Update ARIA attributes
    this._originalInput.setAttribute('aria-checked', this._isChecked.toString())
  }

  private updateSwitchState(): void {
    if (!this._wrapper || !this._slider) return

    const size = this._toggleConfig.size!
    const sizeMap = {
      sm: { width: 32, sliderSize: 14 },
      md: { width: 44, sliderSize: 20 },
      lg: { width: 56, sliderSize: 28 }
    }
    const dimensions = sizeMap[size]
    const translateX = this._isChecked ? dimensions.width - dimensions.sliderSize - 4 : 2

    if (this._isChecked) {
      this._wrapper.style.backgroundColor = this._theme.colors.accent
      this._slider.style.transform = `translateY(-50%) translateX(${translateX}px)`
      addClassName(this._wrapper, 'checked')
    } else {
      this._wrapper.style.backgroundColor = this._theme.colors.surface
      this._slider.style.transform = 'translateY(-50%) translateX(0)'
      this._wrapper.classList.remove('np-checked')
    }
  }

  private updateCheckboxState(): void {
    if (!this._wrapper || !this._slider) return

    if (this._isChecked) {
      this._wrapper.style.backgroundColor = this._theme.colors.accent
      this._wrapper.style.boxShadow = this.createShadowStyle('flat')
      this._slider.style.transform = 'translate(-50%, -50%) scale(1)'
      this._slider.style.color = 'white'
      addClassName(this._wrapper, 'checked')
    } else {
      this._wrapper.style.backgroundColor = this._theme.colors.surface
      this._wrapper.style.boxShadow = this.createShadowStyle('inset')
      this._slider.style.transform = 'translate(-50%, -50%) scale(0)'
      this._wrapper.classList.remove('np-checked')
    }
  }

  private updateRadioState(): void {
    if (!this._wrapper || !this._slider) return

    if (this._isChecked) {
      this._slider.style.transform = 'translate(-50%, -50%) scale(1)'
      addClassName(this._wrapper, 'checked')
    } else {
      this._slider.style.transform = 'translate(-50%, -50%) scale(0)'
      this._wrapper.classList.remove('np-checked')
    }
  }

  private emitChange(): void {
    this.emit('change', { 
      checked: this._isChecked,
      value: this._originalInput.value 
    })

    if (this._toggleConfig.onChange) {
      this._toggleConfig.onChange(this._isChecked)
    }
  }

  // Public API methods
  toggle(): void {
    if (this._config.disabled) return

    this._isChecked = !this._isChecked
    this._originalInput.checked = this._isChecked
    this.updateVisualState()
    this.emitChange()

    // Trigger native change event
    this._originalInput.dispatchEvent(new Event('change', { bubbles: true }))
  }

  check(): void {
    if (!this._isChecked) {
      this.toggle()
    }
  }

  uncheck(): void {
    if (this._isChecked) {
      this.toggle()
    }
  }

  setChecked(checked: boolean): void {
    if (this._isChecked !== checked) {
      this.toggle()
    }
  }

  isChecked(): boolean {
    return this._isChecked
  }

  getValue(): string {
    return this._originalInput.value
  }

  setValue(value: string): void {
    this._originalInput.value = value
  }

  protected onUpdate(newConfig: Partial<ToggleConfig>): void {
    const oldConfig = { ...this._toggleConfig }
    this._toggleConfig = { ...this._toggleConfig, ...newConfig }

    // Update checked state
    if (newConfig.checked !== undefined && newConfig.checked !== oldConfig.checked) {
      this.setChecked(newConfig.checked)
    }

    // Update size if changed
    if (newConfig.size && newConfig.size !== oldConfig.size) {
      this._wrapper?.classList.remove(`np-toggle-${oldConfig.size}`)
      addClassName(this._wrapper!, `toggle-${newConfig.size}`)
      this.applyToggleStyles()
    }

    // Update animation setting
    if (newConfig.animated !== oldConfig.animated) {
      const duration = newConfig.animated ? this._theme.animation.duration : '0ms'
      if (this._wrapper) this._wrapper.style.transition = `all ${duration} ${this._theme.animation.easing}`
      if (this._slider) this._slider.style.transition = `all ${duration} ${this._theme.animation.easing}`
    }
  }

  protected onDestroy(): void {
    // Restore original input
    if (this._originalInput && this._wrapper) {
      const parent = this._wrapper.parentElement
      if (parent) {
        parent.insertBefore(this._originalInput, this._wrapper)
        parent.removeChild(this._wrapper)
      }
      
      // Restore original input styles
      this._originalInput.style.position = ''
      this._originalInput.style.opacity = ''
      this._originalInput.style.pointerEvents = ''
    }
  }
}

// Factory function for easy usage
export function toggle(element: HTMLElement, config: ToggleConfig = {}): ToggleComponent {
  return new ToggleComponent(element, config)
}