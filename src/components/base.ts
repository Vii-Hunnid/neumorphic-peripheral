import { BaseComponentConfig, ComponentInstance, NeumorphicTheme } from '../types'
import { getCurrentTheme } from '../themes'
import { applyNeumorphicStyles, addClassName, isElement } from '../utils'

export abstract class BaseComponent implements ComponentInstance {
  protected _element: HTMLElement
  protected _config: BaseComponentConfig
  protected _theme: NeumorphicTheme
  protected _listeners: Array<{ element: Element | Window, event: string, handler: EventListener }> = []
  protected _destroyed = false

  constructor(element: HTMLElement, config: BaseComponentConfig = {}) {
    if (!isElement(element)) {
      throw new Error('Invalid element provided to component')
    }

    this._element = element
    this._config = { ...config }
    this._theme = typeof config.theme === 'string' 
      ? getCurrentTheme() 
      : config.theme || getCurrentTheme()

    this.init()
    this.bindEvents()
  }

  get element(): HTMLElement {
    return this._element
  }

  get config(): BaseComponentConfig {
    return { ...this._config }
  }

  protected abstract init(): void

  protected bindEvents(): void {
    // Listen for theme changes
    this.addEventListener(window, 'np:theme-change', () => {
      if (typeof this._config.theme === 'string') {
        this._theme = getCurrentTheme()
        this.onThemeChange()
      }
    })

    // Handle disabled state
    if (this._config.disabled) {
      this.setDisabled(true)
    }
  }

  protected addEventListener(
    element: Element | Window,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options)
    this._listeners.push({ element, event, handler })
  }

  protected applyBaseStyles(): void {
    // Add base component class
    addClassName(this._element, 'component')
    
    // Apply custom className if provided
    if (this._config.className) {
      this._element.classList.add(this._config.className)
    }

    // Apply basic neumorphic styling
    applyNeumorphicStyles(this._element, {
      backgroundColor: this._theme.colors.surface,
      color: this._theme.colors.text,
      borderRadius: this._theme.borderRadius,
      transition: `all ${this._theme.animation.duration} ${this._theme.animation.easing}`,
      outline: 'none'
    }, this._theme)
  }

  protected onThemeChange(): void {
    // Re-apply styles with new theme
    this.applyBaseStyles()
  }

  protected setDisabled(disabled: boolean): void {
    this._config.disabled = disabled
    
    if (disabled) {
      this._element.setAttribute('disabled', '')
      this._element.setAttribute('aria-disabled', 'true')
      addClassName(this._element, 'disabled')
    } else {
      this._element.removeAttribute('disabled')
      this._element.removeAttribute('aria-disabled')
      this._element.classList.remove('np-disabled')
    }
  }

  protected emit(eventName: string, detail?: any): void {
    const event = new CustomEvent(`np:${eventName}`, {
      detail: {
        instance: this,
        ...detail
      },
      bubbles: true,
      cancelable: true
    })
    
    this._element.dispatchEvent(event)
  }

  update(newConfig: Partial<BaseComponentConfig>): void {
    if (this._destroyed) {
      console.warn('Cannot update destroyed component')
      return
    }

    const oldConfig = { ...this._config }
    this._config = { ...this._config, ...newConfig }

    // Update theme if changed
    if (newConfig.theme && newConfig.theme !== oldConfig.theme) {
      this._theme = typeof newConfig.theme === 'string' 
        ? getCurrentTheme() 
        : newConfig.theme
      this.onThemeChange()
    }

    // Update disabled state if changed
    if (newConfig.disabled !== undefined && newConfig.disabled !== oldConfig.disabled) {
      this.setDisabled(newConfig.disabled)
    }

    // Update className if changed
    if (newConfig.className !== oldConfig.className) {
      if (oldConfig.className) {
        this._element.classList.remove(oldConfig.className)
      }
      if (newConfig.className) {
        this._element.classList.add(newConfig.className)
      }
    }

    this.onUpdate(newConfig, oldConfig)
  }

  protected onUpdate(newConfig: Partial<BaseComponentConfig>, oldConfig: BaseComponentConfig): void {
    // Override in subclasses to handle specific config updates
  }

  destroy(): void {
    if (this._destroyed) return

    // Remove all event listeners
    this._listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this._listeners = []

    // Remove classes
    this._element.classList.remove('np-component')
    if (this._config.className) {
      this._element.classList.remove(this._config.className)
    }

    // Emit destroy event
    this.emit('destroy')

    // Perform component-specific cleanup
    this.onDestroy()

    this._destroyed = true
  }

  protected onDestroy(): void {
    // Override in subclasses for custom cleanup
  }

  // Utility methods for subclasses
  protected createShadowStyle(variant: 'raised' | 'inset' | 'flat' = 'raised'): string {
    const intensity = this._theme.shadowIntensity
    const { light, dark } = this._theme.colors.shadow
    
    const offset = Math.round(8 * intensity)
    const blur = Math.round(16 * intensity)
    const spread = Math.round(-2 * intensity)
    
    switch (variant) {
      case 'raised':
        return `${offset}px ${offset}px ${blur}px ${spread}px ${dark}, -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
      case 'inset':
        return `inset ${offset}px ${offset}px ${blur}px ${spread}px ${dark}, inset -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
      case 'flat':
        return 'none'
      default:
        return 'none'
    }
  }

  protected createHoverShadowStyle(variant: 'raised' | 'inset' | 'flat' = 'raised'): string {
    const intensity = this._theme.shadowIntensity * 1.2 // Slightly more intense on hover
    const { light, dark } = this._theme.colors.shadow
    
    const offset = Math.round(10 * intensity)
    const blur = Math.round(20 * intensity)
    const spread = Math.round(-1 * intensity)
    
    switch (variant) {
      case 'raised':
        return `${offset}px ${offset}px ${blur}px ${spread}px ${dark}, -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
      case 'inset':
        return `inset ${offset}px ${offset}px ${blur}px ${spread}px ${dark}, inset -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
      case 'flat':
        return 'none'
      default:
        return 'none'
    }
  }

  protected createActiveShadowStyle(variant: 'raised' | 'inset' | 'flat' = 'raised'): string {
    const intensity = this._theme.shadowIntensity * 0.5 // Less intense when active
    const { light, dark } = this._theme.colors.shadow
    
    const offset = Math.round(4 * intensity)
    const blur = Math.round(8 * intensity)
    const spread = Math.round(-1 * intensity)
    
    switch (variant) {
      case 'raised':
        return `inset ${offset}px ${offset}px ${blur}px ${spread}px ${dark}, inset -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
      case 'inset':
        return `${offset}px ${offset}px ${blur}px ${spread}px ${dark}, -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
      case 'flat':
        return 'none'
      default:
        return 'none'
    }
  }
}