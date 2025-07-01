<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import np from 'neumorphic-peripheral'
  import 'neumorphic-peripheral/styles/neumorphic.css'
  import ComponentDemo from './ComponentDemo.svelte'

  // Element references
  let cardEl: HTMLDivElement
  let emailEl: HTMLInputElement
  let passwordEl: HTMLInputElement
  let messageEl: HTMLTextAreaElement
  let newsletterEl: HTMLInputElement
  let submitEl: HTMLButtonElement
  let themeToggleEl: HTMLButtonElement

  // Component state
  let formData = {
    email: '',
    password: '',
    message: '',
    newsletter: false
  }
  let isDark = false
  let isSubmitting = false

  // Component instances
  let components: {
    card?: any
    email?: any
    password?: any
    message?: any
    newsletter?: any
    submit?: any
    themeToggle?: any
  } = {}

  // Initialize neumorphic components
  onMount(() => {
    if (cardEl) {
      components.card = np.card(cardEl, {
        variant: 'raised',
        size: 'lg'
      })
    }

    if (emailEl) {
      components.email = np.input(emailEl, {
        validate: {
          required: true,
          email: true
        },
        validateOn: 'blur',
        placeholder: 'Enter your email'
      })
    }

    if (passwordEl) {
      components.password = np.password(passwordEl, {
        showToggle: true,
        strengthIndicator: true,
        validate: {
          required: true,
          minLength: 8
        },
        placeholder: 'Enter your password'
      })
    }

    if (messageEl) {
      components.message = np.textarea(messageEl, {
        autoResize: true,
        maxHeight: '150px',
        placeholder: 'Enter your message...',
        validate: {
          maxLength: 500
        }
      })
    }

    if (newsletterEl) {
      components.newsletter = np.toggle(newsletterEl, {
        type: 'switch',
        size: 'md',
        onChange: (checked: boolean) => {
          formData.newsletter = checked
        }
      })
    }

    if (submitEl) {
      components.submit = np.button(submitEl, {
        variant: 'primary',
        size: 'lg'
      })
    }

    if (themeToggleEl) {
      components.themeToggle = np.button(themeToggleEl, {
        variant: 'ghost',
        size: 'sm'
      })
    }
  })

  // Cleanup on destroy
  onDestroy(() => {
    Object.values(components).forEach(component => {
      component?.destroy()
    })
  })

  // Reactive statements for syncing form data with components
  $: if (components.email && components.email.getValue() !== formData.email) {
    components.email.setValue(formData.email)
  }

  $: if (components.password && components.password.getValue() !== formData.password) {
    components.password.setValue(formData.password)
  }

  $: if (components.message && components.message.getValue() !== formData.message) {
    components.message.setValue(formData.message)
  }

  $: if (components.newsletter && components.newsletter.isChecked() !== formData.newsletter) {
    components.newsletter.setChecked(formData.newsletter)
  }

  // Handle form submission
  async function handleSubmit(e: Event) {
    e.preventDefault()
    
    // Validate all fields
    const emailValid = components.email?.validate()
    const passwordValid = components.password?.validate()
    const messageValid = components.message?.validate()

    if (!emailValid?.isValid || !passwordValid?.isValid || !messageValid?.isValid) {
      return
    }

    isSubmitting = true
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
      formData = {
        email: '',
        password: '',
        message: '',
        newsletter: false
      }

      components.email?.setValue('')
      components.password?.setValue('')
      components.message?.setValue('')
      components.newsletter?.setChecked(false)

    } catch (error) {
      console.error('Submission error:', error)
      alert('Submission failed. Please try again.')
    } finally {
      isSubmitting = false
      components.submit?.setLoading(false)
    }
  }

  // Handle theme toggle
  function toggleTheme() {
    isDark = !isDark
    np.setTheme(isDark ? 'dark' : 'light')
  }

  // Reactive styles
  $: appStyle = `
    min-height: 100vh;
    padding: 40px 20px;
    background: ${isDark 
      ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
      : 'linear-gradient(135deg, #f0f0f3 0%, #e8e8eb 100%)'};
    transition: background 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `

  $: textColor = isDark ? '#f7fafc' : '#333'
  $: secondaryTextColor = isDark ? '#cbd5e0' : '#666'
</script>

<div style={appStyle}>
  <!-- Theme Toggle -->
  <div style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
    <button 
      bind:this={themeToggleEl}
      on:click={toggleTheme}
      style="background: none; border: none; cursor: pointer;"
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  </div>

  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="
        color: {textColor};
        margin-bottom: 10px;
        font-weight: 300;
        font-size: 2.5rem;
      ">
        Svelte + Neumorphic Peripheral
      </h1>
      <p style="
        color: {secondaryTextColor};
        font-size: 1.1rem;
      ">
        Beautiful neumorphic components in Svelte
      </p>
    </div>

    <!-- Form Card -->
    <div bind:this={cardEl}>
      <h2 style="
        color: {textColor};
        margin-bottom: 20px;
        font-weight: 400;
      ">
        Contact Form
      </h2>

      <form on:submit={handleSubmit}>
        <!-- Email Field -->
        <div style="margin-bottom: 20px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: {textColor};
            font-weight: 500;
          ">
            Email Address
          </label>
          <input
            bind:this={emailEl}
            type="email"
            bind:value={formData.email}
            style="width: 100%;"
          />
        </div>

        <!-- Password Field -->
        <div style="margin-bottom: 20px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: {textColor};
            font-weight: 500;
          ">
            Password
          </label>
          <input
            bind:this={passwordEl}
            type="password"
            bind:value={formData.password}
            style="width: 100%;"
          />
        </div>

        <!-- Message Field -->
        <div style="margin-bottom: 20px;">
          <label style="
            display: block;
            margin-bottom: 8px;
            color: {textColor};
            font-weight: 500;
          ">
            Message
          </label>
          <textarea
            bind:this={messageEl}
            bind:value={formData.message}
            rows="4"
            style="width: 100%;"
          />
        </div>

        <!-- Newsletter Toggle -->
        <div style="
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <input
            bind:this={newsletterEl}
            type="checkbox"
            id="newsletter"
            bind:checked={formData.newsletter}
          />
          <label 
            for="newsletter"
            style="
              color: {textColor};
              font-weight: 500;
              cursor: pointer;
            "
          >
            Subscribe to newsletter
          </label>
        </div>

        <!-- Submit Button -->
        <button
          bind:this={submitEl}
          type="submit"
          disabled={isSubmitting}
          style="width: 100%;"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </button>
      </form>
    </div>

    <!-- Demo Section -->
    <div style="margin-top: 40px;">
      <h2 style="
        color: {textColor};
        margin-bottom: 20px;
        font-weight: 400;
      ">
        Component Demo
      </h2>
      
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      ">
        <ComponentDemo 
          title="Raised Card"
          variant="raised"
          {isDark}
        />
        <ComponentDemo 
          title="Inset Card"
          variant="inset"
          {isDark}
        />
        <ComponentDemo 
          title="Flat Card"
          variant="flat"
          {isDark}
        />
      </div>
    </div>
  </div>
</div>