import { PasswordComponent, password } from '../../components/password'

describe('PasswordComponent', () => {
  let element: HTMLInputElement

  beforeEach(() => {
    element = document.createElement('input')
    element.type = 'password'
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
  })

  describe('initialization', () => {
    it('should create a password component with default config', () => {
      const passwordInstance = new PasswordComponent(element)
      
      expect(passwordInstance.element).toBe(element)
      expect(passwordInstance.config).toMatchObject({
        showToggle: true,
        togglePosition: 'right',
        strengthIndicator: false
      })
    })

    it('should throw error for non-input element', () => {
      const div = document.createElement('div')
      expect(() => {
        new PasswordComponent(div)
      }).toThrow('Password component requires an HTMLInputElement')
    })

    it('should apply password-specific classes', () => {
      new PasswordComponent(element)
      
      expect(element.classList.contains('np-component')).toBe(true)
      expect(element.classList.contains('np-input')).toBe(true)
      expect(element.classList.contains('np-password')).toBe(true)
    })
  })

  describe('toggle functionality', () => {
    it('should create toggle button when showToggle is true', () => {
      new PasswordComponent(element, { showToggle: true })
      
      const wrapper = element.parentElement
      const toggleButton = wrapper?.querySelector('.np-password-toggle')
      
      expect(toggleButton).toBeTruthy()
      expect(toggleButton?.getAttribute('aria-label')).toBe('Toggle password visibility')
    })

    it('should not create toggle button when showToggle is false', () => {
      new PasswordComponent(element, { showToggle: false })
      
      const wrapper = element.parentElement
      const toggleButton = wrapper?.querySelector('.np-password-toggle')
      
      expect(toggleButton).toBeFalsy()
    })

    it('should toggle password visibility', () => {
      const passwordInstance = new PasswordComponent(element, { showToggle: true })
      
      expect(passwordInstance.isVisible()).toBe(false)
      expect(element.type).toBe('password')
      
      passwordInstance.toggleVisibility()
      
      expect(passwordInstance.isVisible()).toBe(true)
      expect(element.type).toBe('text')
      
      passwordInstance.toggleVisibility()
      
      expect(passwordInstance.isVisible()).toBe(false)
      expect(element.type).toBe('password')
    })

    it('should show/hide password programmatically', () => {
      const passwordInstance = new PasswordComponent(element, { showToggle: true })
      
      passwordInstance.showPassword()
      expect(passwordInstance.isVisible()).toBe(true)
      
      passwordInstance.hidePassword()
      expect(passwordInstance.isVisible()).toBe(false)
    })

    it('should emit visibility toggle events', (done) => {
      const passwordInstance = new PasswordComponent(element, { showToggle: true })
      
      element.addEventListener('np:visibility-toggle', (e: any) => {
        expect(e.detail.visible).toBe(true)
        done()
      })
      
      passwordInstance.toggleVisibility()
    })
  })

  describe('strength indicator', () => {
    it('should create strength indicator when enabled', () => {
      new PasswordComponent(element, { strengthIndicator: true })
      
      const strengthIndicator = document.querySelector('.np-password-strength')
      expect(strengthIndicator).toBeTruthy()
      
      const bars = strengthIndicator?.querySelectorAll('.np-strength-bar')
      expect(bars?.length).toBe(4)
    })

    it('should not create strength indicator when disabled', () => {
      new PasswordComponent(element, { strengthIndicator: false })
      
      const strengthIndicator = document.querySelector('.np-password-strength')
      expect(strengthIndicator).toBeFalsy()
    })

    it('should calculate password strength correctly', () => {
      const passwordInstance = new PasswordComponent(element, { strengthIndicator: true })
      
      // Weak password
      passwordInstance.setValue('123')
      let strength = passwordInstance.getPasswordStrength()
      expect(strength?.strength).toBe('weak')
      
      // Strong password
      passwordInstance.setValue('MyStr0ng!Pass')
      strength = passwordInstance.getPasswordStrength()
      expect(strength?.strength).toBe('strong')
    })

    it('should emit strength change events', (done) => {
      const passwordInstance = new PasswordComponent(element, { strengthIndicator: true })
      
      element.addEventListener('np:strength-change', (e: any) => {
        expect(e.detail.strength).toBeTruthy()
        expect(e.detail.strength.strength).toBe('weak')
        done()
      })
      
      passwordInstance.setValue('weak')
      element.dispatchEvent(new Event('input'))
    })
  })

  describe('validation integration', () => {
    it('should validate password requirements', () => {
      const passwordInstance = new PasswordComponent(element, {
        validate: {
          required: true,
          minLength: 8
        }
      })

      passwordInstance.setValue('short')
      const result = passwordInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Must be at least 8 characters')
    })

    it('should combine with strength validation', () => {
      const passwordInstance = new PasswordComponent(element, {
        strengthIndicator: true,
        validate: {
          required: true,
          minLength: 8,
          custom: [(value) => {
            const strength = passwordInstance.getPasswordStrength()
            return strength && strength.strength === 'weak' ? 'Password is too weak' : null
          }]
        }
      })

      passwordInstance.setValue('weakpass')
      const result = passwordInstance.validate()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is too weak')
    })
  })

  describe('configuration updates', () => {
    it('should update toggle visibility', () => {
      const passwordInstance = new PasswordComponent(element, { showToggle: false })
      
      let toggleButton = document.querySelector('.np-password-toggle')
      expect(toggleButton).toBeFalsy()
      
      passwordInstance.update({ showToggle: true })
      
      toggleButton = document.querySelector('.np-password-toggle')
      expect(toggleButton).toBeTruthy()
    })

    it('should update strength indicator', () => {
      const passwordInstance = new PasswordComponent(element, { strengthIndicator: false })
      
      let strengthIndicator = document.querySelector('.np-password-strength')
      expect(strengthIndicator).toBeFalsy()
      
      passwordInstance.update({ strengthIndicator: true })
      
      strengthIndicator = document.querySelector('.np-password-strength')
      expect(strengthIndicator).toBeTruthy()
    })

    it('should update toggle position', () => {
      const passwordInstance = new PasswordComponent(element, { 
        showToggle: true,
        togglePosition: 'left' 
      })
      
      passwordInstance.update({ togglePosition: 'right' })
      
      const toggleButton = document.querySelector('.np-password-toggle') as HTMLElement
      expect(toggleButton?.style.right).toBe('12px')
      expect(toggleButton?.style.left).toBe('auto')
    })
  })

  describe('accessibility', () => {
    it('should update toggle button aria-label on visibility change', () => {
      const passwordInstance = new PasswordComponent(element, { showToggle: true })
      const toggleButton = document.querySelector('.np-password-toggle')
      
      expect(toggleButton?.getAttribute('aria-label')).toBe('Show password')
      
      passwordInstance.toggleVisibility()
      
      expect(toggleButton?.getAttribute('aria-label')).toBe('Hide password')
    })

    it('should handle keyboard navigation on toggle button', () => {
      const passwordInstance = new PasswordComponent(element, { showToggle: true })
      const toggleButton = document.querySelector('.np-password-toggle')
      
      expect(passwordInstance.isVisible()).toBe(false)
      
      // Simulate Enter key
      toggleButton?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      
      expect(passwordInstance.isVisible()).toBe(true)
    })
  })

  describe('wrapper creation', () => {
    it('should create wrapper for toggle functionality', () => {
      new PasswordComponent(element, { showToggle: true })
      
      const wrapper = element.parentElement
      expect(wrapper?.classList.contains('np-password-wrapper')).toBe(true)
      expect(wrapper?.style.position).toBe('relative')
    })

    it('should adjust input padding for toggle position', () => {
      new PasswordComponent(element, { 
        showToggle: true,
        togglePosition: 'right' 
      })
      
      expect(element.style.paddingRight).toBe('45px')
      
      const passwordInstance = new PasswordComponent(element, { 
        showToggle: true,
        togglePosition: 'left' 
      })
      
      expect(element.style.paddingLeft).toBe('45px')
    })
  })

  describe('factory function', () => {
    it('should create password instance using factory function', () => {
      const passwordInstance = password(element, { 
        showToggle: true,
        strengthIndicator: true 
      })
      
      expect(passwordInstance).toBeInstanceOf(PasswordComponent)
    })
  })

  describe('destruction', () => {
    it('should clean up wrapper and restore original input', () => {
      const originalParent = element.parentElement
      const passwordInstance = new PasswordComponent(element, { showToggle: true })
      
      expect(element.parentElement?.classList.contains('np-password-wrapper')).toBe(true)
      
      passwordInstance.destroy()
      
      expect(element.parentElement).toBe(originalParent)
      expect(element.style.position).toBe('')
      expect(element.style.opacity).toBe('')
    })

    it('should remove strength indicator on destroy', () => {
      const passwordInstance = new PasswordComponent(element, { strengthIndicator: true })
      
      expect(document.querySelector('.np-password-strength')).toBeTruthy()
      
      passwordInstance.destroy()
      
      expect(document.querySelector('.np-password-strength')).toBeFalsy()
    })
  })
})