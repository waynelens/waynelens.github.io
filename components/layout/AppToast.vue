<script setup lang="ts">
const { toast } = useSiteToast()
</script>

<template>
  <Teleport to="body">
    <div
      class="toast-region"
      aria-live="polite"
      aria-atomic="true"
    >
      <Transition name="site-toast" mode="out-in">
        <p v-if="toast.visible" :key="toast.id" class="site-toast" role="status">
          {{ toast.message }}
        </p>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-region {
  position: fixed;
  z-index: 100;
  top: calc(env(safe-area-inset-top, 0px) + 84px);
  left: 50%;
  width: min(420px, calc(100% - 32px));
  pointer-events: none;
  transform: translateX(-50%);
}

.site-toast {
  margin: 0;
  padding: 13px 18px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  box-shadow: var(--shadow);
  color: var(--text);
  font-size: 0.88rem;
  line-height: 1.45;
  text-align: center;
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
}

.site-toast-enter-active,
.site-toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.site-toast-enter-from,
.site-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (max-width: 560px) {
  .toast-region {
    top: calc(env(safe-area-inset-top, 0px) + 72px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-toast-enter-active,
  .site-toast-leave-active {
    transition: none;
  }
}
</style>
