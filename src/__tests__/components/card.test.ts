import { CardComponent, card } from '../../components/card'
import { lightTheme } from '../../themes'

describe('CardComponent', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
  })

  describe('initialization', () => {
    it('should create a card component with default config', () => {
      const cardInstance = new CardComponent(element)
      
      expect(cardInstance.element).toBe(element)
      expect(cardInstance.config).toMatchObject({
        variant: 'raised',
        size: 'md'
      })
    })

    it('should apply base classes', () => {
      new CardComponent(element)
      
      expect(element.classList.contains('np-component')).toBe(true)
      expect(element.classList.contains('np-card')).toBe(true)
      expect(element.classList.contains('np-card-raised')).toBe(true)
      expect(element.classList.contains('np-card-md')).toBe(true)
    })

    it('should apply custom config', () => {
      const cardInstance = new CardComponent(element, {
        variant: 'inset',
        size: 'lg',
        padding: '20px'
      })
      
      expect(cardInstance.getVariant()).toBe('inset')
      expect(cardInstance.getSize()).toBe('lg')
      expect(element.style.padding).toBe('20px')
    })

    it('should throw error for invalid element', () => {
      expect(() => {
        new CardComponent(null as any)
      }).toThrow('Invalid element provided to component')
    })
  })

  describe('styling', () => {
    it('should apply correct shadow for raised variant', () => {
      new CardComponent(element, { variant: 'raised' })
      
      expect(element.style.boxShadow).toContain('8px 8px 16px')
      expect(element.style.boxShadow).toContain('-8px -8px 16px')
    })

    it('should apply correct shadow for inset variant', () => {
      new CardComponent(element, { variant: 'inset' })
      
      expect(element.style.boxShadow).toContain('inset 8px 8px 16px')
      expect(element.style.boxShadow).toContain('inset -8px -8px 16px')
    })

    it('should apply no shadow for flat variant', () => {
      new CardComponent(element, { variant: 'flat' })
      
      expect(element.style.boxShadow).toBe('none')
    })
  })

  describe('interactions', () => {
    it('should setup hover effect for raised cards', () => {
      const cardInstance = new CardComponent(element, { variant: 'raised' })
      const originalShadow = element.style.boxShadow
      
      // Simulate mouseenter
      element.dispatchEvent(new Event('mouseenter'))
      expect(element.style.boxShadow).not.toBe(originalShadow)
      expect(element.style.transform).toBe('translateY(-1px)')
      
      // Simulate mouseleave
      element.dispatchEvent(new Event('mouseleave'))
      expect(element.style.transform).toBe('translateY(0)')
    })

    it('should not hover when disabled', () => {
      const cardInstance = new CardComponent(element, { variant: 'raised', disabled: true })
      const originalShadow = element.style.boxShadow
      
      element.dispatchEvent(new Event('mouseenter'))
      expect(element.style.boxShadow).toBe(originalShadow)
      expect(element.style.transform).not.toBe('translateY(-1px)')
    })
  })

  describe('updates', () => {
    it('should update variant', () => {
      const cardInstance = new CardComponent(element, { variant: 'raised' })
      
      cardInstance.setVariant('inset')
      
      expect(cardInstance.getVariant()).toBe('inset')
      expect(element.classList.contains('np-card-inset')).toBe(true)
      expect(element.classList.contains('np-card-raised')).toBe(false)
    })

    it('should update size', () => {
      const cardInstance = new CardComponent(element, { size: 'md' })
      
      cardInstance.setSize('lg')
      
      expect(cardInstance.getSize()).toBe('lg')
      expect(element.classList.contains('np-card-lg')).toBe(true)
      expect(element.classList.contains('np-card-md')).toBe(false)
    })

    it('should update padding', () => {
      const cardInstance = new CardComponent(element)
      
      cardInstance.setPadding('30px')
      
      expect(element.style.padding).toBe('30px')
    })
  })

  describe('factory function', () => {
    it('should create card instance using factory function', () => {
      const cardInstance = card(element, { variant: 'inset' })
      
      expect(cardInstance).toBeInstanceOf(CardComponent)
      expect(cardInstance.getVariant()).toBe('inset')
    })
  })

  describe('destruction', () => {
    it('should clean up when destroyed', () => {
      const cardInstance = new CardComponent(element, { className: 'custom-class' })
      
      expect(element.classList.contains('np-component')).toBe(true)
      expect(element.classList.contains('custom-class')).toBe(true)
      
      cardInstance.destroy()
      
      expect(element.classList.contains('np-component')).toBe(false)
      expect(element.classList.contains('custom-class')).toBe(false)
    })

    it('should emit destroy event', (done) => {
      const cardInstance = new CardComponent(element)
      
      element.addEventListener('np:destroy', () => {
        done()
      })
      
      cardInstance.destroy()
    })
  })

  describe('theme integration', () => {
    it('should respond to theme changes', () => {
      const cardInstance = new CardComponent(element, { theme: 'light' })
      
      // Simulate theme change
      window.dispatchEvent(new CustomEvent('np:theme-change', {
        detail: { theme: lightTheme }
      }))
      
      expect(element.style.backgroundColor).toBe(lightTheme.colors.surface)
    })
  })
})