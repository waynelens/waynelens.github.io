<script setup lang="ts">
defineProps<{
  title: string
  description: string
  action: string
  icon: 'cloud' | 'git'
}>()
</script>

<template>
  <article class="integration-card">
    <div class="integration-card__icon" aria-hidden="true">
      <svg v-if="icon === 'cloud'" viewBox="0 0 24 24">
        <path d="M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.2 8.3A4.8 4.8 0 0 0 7 18Z" />
      </svg>
      <svg v-else viewBox="0 0 24 24">
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="8" cy="19" r="2" />
        <path d="M6 7v3a4 4 0 0 0 4 4h3a5 5 0 0 0 5-5M8 17v-3" />
      </svg>
    </div>
    <div>
      <div class="integration-card__heading">
        <h3>{{ title }}</h3>
        <span>Planned</span>
      </div>
      <p>{{ description }}</p>
      <button type="button" disabled>{{ action }}</button>
    </div>
  </article>
</template>

<style scoped>
.integration-card {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg-elevated);
}
.integration-card__icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: var(--bg-soft);
}
.integration-card__icon svg {
  width: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}
.integration-card__heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.integration-card h3 { margin: 0; font-size: 0.96rem; }
.integration-card__heading span {
  padding: 3px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.65rem;
  text-transform: uppercase;
}
.integration-card p { margin: 7px 0 12px; color: var(--muted); font-size: 0.8rem; line-height: 1.5; }
.integration-card button {
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: transparent;
  color: var(--muted);
  cursor: not-allowed;
}
</style>
