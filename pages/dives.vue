<script setup lang="ts">
import type { DiveMapSite } from '~/components/dives/DiveMap.vue'

type SiteLocale = 'en' | 'zh-TW'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()

const { data: siteRecords } = await useAsyncData('dive-sites', () => {
  return queryCollection('diveSites').all()
})

const { data: diveRecords } = await useAsyncData('dive-logs', () => {
  return queryCollection('dives').order('date', 'DESC').all()
})

const currentLocale = computed(() => locale.value as SiteLocale)
const selectedYear = ref('all')
const selectedRegion = ref('all')
const selectedSiteId = ref(typeof route.query.site === 'string' ? route.query.site : '')
const selectedDiveId = computed(() => (
  typeof route.query.dive === 'string' ? route.query.dive : ''
))

const localizedSites = computed(() => (siteRecords.value || []).map((site) => {
  const dives = (diveRecords.value || []).filter(dive => dive.siteId === site.siteId)

  return {
    ...site,
    name: site.name[currentLocale.value],
    regionLabel: site.region[currentLocale.value],
    descriptionLabel: site.description[currentLocale.value],
    dives
  }
}))

const years = computed(() => {
  return [...new Set((diveRecords.value || []).map(dive => dive.date.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a))
})

const regions = computed(() => {
  return [...new Set(localizedSites.value.map(site => site.regionLabel))]
    .sort((a, b) => a.localeCompare(b, currentLocale.value))
})

const filteredSites = computed(() => {
  return localizedSites.value
    .filter(site => selectedRegion.value === 'all' || site.regionLabel === selectedRegion.value)
    .map(site => ({
      ...site,
      visibleDives: site.dives.filter((dive) => (
        selectedYear.value === 'all' || dive.date.startsWith(selectedYear.value)
      ))
    }))
    .filter(site => site.visibleDives.length > 0)
})

const mapSites = computed<DiveMapSite[]>(() => filteredSites.value.map(site => ({
  siteId: site.siteId,
  name: site.name,
  latitude: site.coordinates.latitude,
  longitude: site.coordinates.longitude,
  diveCount: site.visibleDives.length
})))

const selectedSite = computed(() => {
  return filteredSites.value.find(site => site.siteId === selectedSiteId.value)
    || filteredSites.value[0]
})

const selectedDive = computed(() => {
  if (!selectedDiveId.value) return undefined
  return (diveRecords.value || []).find(dive => dive.diveId === selectedDiveId.value)
})

const selectedDiveSite = computed(() => {
  if (!selectedDive.value) return undefined
  return localizedSites.value.find(site => site.siteId === selectedDive.value?.siteId)
})

const statistics = computed(() => {
  const dives = diveRecords.value || []
  const deepest = dives.reduce((maximum, dive) => Math.max(maximum, dive.maxDepthM), 0)
  const totalMinutes = dives.reduce((total, dive) => total + dive.durationMin, 0)

  return {
    dives: dives.length,
    sites: new Set(dives.map(dive => dive.siteId)).size,
    deepest,
    totalMinutes
  }
})

const selectSite = async (siteId: string) => {
  selectedSiteId.value = siteId
  const { dive: _dive, ...query } = route.query
  await router.replace({
    query: {
      ...query,
      site: siteId
    }
  })
}

const openDive = async (diveId: string, siteId: string) => {
  await router.push({
    query: {
      ...route.query,
      site: siteId,
      dive: diveId
    }
  })
}

const closeDive = async () => {
  const { dive: _dive, ...query } = route.query
  await router.replace({ query })
}

watch(filteredSites, (sites) => {
  if (!sites.length) {
    selectedSiteId.value = ''
    return
  }
  if (!sites.some(site => site.siteId === selectedSiteId.value)) {
    selectedSiteId.value = sites[0].siteId
  }
}, { immediate: true })

watch(() => route.query.site, (siteId) => {
  if (typeof siteId === 'string') selectedSiteId.value = siteId
})

watch(selectedDive, (dive) => {
  if (!dive) return
  selectedYear.value = 'all'
  selectedRegion.value = 'all'
  selectedSiteId.value = dive.siteId
}, { immediate: true })

useSeoMeta({
  title: () => t('divesPage.metaTitle'),
  description: () => t('divesPage.metaDescription')
})
</script>

<template>
  <section class="dives-page" :aria-label="$t('divesPage.aria')">
    <header class="dives-page-head">
      <p class="eyebrow">{{ $t('divesPage.eyebrow') }}</p>
      <h1 class="section-title">{{ $t('divesPage.title') }}</h1>
      <p>{{ $t('divesPage.description') }}</p>
    </header>

    <div class="dive-stats" :aria-label="$t('divesPage.statistics')">
      <article>
        <strong>{{ statistics.dives }}</strong>
        <span>{{ $t('divesPage.totalDives') }}</span>
      </article>
      <article>
        <strong>{{ statistics.sites }}</strong>
        <span>{{ $t('divesPage.totalSites') }}</span>
      </article>
      <article>
        <strong>{{ statistics.deepest.toFixed(1) }} m</strong>
        <span>{{ $t('divesPage.deepestDive') }}</span>
      </article>
      <article>
        <strong>{{ statistics.totalMinutes }} min</strong>
        <span>{{ $t('divesPage.totalTime') }}</span>
      </article>
    </div>

    <div class="dive-filters" :aria-label="$t('divesPage.filters')">
      <label>
        <span>{{ $t('divesPage.year') }}</span>
        <select v-model="selectedYear">
          <option value="all">{{ $t('divesPage.allYears') }}</option>
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
      </label>

      <label>
        <span>{{ $t('divesPage.region') }}</span>
        <select v-model="selectedRegion">
          <option value="all">{{ $t('divesPage.allRegions') }}</option>
          <option v-for="region in regions" :key="region" :value="region">{{ region }}</option>
        </select>
      </label>
    </div>

    <div v-if="filteredSites.length" class="dives-layout">
      <ClientOnly>
        <DiveMap
          :sites="mapSites"
          :selected-site-id="selectedSite?.siteId"
          :aria-label="$t('divesPage.mapLabel')"
          @select="selectSite"
        />
        <template #fallback>
          <div class="dive-map-fallback">{{ $t('divesPage.loadingMap') }}</div>
        </template>
      </ClientOnly>

      <aside class="dive-panel glass-panel">
        <nav class="dive-site-list" :aria-label="$t('divesPage.siteList')">
          <button
            v-for="site in filteredSites"
            :key="site.siteId"
            type="button"
            :class="{ 'is-active': site.siteId === selectedSite?.siteId }"
            @click="selectSite(site.siteId)"
          >
            <span>
              <strong>{{ site.name }}</strong>
              <small>{{ site.regionLabel }}</small>
            </span>
            <span>{{ $t('divesPage.diveCount', { count: site.visibleDives.length }) }}</span>
          </button>
        </nav>

        <section v-if="selectedSite" class="dive-site-detail">
          <header>
            <div>
              <p class="eyebrow">{{ $t('divesPage.selectedSite') }}</p>
              <h2>{{ selectedSite.name }}</h2>
            </div>
            <span v-if="selectedSite.isDemo" class="demo-badge">{{ $t('divesPage.demo') }}</span>
          </header>

          <p>{{ selectedSite.descriptionLabel }}</p>

          <div class="site-meta">
            <span>{{ selectedSite.entryType === 'shore' ? $t('divesPage.shore') : $t('divesPage.boat') }}</span>
            <span v-if="selectedSite.precision === 'approximate'">{{ $t('divesPage.approximate') }}</span>
          </div>

          <article
            v-for="dive in selectedSite.visibleDives"
            :key="dive.diveId"
            class="dive-log-card"
          >
            <header>
              <h3>{{ dive.title[currentLocale] }}</h3>
              <span v-if="dive.isDemo" class="demo-badge">{{ $t('divesPage.demo') }}</span>
            </header>
            <p>{{ dive.summary[currentLocale] }}</p>

            <dl>
              <div>
                <dt>{{ $t('divesPage.maxDepth') }}</dt>
                <dd>{{ dive.maxDepthM }} m</dd>
              </div>
              <div>
                <dt>{{ $t('divesPage.duration') }}</dt>
                <dd>{{ dive.durationMin }} min</dd>
              </div>
            </dl>

            <span class="dive-log-action" aria-hidden="true">
              {{ $t('divesPage.viewDetails') }} <span>→</span>
            </span>
            <button
              type="button"
              class="dive-log-trigger"
              :aria-label="$t('divesPage.openDetails', { title: dive.title[currentLocale] })"
              @click="openDive(dive.diveId, dive.siteId)"
            />
          </article>
        </section>
      </aside>
    </div>

    <p v-else class="dives-empty">{{ $t('divesPage.noResults') }}</p>

    <DiveLogDialog
      v-if="selectedDive && selectedDiveSite"
      :open="true"
      :dive="selectedDive"
      :site-name="selectedDiveSite.name"
      :locale="currentLocale"
      @close="closeDive"
    />
  </section>
</template>

<style scoped>
.dives-page {
  display: grid;
  gap: clamp(24px, 4vw, 40px);
}

.dives-page-head {
  display: grid;
  max-width: 760px;
  gap: 12px;
}

.dives-page-head p {
  margin: 0;
}

.dives-page-head > p:last-child {
  color: var(--muted);
  line-height: 1.75;
}

.dives-page-head h1 {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 4.8rem);
  font-weight: 520;
  line-height: 1;
}

.dive-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.dive-stats article {
  display: grid;
  gap: 5px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg-soft);
}

.dive-stats strong {
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  font-weight: 560;
}

.dive-stats span {
  color: var(--muted);
  font-size: 0.78rem;
}

.dive-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.dive-filters label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dive-filters select {
  min-width: 180px;
  padding: 0.72rem 2.2rem 0.72rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--bg-elevated);
  color: var(--text);
  font: inherit;
  font-size: 0.86rem;
  letter-spacing: normal;
  text-transform: none;
}

.dives-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr);
  gap: 18px;
  align-items: start;
}

.dive-map-fallback {
  display: grid;
  min-height: 620px;
  place-items: center;
  border-radius: 24px;
  background: var(--bg-soft);
  color: var(--muted);
}

.dive-panel {
  display: grid;
  max-height: 620px;
  gap: 18px;
  overflow-y: auto;
  padding: 16px;
  border-radius: 24px;
}

.dive-site-list {
  display: grid;
  gap: 8px;
}

.dive-site-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 13px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.dive-site-list button.is-active {
  border-color: var(--line);
  background: var(--bg-soft);
}

.dive-site-list button > span:first-child {
  display: grid;
  gap: 4px;
}

.dive-site-list small,
.dive-site-list button > span:last-child {
  color: var(--muted);
  font-size: 0.72rem;
}

.dive-site-detail {
  display: grid;
  gap: 15px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.dive-site-detail > header,
.dive-log-card > header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.dive-site-detail h2,
.dive-log-card h3,
.dive-site-detail p {
  margin: 0;
}

.dive-site-detail h2 {
  margin-top: 5px;
  font-size: 1.45rem;
}

.dive-site-detail > p,
.dive-log-card p {
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.65;
}

.site-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.site-meta span,
.demo-badge {
  padding: 0.32rem 0.58rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.66rem;
  white-space: nowrap;
}

.dive-log-card {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: color-mix(in srgb, var(--bg-soft) 72%, transparent);
  cursor: pointer;
  transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;
}

.dive-log-card:hover {
  border-color: color-mix(in srgb, var(--text) 28%, var(--line));
  background: color-mix(in srgb, var(--bg-soft) 92%, transparent);
  transform: translateY(-1px);
}

.dive-log-card:has(.dive-log-trigger:focus-visible) {
  outline: 2px solid var(--text);
  outline-offset: 3px;
}

.dive-log-card h3 {
  font-size: 1rem;
  line-height: 1.4;
}

.dive-log-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.dive-log-card dl div {
  display: grid;
  gap: 3px;
}

.dive-log-card dt {
  color: var(--muted);
  font-size: 0.68rem;
}

.dive-log-card dd {
  margin: 0;
  font-size: 0.84rem;
}

.dive-log-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  color: var(--muted);
  font-size: 0.72rem;
}

.dive-log-action span {
  font-size: 1rem;
  transition: transform 180ms ease;
}

.dive-log-card:hover .dive-log-action span {
  transform: translateX(3px);
}

.dive-log-trigger {
  position: absolute;
  inset: 0;
  border: 0;
  border-radius: inherit;
  background: transparent;
  cursor: pointer;
}

.dives-empty {
  margin: 0;
  padding: 36px;
  border: 1px solid var(--line);
  border-radius: 20px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 920px) {
  .dive-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dives-layout {
    grid-template-columns: 1fr;
  }

  .dive-map-fallback {
    min-height: min(58vh, 520px);
  }

  .dive-panel {
    max-height: none;
  }
}

@media (max-width: 560px) {
  .dives-page-head h1 {
    font-size: 2.2rem;
  }

  .dive-stats article {
    padding: 14px;
  }

  .dive-filters,
  .dive-filters label,
  .dive-filters select {
    width: 100%;
  }

  .dive-map-fallback {
    min-height: 52vh;
    border-radius: 18px;
  }

  .dive-panel {
    padding: 13px;
    border-radius: 20px;
  }
}
</style>
