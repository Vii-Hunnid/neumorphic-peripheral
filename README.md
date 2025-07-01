# neumorphic-peripheral

A lightweight, framework-agnostic JavaScript/TypeScript library that provides beautiful neumorphic styling and functionality for any web framework.

## Features

- **Universal Framework Support** - Works with React, Vue, Svelte, Angular, Next.js, Nuxt.js, and vanilla JavaScript
- **Lightweight** - Under 20kb gzipped with zero dependencies
- **TypeScript Ready** - Full TypeScript support with comprehensive type definitions
- **Accessible** - WCAG 2.1 AA compliant with screen reader support
- **Themeable** - Built-in light/dark themes with custom theme support
- **Smart Components** - Password fields with eye toggle, input validation, and more

## Quick Start

### Installation

```bash
npm install neumorphic-peripheral
```

### Basic Usage

```javascript
import np from 'neumorphic-peripheral'

// Apply neumorphic styling to any element
np.card(document.getElementById('my-card'))
np.input(document.querySelector('.email-input'))
np.password(document.querySelector('.password-field'))
np.button(document.querySelector('.submit-btn'))
```

### Framework Examples

#### React/Next.js

```jsx
import np from 'neumorphic-peripheral'
import { useEffect, useRef } from 'react'

function MyComponent() {
  const cardRef = useRef()
  const inputRef = useRef()
  
  useEffect(() => {
    np.card(cardRef.current)
    np.input(inputRef.current, { validate: { email: true, required: true } })
  }, [])
  
  return (
    <div ref={cardRef}>
      <input ref={inputRef} type="email" placeholder="Email" />
    </div>
  )
}
```

#### Vue/Nuxt.js

```vue
<template>
  <div ref="cardEl">
    <input ref="inputEl" type="email" placeholder="Email" />
  </div>
</template>

<script setup>
import np from 'neumorphic-peripheral'
import { ref, onMounted } from 'vue'

const cardEl = ref()
const inputEl = ref()

onMounted(() => {
  np.card(cardEl.value)
  np.input(inputEl.value, { validate: { email: true } })
})
</script>
```

#### Svelte

```svelte
<script>
  import np from 'neumorphic-peripheral'
  import { onMount } from 'svelte'
  
  let cardEl
  let inputEl
  
  onMount(() => {
    np.card(cardEl)
    np.input(inputEl, { validate: { email: true } })
  })
</script>

<div bind:this={cardEl}>
  <input bind:this={inputEl} type="email" placeholder="Email" />
</div>
```

## Components

### Card

Create beautiful neumorphic container elements.

```javascript
np.card(element, {
  variant: 'raised' | 'inset' | 'flat', // default: 'raised'
  size: 'sm' | 'md' | 'lg',             // default: 'md'
  padding: '16px',                      // custom padding
  theme: 'light' | 'dark' | customTheme
})
```

### Input

Enhanced input fields with validation support.

```javascript
np.input(element, {
  validate: {
    required: true,
    email: true,
    minLength: 8,
    pattern: /^[A-Za-z]+$/,
    custom: [(value) => value.includes('@') ? null : 'Must contain @']
  },
  validateOn: 'blur' | 'change' | 'submit', // default: 'blur'
  placeholder: 'Enter text...',
  errorMessage: 'Custom error message'
})
```

### Password

Smart password fields with visibility toggle and strength indicator.

```javascript
np.password(element, {
  showToggle: true,                    // default: true
  togglePosition: 'right' | 'left',   // default: 'right'  
  strengthIndicator: true,             // default: false
  validate: {
    required: true,
    minLength: 8
  }
})
```

The password component automatically:
- Converts text to bullet characters
- Adds a clickable eye icon for visibility toggle
- Shows password strength indicators (if enabled)
- Includes all input validation features

### Button

Interactive neumorphic buttons with loading states.

```javascript
np.button(element, {
  variant: 'primary' | 'secondary' | 'ghost', // default: 'primary'
  size: 'sm' | 'md' | 'lg',                   // default: 'md'
  loading: false,                             // default: false
  onClick: (event) => console.log('clicked')
})
```

## Validation

Built-in validation system with real-time feedback.

### Built-in Validators

```javascript
np.input(element, {
  validate: {
    required: true,           // Field is required
    email: true,              // Valid email format
    minLength: 8,             // Minimum character length
    maxLength: 50,            // Maximum character length
    pattern: /^\d+$/,         // Custom regex pattern
    custom: [                 // Custom validation functions
      (value) => value.startsWith('A') ? null : 'Must start with A'
    ]
  }
})
```

### Custom Validation

```javascript
const customValidator = (value) => {
  if (value.length < 5) return 'Too short'
  if (!value.includes('@')) return 'Must contain @'
  return null // Valid
}

np.input(element, { validate: customValidator })
```

## Theming

### Using Built-in Themes

```javascript
import np from 'neumorphic-peripheral'

// Set global theme
np.setTheme('dark')
np.setTheme('light')

// Auto-detect system preference
np.autoDetectTheme()
```

### Custom Themes

```javascript
np.setTheme({
  colors: {
    surface: '#f0f0f0',
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
})
```

### CSS Custom Properties

The library automatically updates CSS custom properties that you can use in your own styles:

```css
:root {
  --np-surface: #f0f0f3;
  --np-shadow-light: #ffffff;
  --np-shadow-dark: #d1d9e6;
  --np-text: #333333;
  --np-accent: #6c5ce7;
  --np-radius: 12px;
  /* ... and more */
}

.my-custom-element {
  background: var(--np-surface);
  border-radius: var(--np-radius);
  color: var(--np-text);
}
```

## Auto-Initialization

Use data attributes for automatic component initialization:

```html
<!-- Auto-initialize on DOM ready -->
<div data-np="card" data-np-config='{"variant": "inset"}'>
  <input data-np="input" data-np-config='{"validate": {"email": true}}' 
         type="email" placeholder="Email">
  <input data-np="password" data-np-config='{"strengthIndicator": true}' 
         type="password" placeholder="Password">
  <button data-np="button" data-np-config='{"variant": "primary"}'>
    Submit
  </button>
</div>
```

Enable auto-initialization:

```javascript
np.config({ autoInit: true })
```

## API Reference

### Component Methods

All components return an instance with these methods:

```javascript
const cardInstance = np.card(element, config)

// Update configuration
cardInstance.update({ variant: 'inset' })

// Destroy component
cardInstance.destroy()

// Get current config
const config = cardInstance.config
```

### Input/Password Specific Methods

```javascript
const inputInstance = np.input(element, config)

// Validation
const result = inputInstance.validate()
const isValid = inputInstance.isValid()
inputInstance.clearErrors()

// Value management
inputInstance.setValue('new value')
const value = inputInstance.getValue()

// Focus management
inputInstance.focus()
inputInstance.blur()
```

### Password Specific Methods

```javascript
const passwordInstance = np.password(element, config)

// Visibility toggle
passwordInstance.toggleVisibility()
passwordInstance.showPassword()
passwordInstance.hidePassword()
const isVisible = passwordInstance.isVisible()

// Password strength
const strength = passwordInstance.getPasswordStrength()
```

### Button Specific Methods

```javascript
const buttonInstance = np.button(element, config)

// Loading state
buttonInstance.setLoading(true)

// Programmatic click
buttonInstance.click()

// Update properties
buttonInstance.setVariant('secondary')
buttonInstance.setSize('lg')
```

## Events

Components emit custom events you can listen for:

```javascript
element.addEventListener('np:input', (e) => {
  console.log('Input value changed:', e.detail.value)
})

element.addEventListener('np:validation', (e) => {
  console.log('Validation result:', e.detail.result)
})

element.addEventListener('np:click', (e) => {
  console.log('Button clicked:', e.detail)
})

element.addEventListener('np:visibility-toggle', (e) => {
  console.log('Password visibility:', e.detail.visible)
})

// Theme changes
window.addEventListener('np:theme-change', (e) => {
  console.log('Theme changed:', e.detail.theme)
})
```

## Accessibility

The library is built with accessibility in mind:

- Full keyboard navigation support
- Screen reader compatible with proper ARIA attributes
- High contrast mode support
- Reduced motion support
- Focus management and indicators
- Semantic HTML structure

## CSS Stylesheet (Optional)

Include the optional CSS file for enhanced styling:

```javascript
import 'neumorphic-peripheral/styles/neumorphic.css'
```

Or link it in HTML:

```html
<link rel="stylesheet" href="node_modules/neumorphic-peripheral/styles/neumorphic.css">
```

## Browser Support

- Chrome 70+
- Firefox 70+
- Safari 12+
- Edge 79+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.