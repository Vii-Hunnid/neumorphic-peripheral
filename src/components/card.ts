import { CardConfig } from '../types'
import { BaseComponent } from './base'
import { addClassName, getSizeValue } from '../utils'

export class CardComponent extends BaseComponent {
  private _cardConfig: CardConfig

  constructor(element: HTMLElement, config: CardConfig = {}) {
    super(element, config)
    this._cardConfig = {
      variant: 'raised',
      size: 'md',
      ...config
    }
  }

  protected init(): void {
    this.applyBaseStyles()
    this.applyCardStyles()
  }

  private applyCardStyles(): void {
    addClassName(this._element, 'card')
    addClassName(this._element, `card-${this._cardConfig.variant}`)
    addClassName(this._element, `card-${this._cardConfig.size}`)

    // Apply size-based padding
    const padding = this._cardConfig.padding || this.getSizePadding()
    
    // Apply core card styles
    this._element.style.padding = padding
    this._element.style.boxShadow = this.createShadowStyle(this._cardConfig.variant)
    this._element.style.display = this._element.style.display || 'block'
    this._element.style.position = 'relative'

    // Add hover effect for raised cards
    if (this._cardConfig.variant === 'raised') {
      this.setupHoverEffect()
    }
  }

  private getSizePadding(): string {
    return getSizeValue(this._cardConfig.size!, 'padding')
  }

  private setupHoverEffect(): void {
    const originalShadow = this.createShadowStyle(this._cardConfig.variant)
    const hoverShadow = this.createHoverShadowStyle(this._cardConfig.variant)

    this.addEventListener(this._element, 'mouseenter', () => {
      if (!this._config.disabled) {
        this._element.style.boxShadow = hoverShadow
        this._element.style.transform = 'translateY(-1px)'
      }
    })

    this.addEventListener(this._element, 'mouseleave', () => {
      this._element.style.boxShadow = originalShadow
      this._element.style.transform = 'translateY(0)'
    })
  }

  protected onUpdate(newConfig: Partial<CardConfig>): void {
    const oldCardConfig = { ...this._cardConfig }
    this._cardConfig = { ...this._cardConfig, ...newConfig }

    // Update variant if changed
    if (newConfig.variant && newConfig.variant !== oldCardConfig.variant) {
      this._element.classList.remove(`np-card-${oldCardConfig.variant}`)
      addClassName(this._element, `card-${newConfig.variant}`)
      this._element.style.boxShadow = this.createShadowStyle(newConfig.variant)
    }

    // Update size if changed
    if (newConfig.size && newConfig.size !== oldCardConfig.size) {
      this._element.classList.remove(`np-card-${oldCardConfig.size}`)
      addClassName(this._element, `card-${newConfig.size}`)
      this._element.style.padding = newConfig.padding || this.getSizePadding()
    }

    // Update padding if changed
    if (newConfig.padding && newConfig.padding !== oldCardConfig.padding) {
      this._element.style.padding = newConfig.padding
    }
  }

  // Public API methods
  setVariant(variant: 'raised' | 'inset' | 'flat'): void {
    this.update({ variant })
  }

  setSize(size: 'sm' | 'md' | 'lg'): void {
    this.update({ size })
  }

  setPadding(padding: string): void {
    this.update({ padding })
  }

  getVariant(): 'raised' | 'inset' | 'flat' {
    return this._cardConfig.variant!
  }

  getSize(): 'sm' | 'md' | 'lg' {
    return this._cardConfig.size!
  }
}

// Factory function for easy usage
export function card(element: HTMLElement, config: CardConfig = {}): CardComponent {
  return new CardComponent(element, config)
}