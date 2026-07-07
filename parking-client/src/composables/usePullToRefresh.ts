import { ref, watch, type Ref } from 'vue'

export function usePullToRefresh(
  containerRef: Ref<HTMLElement | null>,
  onRefresh: () => Promise<void>
) {
  const refreshing = ref(false)
  const pullDistance = ref(0)
  const threshold = 60

  let startY = 0
  let pulling = false
  let currentEl: HTMLElement | null = null

  function onTouchStart(e: TouchEvent) {
    const el = currentEl
    if (!el || refreshing.value) return
    if (el.scrollTop <= 0) {
      startY = e.touches[0].clientY
      pulling = true
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!pulling || refreshing.value) return
    const delta = e.touches[0].clientY - startY
    if (delta > 0) {
      pullDistance.value = Math.min(delta * 0.4, 120)
    }
  }

  async function onTouchEnd() {
    if (!pulling) return
    pulling = false
    if (pullDistance.value >= threshold) {
      refreshing.value = true
      pullDistance.value = 0
      try {
        await onRefresh()
      } finally {
        refreshing.value = false
      }
    } else {
      pullDistance.value = 0
    }
  }

  function attach(el: HTMLElement) {
    detach()
    currentEl = el
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
  }

  function detach() {
    if (currentEl) {
      currentEl.removeEventListener('touchstart', onTouchStart)
      currentEl.removeEventListener('touchmove', onTouchMove)
      currentEl.removeEventListener('touchend', onTouchEnd)
      currentEl = null
    }
    pulling = false
    pullDistance.value = 0
  }

  watch(containerRef, (el) => {
    if (el) attach(el)
    else detach()
  }, { immediate: true })

  return { refreshing, pullDistance }
}
