<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import np from 'neumorphic-peripheral'

  export let title: string
  export let variant: 'raised' | 'inset' | 'flat'
  export let isDark: boolean

  let cardEl: HTMLDivElement
  let cardInstance: any = null

  onMount(() => {
    if (cardEl) {
      cardInstance = np.card(cardEl, { variant, size: 'md' })
    }
  })

  onDestroy(() => {
    cardInstance?.destroy()
  })

  $: textColor = isDark ? '#f7fafc' : '#333'
  $: secondaryTextColor = isDark ? '#cbd5e0' : '#666'
</script>

<div bind:this={cardEl}>
  <h3 style="
    margin: 0 0 8px 0;
    font-size: 1rem;
    color: {textColor};
  ">
    {title}
  </h3>
  <p style="
    margin: 0;
    font-size: 0.9rem;
    color: {secondaryTextColor};
  ">
    {variant.charAt(0).toUpperCase() + variant.slice(1)} styling
  </p>
</div>