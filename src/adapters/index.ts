/**
 * Validation Library Adapters
 * 
 * This module provides adapters for popular validation libraries,
 * allowing seamless integration with neumorphic-peripheral components.
 */

// Export all adapters
export * from './zod'
// export * from './yup'
export * from './joi'

// Adapter detection utility
export function detectAvailableAdapters(): {
  zod: boolean
  yup: boolean
  joi: boolean
} {
  const adapters = {
    zod: false,
    yup: false,
    joi: false
  }

  try {
    require.resolve('zod')
    adapters.zod = true
  } catch {
    // Zod not available
  }

  try {
    require.resolve('yup')
    adapters.yup = true
  } catch {
    // Yup not available
  }

  try {
    require.resolve('joi')
    adapters.joi = true
  } catch {
    // Joi not available
  }

  return adapters
}

// Auto-detect and suggest adapters
export function suggestAdapter(): string {
  const available = detectAvailableAdapters()
  const availableLibs = Object.entries(available)
    .filter(([, isAvailable]) => isAvailable)
    .map(([name]) => name)
  
  if (availableLibs.length === 0) {
    return 'No validation library adapters detected. Install zod, yup, or joi for enhanced validation.'
  } else if (availableLibs.length === 1) {
    const lib = availableLibs[0]
    return `${lib.charAt(0).toUpperCase() + lib.slice(1)} adapter available - great choice for validation!`
  } else {
    return `Multiple validation libraries available: ${availableLibs.join(', ')}. Zod recommended for TypeScript projects.`
  }
}