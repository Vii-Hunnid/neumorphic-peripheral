import { NeumorphicTheme, ThemePreset } from '../types'

export const lightTheme: NeumorphicTheme = {
  colors: {
    surface: '#f0f0f3',
    shadow: {
      light: '#ffffff',
      dark: '#d1d9e6'
    },
    text: '#333333',
    textSecondary: '#666666',
    accent: '#6c5ce7',
    error: '#e74c3c',
    success: '#27ae60'
  },
  borderRadius: '12px',
  spacing: '16px',
  shadowIntensity: 0.15,
  animation: {
    duration: '0.2s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

export const darkTheme: NeumorphicTheme = {
  colors: {
    surface: '#2d3748',
    shadow: {
      light: '#4a5568',
      dark: '#1a202c'
    },
    text: '#f7fafc',
    textSecondary: '#cbd5e0',
    accent: '#805ad5',
    error: '#fc8181',
    success: '#68d391'
  },
  borderRadius: '12px',
  spacing: '16px',
  shadowIntensity: 0.2,
  animation: {
    duration: '0.2s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

export const themes: Record<ThemePreset, NeumorphicTheme> = {
  light: lightTheme,
  dark: darkTheme
}

let currentTheme: NeumorphicTheme = lightTheme

export function setTheme(theme: NeumorphicTheme | ThemePreset): void {
  if (typeof theme === 'string') {
    currentTheme = themes[theme]
  } else {
    currentTheme = theme
  }
  
  // Apply CSS custom properties
  applyCSSProperties(currentTheme)
  
  // Dispatch theme change event
  window.dispatchEvent(new CustomEvent('np:theme-change', {
    detail: { theme: currentTheme }
  }))
}

export function getCurrentTheme(): NeumorphicTheme {
  return currentTheme
}

export function createCustomTheme(overrides: Partial<NeumorphicTheme>): NeumorphicTheme {
  return {
    ...currentTheme,
    ...overrides,
    colors: {
      ...currentTheme.colors,
      ...overrides.colors,
      shadow: {
        ...currentTheme.colors.shadow,
        ...overrides.colors?.shadow
      }
    },
    animation: {
      ...currentTheme.animation,
      ...overrides.animation
    }
  }
}

function applyCSSProperties(theme: NeumorphicTheme): void {
  const root = document.documentElement
  
  // Colors
  root.style.setProperty('--np-surface', theme.colors.surface)
  root.style.setProperty('--np-shadow-light', theme.colors.shadow.light)
  root.style.setProperty('--np-shadow-dark', theme.colors.shadow.dark)
  root.style.setProperty('--np-text', theme.colors.text)
  root.style.setProperty('--np-text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--np-accent', theme.colors.accent)
  root.style.setProperty('--np-error', theme.colors.error)
  root.style.setProperty('--np-success', theme.colors.success)
  
  // Other properties
  root.style.setProperty('--np-radius', theme.borderRadius)
  root.style.setProperty('--np-spacing', theme.spacing)
  root.style.setProperty('--np-shadow-intensity', theme.shadowIntensity.toString())
  root.style.setProperty('--np-duration', theme.animation.duration)
  root.style.setProperty('--np-easing', theme.animation.easing)
}

// Auto-detect preferred color scheme
export function autoDetectTheme(): void {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    
    setTheme(prefersDark.matches ? 'dark' : 'light')
    
    // Listen for changes
    prefersDark.addEventListener('change', (e) => {
      setTheme(e.matches ? 'dark' : 'light')
    })
  }
}

// Initialize with system theme
if (typeof window !== 'undefined') {
  autoDetectTheme()
}