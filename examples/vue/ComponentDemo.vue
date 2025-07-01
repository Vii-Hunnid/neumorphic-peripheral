<template>
  <div ref="cardEl">
    <h3 :style="{ 
      margin: '0 0 8px 0',
      fontSize: '1rem',
      color: isDark ? '#f7fafc' : '#333'
    }">
      {{ title }}
    </h3>
    <p :style="{ 
      margin: 0,
      fontSize: '0.9rem',
      color: isDark ? '#cbd5e0' : '#666'
    }">
      {{ variant.charAt(0).toUpperCase() + variant.slice(1) }} styling
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import np from 'neumorphic-peripheral'

interface Props {
  title: string
  variant: 'raised' | 'inset' | 'flat'
  isDark: boolean
}

const props = defineProps<Props>()
const cardEl = ref<HTMLDivElement>()
let cardInstance: any = null

onMounted(() => {
  if (cardEl.value) {
    cardInstance = np.card(cardEl.value, { 
      variant: props.variant, 
      size: 'md' 
    })
  }
})

onUnmounted(() => {
  cardInstance?.destroy()
})
</script>