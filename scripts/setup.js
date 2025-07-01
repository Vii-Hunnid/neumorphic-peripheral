#!/usr/bin/env node

/**
 * Automated setup script for Neumorphic Peripheral development
 * 
 * This script sets up the complete development environment including:
 * - Installing dependencies
 * - Setting up git hooks
 * - Creating development files
 * - Running initial build and tests
 * - Setting up examples
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const https = require('https')

class ProjectSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..')
    this.steps = [
      'checkPrerequisites',
      'installDependencies', 
      'setupGitHooks',
      'createDevFiles',
      'buildProject',
      'runTests',
      'setupExamples',
      'generateDocs',
      'finalizeSetup'
    ]
  }

  async run() {
    console.log('🚀 Setting up Neumorphic Peripheral development environment...\n')
    
    try {
      for (const step of this.steps) {
        await this[step]()
      }
      
      this.printSuccess()
    } catch (error) {
      console.error('❌ Setup failed:', error.message)
      if (process.env.NODE_ENV === 'development') {
        console.error(error.stack)
      }
      process.exit(1)
    }
  }

  async checkPrerequisites() {
    console.log('📋 Checking prerequisites...')
    
    // Check Node.js version
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1))
    
    if (majorVersion < 16) {
      throw new Error(`Node.js 16+ required. Current version: ${nodeVersion}`)
    }
    
    console.log(`  ✅ Node.js ${nodeVersion}`)
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
      console.log(`  ✅ npm ${npmVersion}`)
    } catch {
      throw new Error('npm is required but not found')
    }
    
    // Check git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim()
      console.log(`  ✅ ${gitVersion}`)
    } catch {
      console.log('  ⚠️ Git not found - some features will be unavailable')
    }
    
    console.log('')
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...')
    
    // Install main dependencies
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: this.projectRoot 
    })
    
    // Install optional peer dependencies for development
    try {
      execSync('npm install --save-dev zod yup', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      })
      console.log('  ✅ Optional validation libraries installed')
    } catch {
      console.log('  ⚠️ Optional validation libraries not installed')
    }
    
    console.log('  ✅ Dependencies installed\n')
  }

  async setupGitHooks() {
    console.log('🪝 Setting up git hooks...')
    
    const hooksDir = path.join(this.projectRoot, '.git', 'hooks')
    
    if (!fs.existsSync(path.join(this.projectRoot, '.git'))) {
      console.log('  ⚠️ Not a git repository - skipping hooks setup')
      console.log('')
      return
    }
    
    // Pre-commit hook
    const preCommitHook = `#!/bin/sh
# Neumorphic Peripheral pre-commit hook
set -e

echo "🔍 Running pre-commit checks..."

# Run linting
npm run lint

# Run type checking  
npm run typecheck

# Run tests
npm run test

echo "✅ Pre-commit checks passed"
`
    
    const preCommitPath = path.join(hooksDir, 'pre-commit')
    fs.writeFileSync(preCommitPath, preCommitHook)
    fs.chmodSync(preCommitPath, '755')
    
    // Pre-push hook
    const prePushHook = `#!/bin/sh
# Neumorphic Peripheral pre-push hook
set -e

echo "🚀 Running pre-push checks..."

# Build project
npm run build

# Run bundle analysis
npm run analyze

echo "✅ Pre-push checks passed"
`
    
    const prePushPath = path.join(hooksDir, 'pre-push')
    fs.writeFileSync(prePushPath, prePushHook)
    fs.chmodSync(prePushPath, '755')
    
    console.log('  ✅ Git hooks configured\n')
  }

  async createDevFiles() {
    console.log('📁 Creating development files...')
    
    // .gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
*.tsbuildinfo

# Coverage
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Bundle analysis
bundle-analysis.json

# Temporary
tmp/
temp/
`
    
    const gitignorePath = path.join(this.projectRoot, '.gitignore')
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, gitignore)
      console.log('  ✅ .gitignore created')
    }
    
    // VS Code settings
    const vscodeDir = path.join(this.projectRoot, '.vscode')
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir)
    }
    
    const vscodeSettings = {
      "typescript.preferences.importModuleSpecifier": "relative",
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "editor.formatOnSave": true,
      "files.associations": {
        "*.css": "css"
      },
      "editor.rulers": [80, 120],
      "typescript.preferences.includePackageJsonAutoImports": "off"
    }
    
    const settingsPath = path.join(vscodeDir, 'settings.json')
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(vscodeSettings, null, 2))