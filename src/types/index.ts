// Core theme types
export interface NeumorphicTheme {
  colors: {
    surface: string
    shadow: {
      light: string
      dark: string
    }
    text: string
    textSecondary: string
    accent: string
    error: string
    success: string
  }
  borderRadius: string
  spacing: string
  shadowIntensity: number
  animation: {
    duration: string
    easing: string
  }
}

// Component configuration types
export interface BaseComponentConfig {
  theme?: NeumorphicTheme | 'light' | 'dark'
  className?: string
  disabled?: boolean
}

export interface CardConfig extends BaseComponentConfig {
  variant?: 'raised' | 'inset' | 'flat'
  size?: 'sm' | 'md' | 'lg'
  padding?: string
}

export interface InputConfig extends BaseComponentConfig {
  validate?: ValidationConfig | ValidationFunction
  placeholder?: string
  errorMessage?: string
  showValidation?: boolean
  validateOn?: 'blur' | 'change' | 'submit'
}

export interface PasswordConfig extends InputConfig {
  showToggle?: boolean
  togglePosition?: 'left' | 'right'
  strengthIndicator?: boolean
  maskCharacter?: string
}

export interface TextareaConfig extends BaseComponentConfig {
  autoResize?: boolean
  maxHeight?: string
  minHeight?: string
  placeholder?: string
  validate?: ValidationConfig | ValidationFunction
  validateOn?: 'blur' | 'change' | 'submit'
  showValidation?: boolean
}

export interface ToggleConfig extends BaseComponentConfig {
  type?: 'switch' | 'checkbox' | 'radio'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
}

export interface ButtonConfig extends BaseComponentConfig {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: 'left' | 'right' | 'only'
  loading?: boolean
  onClick?: (event: Event) => void
}

// Validation types
export interface ValidationConfig {
  required?: boolean
  email?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: ValidationFunction[]
}

export type ValidationFunction = (value: string) => string | null

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Component instance types
export interface ComponentInstance {
  element: HTMLElement
  config: BaseComponentConfig
  destroy: () => void
  update: (newConfig: Partial<BaseComponentConfig>) => void
}

export interface InputInstance extends ComponentInstance {
  config: InputConfig
  validate: () => ValidationResult
  getValue: () => string
  setValue: (value: string) => void
  clearErrors: () => void
}

export interface PasswordInstance extends InputInstance {
  config: PasswordConfig
  toggleVisibility: () => void
  isVisible: () => boolean
}

export interface TextareaInstance extends ComponentInstance {
  config: TextareaConfig
  validate: () => ValidationResult
  getValue: () => string
  setValue: (value: string) => void
  clearErrors: () => void
  insertAtCursor: (text: string) => void
  getSelection: () => { start: number; end: number; text: string }
  setSelection: (start: number, end: number) => void
}

export interface ToggleInstance extends ComponentInstance {
  config: ToggleConfig
  toggle: () => void
  check: () => void
  uncheck: () => void
  setChecked: (checked: boolean) => void
  isChecked: () => boolean
  getValue: () => string
  setValue: (value: string) => void
}

// Global configuration
export interface GlobalConfig {
  theme: NeumorphicTheme
  prefix: string
  autoInit: boolean
}

// Event types
export interface NeumorphicEvent extends CustomEvent {
  detail: {
    instance: ComponentInstance
    value?: any
  }
}

// Built-in themes
export type ThemePreset = 'light' | 'dark'

// CSS-in-JS style object
export interface StyleObject {
  [property: string]: string | number | StyleObject
}