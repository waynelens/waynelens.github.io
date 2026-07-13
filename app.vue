<script setup lang="ts">
const { localeProperties } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: localeProperties.value.language || localeProperties.value.code
  }
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
