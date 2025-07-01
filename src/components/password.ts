import { PasswordConfig, PasswordInstance } from '../types'
import { InputComponent } from './input'
import { addClassName, createElement } from '../utils'
import { validatePasswordStrength } from '../validators'

export class PasswordComponent extends InputComponent implements PasswordInstance {
  private _passwordConfig: PasswordConfig
  private _isVisible = false
  private _toggleButton?: HTMLButtonElement
  private _strengthIndicator?: HTMLDivElement
  private _originalType: string

  constructor(element: HTMLElement, config: PasswordConfig = {}) {
    if (!(element instanceof HTMLInputElement)) {
      throw new Error('Password component requires an HTMLInputElement')
    }

    super(element, config)
    this._passwordConfig = {
      showToggle: true,
      togglePosition: 'right',
      strengthIndicator: false,
      maskCharacter: '•',
      ...config
    }

    this._originalType = this.inputElement.type
  }

  protected init(): void {
    super.init()
    this.setupPasswordField()
    this.createToggleButton()
    this.createStrengthIndicator()
  }

  protected bindEvents(): void {
    super.bindEvents()

    // Monitor password input for strength calculation
    if (this._passwordConfig.strengthIndicator) {
      this.addEventListener(this._element, 'input', () => {
        this.updateStrengthIndicator()
      })
    }
  }

  private setupPasswordField(): void {
    addClassName(this._element, 'password')
    
    // Ensure input type is password initially
    this.inputElement.type = 'password'
    
    // Create wrapper if toggle is enabled
    if (this._passwordConfig.showToggle) {
      this.createInputWrapper()
    }
  }

  private createInputWrapper(): void {
    const wrapper = createElement('div', {
      class: 'np-password-wrapper'
    })

    // Style the wrapper
    wrapper.style.position = 'relative'
    wrapper.style.display = 'inline-block'
    wrapper.style.width = '100%'

    // Wrap the input
    const parent = this._element.parentElement!
    parent.insertBefore(wrapper, this._element)
    wrapper.appendChild(this._element)

    // Adjust input styles for wrapper
    this._element.style.paddingRight = this._passwordConfig.togglePosition === 'right' ? '45px' : this._element.style.paddingRight
    this._element.style.paddingLeft = this._passwordConfig.togglePosition === 'left' ? '45px' : this._element.style.paddingLeft
  }

  private createToggleButton(): void {
    if (!this._passwordConfig.showToggle) return

    this._toggleButton = createElement('button', {
      type: 'button',
      class: 'np-password-toggle',
      'aria-label': 'Toggle password visibility'
    })

    // Style the toggle button
    this._toggleButton.style.position = 'absolute'
    this._toggleButton.style.top = '50%'
    this._toggleButton.style.transform = 'translateY(-50%)'
    this._toggleButton.style[this._passwordConfig.togglePosition!] = '12px'
    this._toggleButton.style.background = 'none'
    this._toggleButton.style.border = 'none'
    this._toggleButton.style.cursor = 'pointer'
    this._toggleButton.style.padding = '4px'
    this._toggleButton.style.color = this._theme.colors.textSecondary
    this._toggleButton.style.fontSize = '16px'
    this._toggleButton.style.lineHeight = '1'
    this._toggleButton.style.borderRadius = '4px'
    this._toggleButton.style.transition = `color ${this._theme.animation.duration} ${this._theme.animation.easing}`

    // Add eye icon
    this.updateToggleIcon()

    // Add hover effect
    this._toggleButton.addEventListener('mouseenter', () => {
      this._toggleButton!.style.color = this._theme.colors.text
    })

    this._toggleButton.addEventListener('mouseleave', () => {
      this._toggleButton!.style.color = this._theme.colors.textSecondary
    })

    // Add click handler
    this._toggleButton.addEventListener('click', (e) => {
      e.preventDefault()
      this.toggleVisibility()
    })

    // Append to wrapper or parent
    const wrapper = this._element.parentElement!
    wrapper.appendChild(this._toggleButton)
  }

  private updateToggleIcon(): void {
    if (!this._toggleButton) return

    // Use Unicode eye symbols or create SVG icons
    const eyeIcon = this._isVisible ? '👁️' : '👁️‍🗨️'
    const ariaLabel = this._isVisible ? 'Hide password' : 'Show password'
    
    this._toggleButton.innerHTML = this.createEyeIcon(this._isVisible)
    this._toggleButton.setAttribute('aria-label', ariaLabel)
  }

  private createEyeIcon(isVisible: boolean): string {
    if (isVisible) {
      // Eye with slash (hidden)
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      `
    } else {
      // Regular eye (visible)
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `
    }
  }

  private createStrengthIndicator(): void {
    if (!this._passwordConfig.strengthIndicator) return

    this._strengthIndicator = createElement('div', {
      class: 'np-password-strength'
    })

    // Style the strength indicator
    this._strengthIndicator.style.marginTop = '8px'
    this._strengthIndicator.style.display = 'flex'
    this._strengthIndicator.style.gap = '4px'
    this._strengthIndicator.style.alignItems = 'center'

    // Create strength bars
    for (let i = 0; i < 4; i++) {
      const bar = createElement('div', {
        class: 'np-strength-bar'
      })
      
      bar.style.height = '4px'
      bar.style.flex = '1'
      bar.style.borderRadius = '2px'
      bar.style.backgroundColor = this._theme.colors.surface
      bar.style.boxShadow = this.createShadowStyle('inset')
      bar.style.transition = `background-color ${this._theme.animation.duration} ${this._theme.animation.easing}`
      
      this._strengthIndicator.appendChild(bar)
    }

    // Add strength text
    const strengthText = createElement('span', {
      class: 'np-strength-text'
    })
    strengthText.style.fontSize = '12px'
    strengthText.style.color = this._theme.colors.textSecondary
    strengthText.style.marginLeft = '8px'
    strengthText.style.minWidth = '60px'
    strengthText.textContent = 'Weak'

    this._strengthIndicator.appendChild(strengthText)

    // Insert after input wrapper or input
    const wrapper = this._element.parentElement!
    const parent = wrapper.parentElement!
    parent.insertBefore(this._strengthIndicator, wrapper.nextSibling)
  }

  private updateStrengthIndicator(): void {
    if (!this._strengthIndicator) return

    const password = this.getValue()
    const strength = validatePasswordStrength(password)
    const bars = this._strengthIndicator.querySelectorAll('.np-strength-bar') as NodeListOf<HTMLElement>
    const text = this._strengthIndicator.querySelector('.np-strength-text') as HTMLElement

    // Color mapping
    const colors = {
      weak: this._theme.colors.error,
      fair: '#ff9500', // Orange
      good: '#007aff', // Blue
      strong: this._theme.colors.success
    }

    // Update bars
    bars.forEach((bar, index) => {
      if (index < strength.score) {
        bar.style.backgroundColor = colors[strength.strength]
        bar.style.boxShadow = 'none'
      } else {
        bar.style.backgroundColor = this._theme.colors.surface
        bar.style.boxShadow = this.createShadowStyle('inset')
      }
    })

    // Update text
    text.textContent = strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1)
    text.style.color = colors[strength.strength]

    // Emit strength change event
    this.emit('strength-change', { strength })
  }

  // Public API methods
  toggleVisibility(): void {
    this._isVisible = !this._isVisible
    
    if (this._isVisible) {
      this.inputElement.type = 'text'
    } else {
      this.inputElement.type = 'password'
    }

    this.updateToggleIcon()
    this.emit('visibility-toggle', { visible: this._isVisible })
  }

  isVisible(): boolean {
    return this._isVisible
  }

  showPassword(): void {
    if (!this._isVisible) {
      this.toggleVisibility()
    }
  }

  hidePassword(): void {
    if (this._isVisible) {
      this.toggleVisibility()
    }
  }

  getPasswordStrength(): ReturnType<typeof validatePasswordStrength> | null {
    const password = this.getValue()
    return password ? validatePasswordStrength(password) : null
  }

  protected onUpdate(newConfig: Partial<PasswordConfig>): void {
    super.onUpdate(newConfig)
    
    const oldConfig = { ...this._passwordConfig }
    this._passwordConfig = { ...this._passwordConfig, ...newConfig }

    // Update toggle visibility
    if (newConfig.showToggle !== oldConfig.showToggle) {
      if (newConfig.showToggle && !this._toggleButton) {
        this.createInputWrapper()
        this.createToggleButton()
      } else if (!newConfig.showToggle && this._toggleButton) {
        this._toggleButton.remove()
        this._toggleButton = undefined
      }
    }

    // Update strength indicator
    if (newConfig.strengthIndicator !== oldConfig.strengthIndicator) {
      if (newConfig.strengthIndicator && !this._strengthIndicator) {
        this.createStrengthIndicator()
      } else if (!newConfig.strengthIndicator && this._strengthIndicator) {
        this._strengthIndicator.remove()
        this._strengthIndicator = undefined
      }
    }

    // Update toggle position
    if (newConfig.togglePosition !== oldConfig.togglePosition && this._toggleButton) {
      this._toggleButton.style[oldConfig.togglePosition!] = 'auto'
      this._toggleButton.style[newConfig.togglePosition!] = '12px'
      
      // Update input padding
      if (newConfig.togglePosition === 'right') {
        this._element.style.paddingRight = '45px'
        this._element.style.paddingLeft = '16px'
      } else {
        this._element.style.paddingLeft = '45px'
        this._element.style.paddingRight = '16px'
      }
    }
  }

  protected onDestroy(): void {
    super.onDestroy()
    
    if (this._toggleButton) {
      this._toggleButton.remove()
    }
    
    if (this._strengthIndicator) {
      this._strengthIndicator.remove()
    }

    // Restore original input type
    this.inputElement.type = this._originalType
  }
}

// Factory function for easy usage
export function password(element: HTMLElement, config: PasswordConfig = {}): PasswordComponent {
  return new PasswordComponent(element, config)
}