// Core exports
export * from './types'
export * from './themes'
export * from './utils'
export * from './validators'

// Component exports
export { BaseComponent } from './components/base'
export { CardComponent, card } from './components/card'
export { InputComponent, input } from './components/input'
export { PasswordComponent, password } from './components/password'
export { ButtonComponent, button } from './components/button'
export { TextareaComponent, textarea } from './components/textarea'
export { ToggleComponent, toggle } from './components/toggle'

// Main API
import { card } from './components/card'
import { input } from './components/input'
import { password } from './components/password'
import { button } from './components/button'
import { textarea } from './components/textarea'
import { toggle } from './components/toggle'
import { setTheme, getCurrentTheme, autoDetectTheme } from './themes'
import { GlobalConfig } from './types'

// Global configuration
let globalConfig: GlobalConfig = {
  theme: getCurrentTheme(),
  prefix: 'np',
  autoInit: false
}

// Main neumorphic peripheral object
const np = {
  // Component factories
  card,
  input,
  password,
  button,
  textarea,
  toggle,
  
  // Theme management
  setTheme,
  getCurrentTheme,
  autoDetectTheme,
  
  // Global configuration
  config(newConfig: Partial<GlobalConfig>): void {
    globalConfig = { ...globalConfig, ...newConfig }
    
    if (newConfig.theme) {
      setTheme(newConfig.theme)
    }
  },
  
  getConfig(): GlobalConfig {
    return { ...globalConfig }
  },
  
  // Utility methods
  init(): void {
    // Auto-initialize components if enabled
    if (globalConfig.autoInit) {
      this.autoInit()
    }
  },
  
  autoInit(): void {
    // Auto-initialize components based on data attributes
    const elements = document.querySelectorAll('[data-np]')
    
    elements.forEach(element => {
      const component = element.getAttribute('data-np')
      const configAttr = element.getAttribute('data-np-config')
      
      let config = {}
      if (configAttr) {
        try {
          config = JSON.parse(configAttr)
        } catch (e) {
          console.warn('Invalid JSON in data-np-config:', configAttr)
        }
      }
      
      switch (component) {
        case 'card':
          this.card(element as HTMLElement, config)
          break
        case 'input':
          this.input(element as HTMLElement, config)
          break
        case 'password':
          this.password(element as HTMLElement, config)
          break
        case 'button':
          this.button(element as HTMLElement, config)
          break
        case 'textarea':
          this.textarea(element as HTMLElement, config)
          break
        case 'toggle':
          this.toggle(element as HTMLElement, config)
          break
      }
    })
  },
  
  // Version info
  version: '1.0.0',
  
  // Destroy all components
  destroyAll(): void {
    // This would require keeping track of all instances
    // For now, emit a global event that components can listen to
    window.dispatchEvent(new CustomEvent('np:destroy-all'))
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => np.init())
  } else {
    np.init()
  }
}

// Default export
export default np

// Named exports for tree-shaking
export {
  card,
  input,
  password,
  button,
  textarea,
  toggle,
  setTheme,
  getCurrentTheme,
  autoDetectTheme
}