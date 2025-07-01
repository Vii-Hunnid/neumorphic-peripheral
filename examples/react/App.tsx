import React, { useEffect, useRef, useState } from 'react'
import np from 'neumorphic-peripheral'
import 'neumorphic-peripheral/styles/neumorphic.css'

interface FormData {
  email: string
  password: string
  message: string
  newsletter: boolean
}

const App: React.FC = () => {
  // Refs for neumorphic components
  const cardRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const newsletterRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const themeToggleRef = useRef<HTMLButtonElement>(null)

  // Component state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    message: '',
    newsletter: false
  })
  const [isDark, setIsDark] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Component instances
  const [components, setComponents] = useState<{
    card?: any
    email?: any
    password?: any
    message?: any
    newsletter?: any
    submit?: any
    themeToggle?: any
  }>({})

  // Initialize neumorphic components
  useEffect(() => {
    const newComponents: any = {}

    if (cardRef.current) {
      newComponents.card = np.card(cardRef.current, {
        variant: 'raised',
        size: 'lg'
      })
    }

    if (emailRef.current) {
      newComponents.email = np.input(emailRef.current, {
        validate: {
          required: true,
          email: true
        },
        validateOn: 'blur',
        placeholder: 'Enter your email'
      })
    }

    if (passwordRef.current) {
      newComponents.password = np.password(passwordRef.current, {
        showToggle: true,
        strengthIndicator: true,
        validate: {
          required: true,
          minLength: 8
        },
        placeholder: 'Enter your password'
      })
    }

    if (messageRef.current) {
      newComponents.message = np.textarea(messageRef.current, {
        autoResize: true,
        maxHeight: '150px',
        placeholder: 'Enter your message...',
        validate: {
          maxLength: 500
        }
      })
    }

    if (newsletterRef.current) {
      newComponents.newsletter = np.toggle(newsletterRef.current, {
        type: 'switch',
        size: 'md',
        onChange: (checked) => {
          setFormData(prev => ({ ...prev, newsletter: checked }))
        }
      })
    }

    if (submitRef.current) {
      newComponents.submit = np.button(submitRef.current, {
        variant: 'primary',
        size: 'lg'
      })
    }

    if (themeToggleRef.current) {
      newComponents.themeToggle = np.button(themeToggleRef.current, {
        variant: 'ghost',
        size: 'sm'
      })
    }

    setComponents(newComponents)

    // Cleanup function
    return () => {
      Object.values(newComponents).forEach(component => {
        component?.destroy()
      })
    }
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const emailValid = components.email?.validate()
    const passwordValid = components.password?.validate()
    const messageValid = components.message?.validate()

    if (!emailValid?.isValid || !passwordValid?.isValid || !messageValid?.isValid) {
      return
    }

    setIsSubmitting(true)
    components.submit?.setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get current values from components
      const submitData = {
        email: components.email?.getValue() || '',
        password: components.password?.getValue() || '',
        message: components.message?.getValue() || '',
        newsletter: components.newsletter?.isChecked() || false
      }

      console.log('Form submitted:', submitData)
      alert('Form submitted successfully!')

      // Reset form
      components.email?.setValue('')
      components.password?.setValue('')
      components.message?.setValue('')
      components.newsletter?.setChecked(false)

    } catch (error) {
      console.error('Submission error:', error)
      alert('Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
      components.submit?.setLoading(false)
    }
  }

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    np.setTheme(newTheme)
  }

  // Handle input changes (for React state sync)
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      background: isDark 
        ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
        : 'linear-gradient(135deg, #f0f0f3 0%, #e8e8eb 100%)',
      transition: 'background 0.3s ease'
    }}>
      {/* Theme Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        <button 
          ref={themeToggleRef}
          onClick={handleThemeToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            color: isDark ? '#f7fafc' : '#333',
            marginBottom: '10px',
            fontWeight: 300,
            fontSize: '2.5rem'
          }}>
            React + Neumorphic Peripheral
          </h1>
          <p style={{ 
            color: isDark ? '#cbd5e0' : '#666',
            fontSize: '1.1rem'
          }}>
            Beautiful neumorphic components in React
          </p>
        </div>

        {/* Form Card */}
        <div ref={cardRef}>
          <h2 style={{ 
            color: isDark ? '#f7fafc' : '#333',
            marginBottom: '20px',
            fontWeight: 400 
          }}>
            Contact Form
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#333',
                fontWeight: 500
              }}>
                Email Address
              </label>
              <input
                ref={emailRef}
                type="email"
                value={formData.email}
                onChange={(e) => {
                  handleInputChange('email', e.target.value)
                  components.email?.setValue(e.target.value)
                }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#333',
                fontWeight: 500
              }}>
                Password
              </label>
              <input
                ref={passwordRef}
                type="password"
                value={formData.password}
                onChange={(e) => {
                  handleInputChange('password', e.target.value)
                  components.password?.setValue(e.target.value)
                }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Message Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                color: isDark ? '#f7fafc' : '#333',
                fontWeight: 500
              }}>
                Message
              </label>
              <textarea
                ref={messageRef}
                value={formData.message}
                onChange={(e) => {
                  handleInputChange('message', e.target.value)
                  components.message?.setValue(e.target.value)
                }}
                rows={4}
                style={{ width: '100%' }}
              />
            </div>

            {/* Newsletter Toggle */}
            <div style={{ 
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                ref={newsletterRef}
                type="checkbox"
                id="newsletter"
                checked={formData.newsletter}
                onChange={(e) => {
                  handleInputChange('newsletter', e.target.checked)
                  components.newsletter?.setChecked(e.target.checked)
                }}
              />
              <label 
                htmlFor="newsletter"
                style={{ 
                  color: isDark ? '#f7fafc' : '#333',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Subscribe to newsletter
              </label>
            </div>

            {/* Submit Button */}
            <button
              ref={submitRef}
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </form>
        </div>

        {/* Demo Section */}
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ 
            color: isDark ? '#f7fafc' : '#333',
            marginBottom: '20px',
            fontWeight: 400 
          }}>
            Component Demo
          </h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {/* Example cards with different variants */}
            <ComponentDemo title="Raised Card" variant="raised" isDark={isDark} />
            <ComponentDemo title="Inset Card" variant="inset" isDark={isDark} />
            <ComponentDemo title="Flat Card" variant="flat" isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo component for different card variants
const ComponentDemo: React.FC<{ 
  title: string
  variant: 'raised' | 'inset' | 'flat'
  isDark: boolean 
}> = ({ title, variant, isDark }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardRef.current) {
      const card = np.card(cardRef.current, { variant, size: 'md' })
      return () => card.destroy()
    }
  }, [variant])

  return (
    <div ref={cardRef}>
      <h3 style={{ 
        margin: '0 0 8px 0',
        fontSize: '1rem',
        color: isDark ? '#f7fafc' : '#333'
      }}>
        {title}
      </h3>
      <p style={{ 
        margin: 0,
        fontSize: '0.9rem',
        color: isDark ? '#cbd5e0' : '#666'
      }}>
        {variant.charAt(0).toUpperCase() + variant.slice(1)} styling
      </p>
    </div>
  )
}

export default App