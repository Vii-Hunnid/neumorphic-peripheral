/**
 * Performance optimization utilities for Neumorphic Peripheral
 * 
 * This module provides tools for optimizing component performance,
 * monitoring bundle size, and implementing efficient patterns.
 */

// Performance monitoring
export interface PerformanceMetrics {
  componentInitTime: number
  renderTime: number
  eventHandlerTime: number
  memoryUsage: number
  bundleSize: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private observers: IntersectionObserver[] = []
  private resizeObservers: ResizeObserver[] = []

  /**
   * Measure component initialization time
   */
  measureInit<T>(componentName: string, initFunction: () => T): T {
    const startTime = performance.now()
    const result = initFunction()
    const endTime = performance.now()
    
    this.updateMetric(componentName, 'componentInitTime', endTime - startTime)
    return result
  }

  /**
   * Measure render time for DOM operations
   */
  measureRender(componentName: string, renderFunction: () => void): void {
    const startTime = performance.now()
    renderFunction()
    
    // Use requestAnimationFrame to measure actual render time
    requestAnimationFrame(() => {
      const endTime = performance.now()
      this.updateMetric(componentName, 'renderTime', endTime - startTime)
    })
  }

  /**
   * Measure event handler performance
   */
  measureEventHandler(
    componentName: string, 
    eventHandler: (...args: any[]) => any
  ): (...args: any[]) => any {
    return (...args: any[]) => {
      const startTime = performance.now()
      const result = eventHandler(...args)
      const endTime = performance.now()
      
      this.updateMetric(componentName, 'eventHandlerTime', endTime - startTime)
      return result
    }
  }

  /**
   * Monitor memory usage
   */
  measureMemory(componentName: string): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      this.updateMetric(componentName, 'memoryUsage', memInfo.usedJSHeapSize)
    }
  }

  /**
   * Get performance metrics for a component
   */
  getMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName)
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Record<string, PerformanceMetrics> {
    const result: Record<string, PerformanceMetrics> = {}
    this.metrics.forEach((metrics, name) => {
      result[name] = metrics
    })
    return result
  }

  /**
   * Reset metrics for a component
   */
  resetMetrics(componentName: string): void {
    this.metrics.delete(componentName)
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.metrics.clear()
  }

  private updateMetric(
    componentName: string, 
    metricType: keyof PerformanceMetrics, 
    value: number
  ): void {
    let metrics = this.metrics.get(componentName)
    
    if (!metrics) {
      metrics = {
        componentInitTime: 0,
        renderTime: 0,
        eventHandlerTime: 0,
        memoryUsage: 0,
        bundleSize: 0
      }
      this.metrics.set(componentName, metrics)
    }
    
    metrics[metricType] = value
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.resizeObservers.forEach(observer => observer.disconnect())
    this.observers = []
    this.resizeObservers = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Lazy loading utilities
 */
export class LazyLoader {
  private loadedComponents: Set<string> = new Set()
  private intersectionObserver?: IntersectionObserver

  constructor() {
    this.setupIntersectionObserver()
  }

  /**
   * Lazy load a component when it enters viewport
   */
  lazyLoad(
    element: HTMLElement,
    componentLoader: () => Promise<any>,
    componentName: string
  ): Promise<any> {
    return new Promise((resolve) => {
      if (this.loadedComponents.has(componentName)) {
        resolve(null)
        return
      }

      const loadComponent = async () => {
        try {
          const component = await componentLoader()
          this.loadedComponents.add(componentName)
          resolve(component)
        } catch (error) {
          console.error(`Failed to lazy load component ${componentName}:`, error)
          resolve(null)
        }
      }

      // Check if element is already in viewport
      const rect = element.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0

      if (isInViewport) {
        loadComponent()
      } else {
        // Wait for element to enter viewport
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadComponent()
              observer.unobserve(element)
            }
          })
        })
        
        observer.observe(element)
      }
    })
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.dispatchEvent(new CustomEvent('np:in-viewport'))
            }
          })
        },
        { threshold: 0.1 }
      )
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.intersectionObserver?.disconnect()
    this.loadedComponents.clear()
  }
}

/**
 * Throttling and debouncing utilities
 */
export class ThrottleDebounce {
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map()
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Throttle function execution
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (!this.throttleTimers.has(key)) {
        func.apply(this, args)
        this.throttleTimers.set(key, setTimeout(() => {
          this.throttleTimers.delete(key)
        }, limit))
      }
    }
  }

  /**
   * Debounce function execution
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        func.apply(this, args)
        this.debounceTimers.delete(key)
      }, delay)
      
      this.debounceTimers.set(key, timer)
    }
  }

  /**
   * Clear all timers
   */
  cleanup(): void {
    this.throttleTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.throttleTimers.clear()
    this.debounceTimers.clear()
  }
}

/**
 * Virtual scrolling for large lists
 */
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private visibleItems: number
  private totalItems: number
  private renderItem: (index: number) => HTMLElement
  private scrollTop: number = 0

  constructor(
    container: HTMLElement,
    itemHeight: number,
    renderItem: (index: number) => HTMLElement
  ) {
    this.container = container
    this.itemHeight = itemHeight
    this.renderItem = renderItem
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2
    this.totalItems = 0

    this.setupScrollListener()
  }

  /**
   * Set total number of items
   */
  setTotalItems(count: number): void {
    this.totalItems = count
    this.updateContainer()
  }

  /**
   * Update visible items based on scroll position
   */
  private updateVisibleItems(): void {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleItems, this.totalItems)

    // Clear container
    this.container.innerHTML = ''

    // Create spacer for items above viewport
    const topSpacer = document.createElement('div')
    topSpacer.style.height = `${startIndex * this.itemHeight}px`
    this.container.appendChild(topSpacer)

    // Render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.renderItem(i)
      item.style.height = `${this.itemHeight}px`
      this.container.appendChild(item)
    }

    // Create spacer for items below viewport
    const bottomSpacer = document.createElement('div')
    bottomSpacer.style.height = `${(this.totalItems - endIndex) * this.itemHeight}px`
    this.container.appendChild(bottomSpacer)
  }

  private setupScrollListener(): void {
    const throttledUpdate = new ThrottleDebounce().throttle(
      'virtual-scroll',
      () => this.updateVisibleItems(),
      16 // ~60fps
    )

    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop
      throttledUpdate()
    })
  }

  private updateContainer(): void {
    this.container.style.height = `${this.totalItems * this.itemHeight}px`
    this.container.style.overflow = 'auto'
    this.updateVisibleItems()
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    // Remove scroll listeners (would need to store reference)
  }
}

/**
 * Bundle size analyzer
 */
export class BundleSizeAnalyzer {
  /**
   * Estimate bundle size of imported modules
   */
  static async analyzeBundleSize(): Promise<{
    core: number
    components: Record<string, number>
    total: number
  }> {
    const sizes = {
      core: 0,
      components: {} as Record<string, number>,
      total: 0
    }

    // Estimate sizes (in production, these would be actual measurements)
    sizes.core = this.estimateModuleSize('core', [
      'themes', 'utils', 'validators', 'types'
    ])

    sizes.components.card = this.estimateModuleSize('card', ['base', 'utils'])
    sizes.components.input = this.estimateModuleSize('input', ['base', 'utils', 'validators'])
    sizes.components.password = this.estimateModuleSize('password', ['input', 'validators'])
    sizes.components.button = this.estimateModuleSize('button', ['base', 'utils'])
    sizes.components.textarea = this.estimateModuleSize('textarea', ['input', 'utils'])
    sizes.components.toggle = this.estimateModuleSize('toggle', ['base', 'utils'])

    sizes.total = sizes.core + Object.values(sizes.components).reduce((a, b) => a + b, 0)

    return sizes
  }

  /**
   * Track actual bundle size in production
   */
  static trackBundleSize(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as any
      if (navigation) {
        performanceMonitor.updateMetric('bundle', 'bundleSize', navigation.transferSize || 0)
      }
    }
  }

  private static estimateModuleSize(moduleName: string, dependencies: string[]): number {
    // Base size estimates (in bytes, minified + gzipped)
    const baseSizes = {
      core: 3000,
      base: 2000,
      card: 1500,
      input: 2500,
      password: 1000, // Additional on top of input
      button: 1800,
      textarea: 800, // Additional on top of input
      toggle: 2200,
      themes: 800,
      utils: 1200,
      validators: 1500,
      types: 100 // TypeScript definitions don't add runtime size
    }

    let size = baseSizes[moduleName as keyof typeof baseSizes] || 1000
    
    // Add dependency sizes (with some overlap reduction)
    dependencies.forEach(dep => {
      const depSize = baseSizes[dep as keyof typeof baseSizes] || 500
      size += Math.floor(depSize * 0.3) // Assume 30% of dependency size due to tree-shaking
    })

    return size
  }

  /**
   * Recommend optimizations based on usage
   */
  static getOptimizationRecommendations(usedComponents: string[]): string[] {
    const recommendations: string[] = []
    const totalComponents = ['card', 'input', 'password', 'button', 'textarea', 'toggle']
    const unusedComponents = totalComponents.filter(c => !usedComponents.includes(c))

    if (unusedComponents.length > 0) {
      recommendations.push(
        `Consider tree-shaking unused components: ${unusedComponents.join(', ')}`
      )
    }

    if (usedComponents.includes('password') && !usedComponents.includes('input')) {
      recommendations.push(
        'Password component includes Input component code - this is expected'
      )
    }

    if (usedComponents.length === 1) {
      recommendations.push(
        'Great! You\'re only importing what you need. Consider named imports for even better tree-shaking.'
      )
    }

    if (usedComponents.length > 4) {
      recommendations.push(
        'Consider using the main bundle import if you\'re using most components'
      )
    }

    return recommendations
  }
}

/**
 * Memory leak detection and prevention
 */
export class MemoryManager {
  private componentReferences: WeakMap<HTMLElement, Set<Function>> = new WeakMap()
  private globalListeners: Map<string, EventListener> = new Map()

  /**
   * Track component event listeners for cleanup
   */
  trackEventListener(
    element: HTMLElement,
    event: string,
    listener: EventListener
  ): void {
    let listeners = this.componentReferences.get(element)
    if (!listeners) {
      listeners = new Set()
      this.componentReferences.set(element, listeners)
    }
    listeners.add(listener)
  }

  /**
   * Clean up all listeners for an element
   */
  cleanupElement(element: HTMLElement): void {
    const listeners = this.componentReferences.get(element)
    if (listeners) {
      listeners.clear()
      this.componentReferences.delete(element)
    }
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): {
    potentialLeaks: number
    recommendations: string[]
  } {
    const recommendations: string[] = []
    let potentialLeaks = 0

    // Check for detached DOM nodes with listeners
    this.componentReferences.forEach((listeners, element) => {
      if (!document.contains(element)) {
        potentialLeaks++
        recommendations.push(
          `Detached element with ${listeners.size} listeners found. Call destroy() method.`
        )
      }
    })

    // Check global listeners
    if (this.globalListeners.size > 10) {
      recommendations.push(
        `${this.globalListeners.size} global listeners registered. Consider cleanup.`
      )
    }

    return { potentialLeaks, recommendations }
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    if ('gc' in window) {
      (window as any).gc()
    }
  }
}

// Global instances
export const lazyLoader = new LazyLoader()
export const throttleDebounce = new ThrottleDebounce()
export const memoryManager = new MemoryManager()

/**
 * Performance optimization decorators
 */
export function withPerformanceMonitoring(componentName: string) {
  return function<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        const result = performanceMonitor.measureInit(componentName, () => {
          super(...args)
        })
        
        // Monitor memory after initialization
        setTimeout(() => {
          performanceMonitor.measureMemory(componentName)
        }, 0)
      }
    }
  }
}

/**
 * Cleanup utility for preventing memory leaks
 */
export function autoCleanup() {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      performanceMonitor.cleanup()
      lazyLoader.cleanup()
      throttleDebounce.cleanup()
    })
  }
}

// Auto-initialize cleanup
autoCleanup()