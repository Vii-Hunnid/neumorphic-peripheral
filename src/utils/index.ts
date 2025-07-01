import { NeumorphicTheme, StyleObject } from '../types'
import { getCurrentTheme } from '../themes'

// CSS utility functions
export function createNeumorphicShadow(
  variant: 'raised' | 'inset' | 'flat' = 'raised',
  intensity: number = 0.15,
  theme?: NeumorphicTheme
): string {
  const currentTheme = theme || getCurrentTheme()
  const { light, dark } = currentTheme.colors.shadow
  
  const offset = Math.round(8 * intensity)
  const blur = Math.round(16 * intensity)
  const spread = Math.round(-2 * intensity)
  
  switch (variant) {
    case 'raised':
      return `${offset}px ${offset}px ${blur}px ${spread}px ${dark}, -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
    case 'inset':
      return `inset ${offset}px ${offset}px ${blur}px ${spread}px ${dark}, inset -${offset}px -${offset}px ${blur}px ${spread}px ${light}`
    case 'flat':
      return `0px 0px 0px 0px transparent`
    default:
      return ''
  }
}

export function applyNeumorphicStyles(
  element: HTMLElement,
  styles: StyleObject,
  theme?: NeumorphicTheme
): void {
  const currentTheme = theme || getCurrentTheme()
  
  // Apply base neumorphic styles
  const baseStyles: StyleObject = {
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: 'none',
    borderRadius: currentTheme.borderRadius,
    transition: `all ${currentTheme.animation.duration} ${currentTheme.animation.easing}`,
    outline: 'none',
    ...styles
  }
  
  Object.entries(baseStyles).forEach(([property, value]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      element.style.setProperty(
        property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`),
        value.toString()
      )
    }
  })
}

export function createStyleSheet(styles: string, id: string): HTMLStyleElement {
  // Remove existing stylesheet if it exists
  const existing = document.getElementById(id)
  if (existing) {
    existing.remove()
  }
  
  const styleElement = document.createElement('style')
  styleElement.id = id
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
  
  return styleElement
}

// DOM utility functions
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string> = {},
  children: (HTMLElement | string)[] = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child))
    } else {
      element.appendChild(child)
    }
  })
  
  return element
}

export function addClassName(element: HTMLElement, className: string): void {
  element.classList.add(`np-${className}`)
}

export function removeClassName(element: HTMLElement, className: string): void {
  element.classList.remove(`np-${className}`)
}

export function toggleClassName(element: HTMLElement, className: string, force?: boolean): boolean {
  return element.classList.toggle(`np-${className}`, force)
}

// Animation utilities
export function animateProperty(
  element: HTMLElement,
  property: string,
  fromValue: string,
  toValue: string,
  duration: number = 200,
  easing: string = 'ease-out'
): Promise<void> {
  return new Promise(resolve => {
    const animation = element.animate(
      [
        { [property]: fromValue },
        { [property]: toValue }
      ],
      {
        duration,
        easing,
        fill: 'forwards'
      }
    )
    
    animation.addEventListener('finish', () => resolve())
  })
}

// Event utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isElement(element: any): element is HTMLElement {
  return element instanceof HTMLElement
}

export function getElementValue(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLSelectElement) {
    return element.value
  }
  return element.textContent || ''
}

export function setElementValue(element: HTMLElement, value: string): void {
  if (element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLSelectElement) {
    element.value = value
  } else {
    element.textContent = value
  }
}

// Focus management
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

// Size and spacing utilities
export function getSizeValue(size: 'sm' | 'md' | 'lg', type: 'padding' | 'height' | 'fontSize'): string {
  const sizeMap = {
    padding: {
      sm: '8px 12px',
      md: '12px 16px',
      lg: '16px 24px'
    },
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px'
    },
    fontSize: {
      sm: '14px',
      md: '16px',
      lg: '18px'
    }
  }
  
  return sizeMap[type][size]
}