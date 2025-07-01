<template>
  <div 
    :class="['app', { 'dark': isDark }]"
    :style="{ 
      minHeight: '100vh',
      padding: '40px 20px',
      background: isDark 
        ? 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
        : 'linear-gradient(135deg, #f0f0f3 0%, #e8e8eb 100%)',
      transition: 'background 0.3s ease'
    }"
  >
    <!-- Theme Toggle -->
    <div style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
      <button 
        ref="themeToggleEl"
        @click="toggleTheme"
        style="background: none; border: none; cursor: pointer;"
      >
        {{ isDark ? '☀️ Light' : '🌙 Dark' }}
      </button>
    </div>

    <div style="max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 :style="{ 
          color: isDark ? '#f7fafc' : '#333',
          marginBottom: '10px',
          fontWeight: 300,
          fontSize: '2.5rem'
        }">
          Vue + Neumorphic Peripheral
        </h1>
        <p :style="{ 
          color: isDark ? '#cbd5e0' : '#666',
          fontSize: '1.1rem'
        }">
          Beautiful neumorphic components in Vue 3
        </p>
      </div>

      <!-- Form Card -->
      <div ref="cardEl">
        <h2 :style="{ 
          color: isDark ? '#f7fafc' : '#333',
          marginBottom: '20px',
          fontWeight: 400 
        }">
          Contact Form
        </h2>

        <form @submit.prevent="handleSubmit">
          <!-- Email Field -->
          <div style="margin-bottom: 20px;">
            <label :style="{ 
              display: 'block',
              marginBottom: '8px',
              color: isDark ? '#f7fafc' : '#333',
              fontWeight: 500
            }">
              Email Address
            </label>
            <input
              ref="emailEl"
              type="email"
              v-model="formData.email"
              style="width: 100%;"
            />
          </div>

          <!-- Password Field -->
          <div style="margin-bottom: 20px;">
            <label :style="{ 
              display: 'block',
              marginBottom: '8px',
              color: isDark ? '#f7fafc' : '#333',
              fontWeight: 500
            }">
              Password
            </label>
            <input
              ref="passwordEl"
              type="password"
              v-model="formData.password"
              style="width: 100%;"
            />
          </div>

          <!-- Message Field -->
          <div style="margin-bottom: 20px;">
            <label :style="{ 
              display: 'block',
              marginBottom: '8px',
              color: isDark ? '#f7fafc' : '#333',
              fontWeight: 500
            }">
              Message
            </label>
            <textarea
              ref="messageEl"
              v-model="formData.message"
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
              ref="newsletterEl"
              type="checkbox"
              id="newsletter"
              v-model="formData.newsletter"
            />
            <label 
              for="newsletter"
              :style="{ 
                color: isDark ? '#f7fafc' : '#333',
                fontWeight: 500,
                cursor: 'pointer'
              }"
            >
              Subscribe to newsletter
            </label>
          </div>

          <!-- Submit Button -->
          <button
            ref="submitEl"
            type="submit"
            :disabled="isSubmitting"
            style="width: 100%;"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit Form' }}
          </button>
        </form>
      </div>

      <!-- Demo Section -->
      <div style="margin-top: 40px;">
        <h2 :style="{ 
          color: isDark ? '#f7fafc' : '#333',
          marginBottom: '20px',
          fontWeight: 400 
        }">
          Component Demo
        </h2>
        
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        ">
          <ComponentDemo 
            v-for="variant in ['raised', 'inset', 'flat']"
            :key="variant"
            :title="`${variant.charAt(0).toUpperCase() + variant.slice(1)} Card`"
            :variant="variant"
            :is-dark="isDark"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import np from 'neumorphic-peripheral'
import 'neumorphic-peripheral/styles/neumorphic.css'

// Template refs
const cardEl = ref<HTMLDivElement>()
const emailEl = ref<HTMLInputElement>()
const passwordEl = ref<HTMLInputElement>()
const messageEl = ref<HTMLTextAreaElement>()
const newsletterEl = ref<HTMLInputElement>()
const submitEl = ref<HTMLButtonElement>()
const themeToggleEl = ref<HTMLButtonElement>()

// Reactive state
const isDark = ref(false)
const isSubmitting = ref(false)
const formData = reactive({
  email: '',
  password: '',
  message: '',
  newsletter: false
})

// Component instances
const components = reactive<{
  card?: any
  email?: any
  password?: any
  message?: any
  newsletter?: any
  submit?: any
  themeToggle?: any
}>({})

// Initialize neumorphic components
onMounted(() => {
  if (cardEl.value) {
    components.card = np.card(cardEl.value, {
      variant: 'raised',
      size: 'lg'
    })
  }

  if (emailEl.value) {
    components.email = np.input(emailEl.value, {
      validate: {
        required: true,
        email: true
      },
      validateOn: 'blur',
      placeholder: 'Enter your email'
    })
  }

  if (passwordEl.value) {
    components.password = np.password(passwordEl.value, {
      showToggle: true,
      strengthIndicator: true,
      validate: {
        required: true,
        minLength: 8
      },
      placeholder: 'Enter your password'
    })
  }

  if (messageEl.value) {
    components.message = np.textarea(messageEl.value, {
      autoResize: true,
      maxHeight: '150px',
      placeholder: 'Enter your message...',
      validate: {
        maxLength: 500
      }
    })
  }

  if (newsletterEl.value) {
    components.newsletter = np.toggle(newsletterEl.value, {
      type: 'switch',
      size: 'md',
      onChange: (checked: boolean) => {
        formData.newsletter = checked
      }
    })
  }

  if (submitEl.value) {
    components.submit = np.button(submitEl.value, {
      variant: 'primary',
      size: 'lg'
    })
  }

  if (themeToggleEl.value) {
    components.themeToggle = np.button(themeToggleEl.value, {
      variant: 'ghost',
      size: 'sm'
    })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  Object.values(components).forEach(component => {
    component?.destroy()
  })
})

// Watch form data changes and sync with components
watch(() => formData.email, (newValue) => {
  if (components.email && components.email.getValue() !== newValue) {
    components.email.setValue(newValue)
  }
})

watch(() => formData.password, (newValue) => {
  if (components.password && components.password.getValue() !== newValue) {
    components.password.setValue(newValue)
  }
})

watch(() => formData.message, (newValue) => {
  if (components.message && components.message.getValue() !== newValue) {
    components.message.setValue(newValue)
  }
})

watch(() => formData.newsletter, (newValue) => {
  if (components.newsletter && components.newsletter.isChecked() !== newValue) {
    components.newsletter.setChecked(newValue)
  }
})

// Handle form submission
const handleSubmit = async () => {
  // Validate all fields
  const emailValid = components.email?.validate()
  const passwordValid = components.password?.validate()
  const messageValid = components.message?.validate()

  if (!emailValid?.isValid || !passwordValid?.isValid || !messageValid?.isValid) {
    return
  }

  isSubmitting.value = true
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
    formData.email = ''
    formData.password = ''
    formData.message = ''
    formData.newsletter = false

    components.email?.setValue('')
    components.password?.setValue('')
    components.message?.setValue('')
    components.newsletter?.setChecked(false)

  } catch (error) {
    console.error('Submission error:', error)
    alert('Submission failed. Please try again.')
  } finally {
    isSubmitting.value = false
    components.submit?.setLoading(false)
  }
}

// Handle theme toggle
const toggleTheme = () => {
  isDark.value = !isDark.value
  np.setTheme(isDark.value ? 'dark' : 'light')
}
</script>

<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
</style>