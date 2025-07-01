#!/usr/bin/env node

/**
 * Bundle Size Analyzer for Neumorphic Peripheral
 * 
 * This script analyzes the bundle size and provides optimization recommendations
 * Run with: node scripts/bundle-analyzer.js
 */

const fs = require('fs')
const path = require('path')
const gzipSize = require('gzip-size')
const { execSync } = require('child_process')

class BundleAnalyzer {
  constructor() {
    this.distPath = path.join(__dirname, '../dist')
    this.results = {
      total: { size: 0, gzipped: 0 },
      files: {},
      recommendations: []
    }
  }

  async analyze() {
    console.log('🔍 Analyzing bundle size...\n')

    // Ensure dist directory exists
    if (!fs.existsSync(this.distPath)) {
      console.error('❌ Dist directory not found. Run npm run build first.')
      process.exit(1)
    }

    // Analyze each file in dist
    const files = fs.readdirSync(this.distPath)
    
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        await this.analyzeFile(file)
      }
    }

    this.generateRecommendations()
    this.printResults()
    this.saveResults()
  }

  async analyzeFile(filename) {
    const filePath = path.join(this.distPath, filename)
    const content = fs.readFileSync(filePath)
    
    const size = content.length
    const gzipped = await gzipSize(content)
    
    this.results.files[filename] = {
      size,
      gzipped,
      sizeFormatted: this.formatBytes(size),
      gzippedFormatted: this.formatBytes(gzipped)
    }
    
    this.results.total.size += size
    this.results.total.gzipped += gzipped
  }

  generateRecommendations() {
    const { total, files } = this.results
    const TARGET_SIZE = 20 * 1024 // 20KB target

    // Check total size
    if (total.gzipped > TARGET_SIZE) {
      this.results.recommendations.push({
        type: 'warning',
        message: `Bundle size (${this.formatBytes(total.gzipped)}) exceeds target (${this.formatBytes(TARGET_SIZE)})`
      })
    } else {
      this.results.recommendations.push({
        type: 'success',
        message: `✅ Bundle size (${this.formatBytes(total.gzipped)}) is under target (${this.formatBytes(TARGET_SIZE)})`
      })
    }

    // Check individual files
    Object.entries(files).forEach(([filename, data]) => {
      if (filename.includes('index.esm.js') && data.gzipped > 15 * 1024) {
        this.results.recommendations.push({
          type: 'warning',
          message: `Main bundle ${filename} is large (${data.gzippedFormatted}). Consider code splitting.`
        })
      }

      if (data.gzipped > 5 * 1024 && !filename.includes('index')) {
        this.results.recommendations.push({
          type: 'info',
          message: `${filename} is relatively large (${data.gzippedFormatted}). Check for optimization opportunities.`
        })
      }
    })

    // Analyze source map sizes
    const sourceMapFiles = Object.keys(files).filter(f => f.endsWith('.map'))
    if (sourceMapFiles.length === 0) {
      this.results.recommendations.push({
        type: 'info',
        message: '💡 Consider generating source maps for better debugging in development'
      })
    }

    // Check for tree-shaking opportunities
    this.checkTreeShaking()
  }

  checkTreeShaking() {
    try {
      // Analyze the built bundle for unused exports
      const mainBundle = path.join(this.distPath, 'index.esm.js')
      if (fs.existsSync(mainBundle)) {
        const content = fs.readFileSync(mainBundle, 'utf8')
        
        // Simple heuristics for tree-shaking analysis
        const exportCount = (content.match(/export\s+/g) || []).length
        const importCount = (content.match(/import\s+/g) || []).length
        
        if (exportCount > importCount * 2) {
          this.results.recommendations.push({
            type: 'info',
            message: '🌳 Many exports detected. Ensure consumers use named imports for better tree-shaking.'
          })
        }

        // Check for dead code patterns
        if (content.includes('/* unused harmony export')) {
          this.results.recommendations.push({
            type: 'warning',
            message: '🗑️ Unused exports detected. Consider removing or marking as side-effect-free.'
          })
        }
      }
    } catch (error) {
      console.warn('Warning: Could not analyze tree-shaking opportunities:', error.message)
    }
  }

  printResults() {
    console.log('📊 Bundle Analysis Results')
    console.log('=' .repeat(50))
    
    // Print file breakdown
    console.log('\n📁 File Breakdown:')
    Object.entries(this.results.files).forEach(([filename, data]) => {
      const percentage = ((data.gzipped / this.results.total.gzipped) * 100).toFixed(1)
      console.log(`  ${filename}`)
      console.log(`    Size: ${data.sizeFormatted} (${data.gzippedFormatted} gzipped) - ${percentage}%`)
    })

    // Print totals
    console.log('\n📈 Total Bundle Size:')
    console.log(`  Uncompressed: ${this.formatBytes(this.results.total.size)}`)
    console.log(`  Gzipped: ${this.formatBytes(this.results.total.gzipped)}`)

    // Print recommendations
    console.log('\n💡 Recommendations:')
    this.results.recommendations.forEach(rec => {
      const icon = rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️'
      console.log(`  ${icon} ${rec.message}`)
    })

    // Performance metrics
    this.printPerformanceMetrics()
  }

  printPerformanceMetrics() {
    const gzippedSize = this.results.total.gzipped
    
    console.log('\n🚀 Performance Metrics:')
    
    // Download time estimates
    const connections = {
      'Slow 3G': 50 * 1024 / 8, // 50kbps / 8 = bytes per second
      'Fast 3G': 1.6 * 1024 * 1024 / 8, // 1.6Mbps
      'WiFi': 10 * 1024 * 1024 / 8 // 10Mbps
    }

    Object.entries(connections).forEach(([name, bytesPerSecond]) => {
      const timeSeconds = gzippedSize / bytesPerSecond
      console.log(`  ${name}: ${timeSeconds < 1 ? '<1s' : `${timeSeconds.toFixed(1)}s`}`)
    })

    // Parse time estimate (rough)
    const parseTimeMs = gzippedSize / 1024 * 2 // ~2ms per KB on average device
    console.log(`  Estimated parse time: ${parseTimeMs.toFixed(1)}ms`)

    // Cache efficiency
    const cacheRatio = gzippedSize < 50 * 1024 ? 'Excellent' : 
                      gzippedSize < 100 * 1024 ? 'Good' : 'Needs improvement'
    console.log(`  Cache efficiency: ${cacheRatio}`)
  }

  saveResults() {
    const outputPath = path.join(__dirname, '../bundle-analysis.json')
    const report = {
      timestamp: new Date().toISOString(),
      version: this.getPackageVersion(),
      results: this.results,
      comparison: this.loadPreviousResults()
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Detailed report saved to: ${outputPath}`)
  }

  loadPreviousResults() {
    try {
      const outputPath = path.join(__dirname, '../bundle-analysis.json')
      if (fs.existsSync(outputPath)) {
        const previous = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
        const currentSize = this.results.total.gzipped
        const previousSize = previous.results.total.gzipped
        const diff = currentSize - previousSize
        const percentChange = ((diff / previousSize) * 100).toFixed(1)

        return {
          previousSize: this.formatBytes(previousSize),
          currentSize: this.formatBytes(currentSize),
          difference: this.formatBytes(Math.abs(diff)),
          percentChange: `${diff > 0 ? '+' : ''}${percentChange}%`,
          trend: diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'unchanged'
        }
      }
    } catch (error) {
      console.warn('Could not load previous results:', error.message)
    }
    return null
  }

  getPackageVersion() {
    try {
      const packagePath = path.join(__dirname, '../package.json')
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      return packageJson.version
    } catch {
      return 'unknown'
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
}

// Component-specific analyzer
class ComponentAnalyzer {
  constructor() {
    this.srcPath = path.join(__dirname, '../src')
  }

  async analyzeComponents() {
    console.log('\n🧩 Component Analysis')
    console.log('=' .repeat(30))

    const components = ['card', 'input', 'password', 'button', 'textarea', 'toggle']
    const analysis = {}

    for (const component of components) {
      const componentPath = path.join(this.srcPath, 'components', `${component}.ts`)
      if (fs.existsSync(componentPath)) {
        analysis[component] = await this.analyzeComponent(componentPath)
      }
    }

    this.printComponentAnalysis(analysis)
    return analysis
  }

  async analyzeComponent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    
    return {
      linesOfCode: content.split('\n').length,
      fileSize: content.length,
      dependencies: this.extractDependencies(content),
      complexity: this.calculateComplexity(content),
      methods: this.extractMethods(content)
    }
  }

  extractDependencies(content) {
    const imports = content.match(/import\s+.*?from\s+['"`](.*?)['"`]/g) || []
    return imports
      .map(imp => imp.match(/from\s+['"`](.*?)['"`]/)?.[1])
      .filter(Boolean)
      .filter(dep => dep.startsWith('.')) // Only relative imports (internal deps)
  }

  calculateComplexity(content) {
    // Simple cyclomatic complexity estimation
    const complexityKeywords = [
      'if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch', '&&', '||', '?'
    ]
    
    let complexity = 1 // Base complexity
    complexityKeywords.forEach(keyword => {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'))
      if (matches) complexity += matches.length
    })
    
    return complexity
  }

  extractMethods(content) {
    const methods = content.match(/(?:public|private|protected)?\s*(\w+)\s*\([^)]*\)\s*[:{]/g) || []
    return methods.length
  }

  printComponentAnalysis(analysis) {
    Object.entries(analysis).forEach(([name, data]) => {
      console.log(`\n📦 ${name.toUpperCase()} Component:`)
      console.log(`  Lines of code: ${data.linesOfCode}`)
      console.log(`  File size: ${this.formatBytes(data.fileSize)}`)
      console.log(`  Dependencies: ${data.dependencies.length}`)
      console.log(`  Complexity: ${data.complexity}`)
      console.log(`  Methods: ${data.methods}`)
      
      if (data.complexity > 20) {
        console.log(`  ⚠️ High complexity detected`)
      }
      
      if (data.dependencies.length > 5) {
        console.log(`  ⚠️ Many dependencies - consider refactoring`)
      }
    })
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
}

// CLI Runner
async function main() {
  const args = process.argv.slice(2)
  const showComponents = args.includes('--components') || args.includes('-c')
  const showHelp = args.includes('--help') || args.includes('-h')

  if (showHelp) {
    console.log(`
Bundle Analyzer for Neumorphic Peripheral

Usage: node scripts/bundle-analyzer.js [options]

Options:
  -c, --components    Analyze individual components
  -h, --help         Show this help message

Examples:
  node scripts/bundle-analyzer.js
  node scripts/bundle-analyzer.js --components
    `)
    process.exit(0)
  }

  try {
    // Main bundle analysis
    const bundleAnalyzer = new BundleAnalyzer()
    await bundleAnalyzer.analyze()

    // Component analysis (optional)
    if (showComponents) {
      const componentAnalyzer = new ComponentAnalyzer()
      await componentAnalyzer.analyzeComponents()
    }

    console.log('\n🎉 Analysis complete!')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { BundleAnalyzer, ComponentAnalyzer }