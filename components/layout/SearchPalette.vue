<script setup lang="ts">
import MiniSearch from 'minisearch'
import { searchMetadata } from '~/data/searchMetadata'
import {
  extractContentText,
  tokenizeSearchText,
  type SearchLocale
} from '~/utils/search'

type SearchDocument = {
  id: string
  path: string
  title: string
  description: string
  date: string
  tags: string
  content: string
  keywords: string
  lang: SearchLocale
}

type SearchHit = SearchDocument & {
  score: number
}

const { locale, t } = useI18n()
const route = useRoute()
const { isSearchOpen, closeSearch } = useSearchDialog()
const dialog = ref<HTMLDialogElement>()
const searchInput = ref<HTMLInputElement>()
const query = ref('')
const selectedIndex = ref(0)

const { data: posts } = await useAsyncData('site-search-posts', () => {
  return queryCollection('blog').all()
})

const currentLocale = computed(() => locale.value as SearchLocale)

const documents = computed<SearchDocument[]>(() => {
  return (posts.value || [])
    .filter(post => post.lang === currentLocale.value)
    .map((post) => ({
      id: post.path,
      path: post.path,
      title: post.title,
      description: post.description,
      date: post.date,
      tags: (post.tags || []).join(' '),
      content: extractContentText(post.body),
      keywords: (searchMetadata[post.translationKey]?.[currentLocale.value] || []).join(' '),
      lang: post.lang
    }))
})

const searchIndex = computed(() => {
  const index = new MiniSearch<SearchDocument>({
    fields: ['title', 'tags', 'keywords', 'description', 'content'],
    storeFields: ['path', 'title', 'description', 'date', 'tags', 'lang'],
    tokenize: text => tokenizeSearchText(text, currentLocale.value),
    searchOptions: {
      boost: {
        title: 10,
        tags: 6,
        keywords: 5,
        description: 3,
        content: 1
      },
      prefix: true,
      fuzzy: currentLocale.value === 'en' ? 0.2 : false,
      combineWith: 'AND'
    }
  })

  index.addAll(documents.value)
  return index
})

const normalizedQueryLength = computed(() => {
  return Array.from(query.value.trim()).filter(character => !/\s/u.test(character)).length
})

const canSearch = computed(() => normalizedQueryLength.value >= 2)

const results = computed<SearchHit[]>(() => {
  if (!canSearch.value) return []

  return searchIndex.value.search(query.value).slice(0, 8) as SearchHit[]
})

const resultSummary = computed(() => {
  return t('search.resultCount', { count: results.value.length })
})

const close = () => {
  closeSearch()
  query.value = ''
  selectedIndex.value = 0
}

const openResult = async (result: SearchHit) => {
  close()
  await navigateTo(result.path)
}

const handleInputKeydown = async (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (results.value.length) {
      selectedIndex.value = (selectedIndex.value + 1) % results.value.length
    }
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (results.value.length) {
      selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
    }
    return
  }

  if (event.key === 'Enter' && results.value[selectedIndex.value]) {
    event.preventDefault()
    await openResult(results.value[selectedIndex.value])
  }
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    isSearchOpen.value ? close() : (isSearchOpen.value = true)
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialog.value) close()
}

watch(isSearchOpen, async (isOpen) => {
  await nextTick()

  if (isOpen) {
    if (!dialog.value?.open) dialog.value?.showModal()
    searchInput.value?.focus()
    document.body.style.overflow = 'hidden'
    return
  }

  if (dialog.value?.open) dialog.value.close()
  document.body.style.overflow = ''
})

watch([query, results], () => {
  selectedIndex.value = 0
})

watch(() => route.path, close)

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <dialog
    ref="dialog"
    class="search-dialog"
    :aria-label="$t('search.title')"
    @cancel.prevent="close"
    @click="handleBackdropClick"
  >
    <section class="search-panel">
      <header class="search-header">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0a8 8 0 0 1 16 0Z" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          role="combobox"
          autocomplete="off"
          :placeholder="$t('search.placeholder')"
          :aria-label="$t('search.placeholder')"
          :aria-expanded="results.length > 0"
          aria-controls="site-search-results"
          @keydown="handleInputKeydown"
        >
        <button type="button" class="search-close" @click="close">
          {{ $t('common.close') }}
        </button>
      </header>

      <div class="search-content">
        <p v-if="!query.trim()" class="search-state">
          {{ $t('search.hint') }}
        </p>
        <p v-else-if="!canSearch" class="search-state">
          {{ $t('search.minimum') }}
        </p>
        <p v-else-if="!results.length" class="search-state">
          {{ $t('search.noResults') }}
        </p>

        <template v-else>
          <p class="search-summary">{{ resultSummary }}</p>
          <div id="site-search-results" class="search-results" role="listbox">
            <button
              v-for="(result, index) in results"
              :key="result.path"
              type="button"
              role="option"
              class="search-result"
              :class="{ 'is-selected': index === selectedIndex }"
              :aria-selected="index === selectedIndex"
              @mouseenter="selectedIndex = index"
              @click="openResult(result)"
            >
              <span class="search-result-meta">
                <span>{{ result.date }}</span>
                <span v-if="result.tags">{{ result.tags }}</span>
              </span>
              <strong>{{ result.title }}</strong>
              <span>{{ result.description }}</span>
            </button>
          </div>
        </template>
      </div>

      <footer class="search-footer">
        <span>↑↓ {{ $t('search.navigate') }}</span>
        <span>↵ {{ $t('search.openResult') }}</span>
        <span>Esc {{ $t('search.close') }}</span>
      </footer>
    </section>
  </dialog>
</template>

<style scoped>
.search-dialog {
  width: min(680px, calc(100% - 28px));
  max-height: min(720px, calc(100vh - 48px));
  margin: max(7vh, 32px) auto auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(28px);
}

.search-dialog::backdrop {
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(8px);
}

.search-panel {
  display: grid;
  max-height: min(720px, calc(100vh - 48px));
  grid-template-rows: auto minmax(120px, 1fr) auto;
}

.search-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid var(--line);
}

.search-header svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

.search-header input {
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-size: 1.04rem;
}

.search-header input::placeholder {
  color: var(--muted);
}

.search-close {
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--bg-soft);
  color: var(--muted);
  cursor: pointer;
  font-size: 0.74rem;
}

.search-content {
  min-height: 180px;
  overflow-y: auto;
  padding: 10px;
}

.search-state {
  display: grid;
  min-height: 150px;
  margin: 0;
  place-items: center;
  padding: 24px;
  color: var(--muted);
  text-align: center;
  line-height: 1.7;
}

.search-summary {
  margin: 6px 10px 10px;
  color: var(--muted);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-results {
  display: grid;
  gap: 6px;
}

.search-result {
  display: grid;
  gap: 7px;
  width: 100%;
  padding: 15px;
  border: 1px solid transparent;
  border-radius: 15px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.search-result.is-selected {
  border-color: var(--line);
  background: var(--bg-soft);
}

.search-result strong {
  font-size: 1rem;
  line-height: 1.35;
}

.search-result > span:last-child {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.search-result-meta {
  display: flex;
  gap: 10px;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.search-result-meta span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 18px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.7rem;
}

@media (max-width: 560px) {
  .search-dialog {
    width: calc(100% - 16px);
    max-height: calc(100vh - 24px);
    margin-top: 12px;
    border-radius: 20px;
  }

  .search-panel {
    max-height: calc(100vh - 24px);
  }

  .search-header {
    padding: 15px;
  }

  .search-footer {
    display: none;
  }
}
</style>
