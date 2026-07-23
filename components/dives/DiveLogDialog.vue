<script setup lang="ts">
import type { DiveProfile } from '~/types/dive-profile'

type SiteLocale = 'en' | 'zh-TW'
type LocalizedText = Record<SiteLocale, string>

type DiveLogDetail = {
  diveId: string
  profileId?: string
  date: string
  diveNumber: number
  title: LocalizedText
  summary: LocalizedText
  maxDepthM: number
  averageDepthM?: number
  durationMin: number
  startTime?: string
  surfaceIntervalMin?: number
  waterTemperatureC?: number
  visibilityM?: number
  gas: string
  tankStartBar?: number
  tankEndBar?: number
  entryType: 'shore' | 'boat'
  buddy?: string
  guide?: string
  conditions?: {
    weather?: LocalizedText
    current?: LocalizedText
    waves?: LocalizedText
  }
  equipment?: {
    suit?: LocalizedText
    weightKg?: number
    tank?: string
  }
  notes?: LocalizedText
  wildlife: LocalizedText[]
  photos: string[]
  isDemo: boolean
}

const props = defineProps<{
  open: boolean
  dive: DiveLogDetail
  siteName: string
  locale: SiteLocale
}>()

const { data: diveProfile } = await useAsyncData(
  `dive-profile-${props.dive.profileId || props.dive.diveId}`,
  async () => {
    if (!props.dive.profileId) return null
    return queryCollection('diveProfiles')
      .where('profileId', '=', props.dive.profileId)
      .first()
  }
)

const resolvedProfile = computed(() => diveProfile.value as DiveProfile | null | undefined)

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
const lightboxIndex = ref<number>()
let previousBodyOverflow = ''

const localized = (value?: LocalizedText) => value?.[props.locale]

const close = () => emit('close')

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialog.value) close()
}

const syncDialogState = async (isOpen: boolean) => {
  if (!import.meta.client) return
  await nextTick()

  if (isOpen) {
    if (!dialog.value?.open) {
      previousBodyOverflow = document.body.style.overflow
      dialog.value?.showModal()
    }
    document.body.style.overflow = 'hidden'
    closeButton.value?.focus()
    return
  }

  lightboxIndex.value = undefined
  if (dialog.value?.open) dialog.value.close()
  document.body.style.overflow = previousBodyOverflow
}

watch(() => props.open, syncDialogState)

onMounted(() => {
  void syncDialogState(props.open)
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <dialog
    ref="dialog"
    class="dive-log-dialog"
    aria-labelledby="dive-log-dialog-title"
    @cancel.prevent="close"
    @click="handleBackdropClick"
  >
    <article class="dive-log-detail">
      <header class="detail-header">
        <div>
          <p class="eyebrow">{{ siteName }}</p>
          <h2 id="dive-log-dialog-title">{{ dive.title[locale] }}</h2>
          <div class="detail-byline">
            <time :datetime="dive.date">{{ dive.date }}</time>
            <span>{{ $t('divesPage.diveNumber', { number: dive.diveNumber }) }}</span>
            <span>{{ dive.entryType === 'shore' ? $t('divesPage.shore') : $t('divesPage.boat') }}</span>
            <span v-if="dive.isDemo" class="demo-badge">{{ $t('divesPage.demo') }}</span>
          </div>
        </div>

        <button ref="closeButton" type="button" class="detail-close" @click="close">
          {{ $t('common.close') }}
        </button>
      </header>

      <p class="detail-summary">{{ dive.summary[locale] }}</p>

      <ClientOnly>
        <LazyDiveProfileChart
          v-if="resolvedProfile"
          :profile="resolvedProfile"
          :locale="locale"
        />
        <template #fallback>
          <div v-if="dive.profileId" class="profile-loading">
            {{ $t('divesPage.loadingProfile') }}
          </div>
        </template>
      </ClientOnly>

      <section class="detail-section" :aria-label="$t('divesPage.profile')">
        <h3>{{ $t('divesPage.profile') }}</h3>
        <dl class="detail-grid">
          <div v-if="dive.startTime">
            <dt>{{ $t('divesPage.startTime') }}</dt>
            <dd>{{ dive.startTime }}</dd>
          </div>
          <div>
            <dt>{{ $t('divesPage.duration') }}</dt>
            <dd>{{ dive.durationMin }} min</dd>
          </div>
          <div>
            <dt>{{ $t('divesPage.maxDepth') }}</dt>
            <dd>{{ dive.maxDepthM }} m</dd>
          </div>
          <div v-if="dive.averageDepthM !== undefined">
            <dt>{{ $t('divesPage.averageDepth') }}</dt>
            <dd>{{ dive.averageDepthM }} m</dd>
          </div>
          <div v-if="dive.surfaceIntervalMin !== undefined">
            <dt>{{ $t('divesPage.surfaceInterval') }}</dt>
            <dd>{{ dive.surfaceIntervalMin }} min</dd>
          </div>
          <div v-if="dive.waterTemperatureC !== undefined">
            <dt>{{ $t('divesPage.waterTemperature') }}</dt>
            <dd>{{ dive.waterTemperatureC }} °C</dd>
          </div>
          <div v-if="dive.visibilityM !== undefined">
            <dt>{{ $t('divesPage.visibility') }}</dt>
            <dd>{{ dive.visibilityM }} m</dd>
          </div>
          <div>
            <dt>{{ $t('divesPage.gas') }}</dt>
            <dd>{{ dive.gas }}</dd>
          </div>
          <div v-if="dive.tankStartBar !== undefined && dive.tankEndBar !== undefined">
            <dt>{{ $t('divesPage.tankPressure') }}</dt>
            <dd>{{ dive.tankStartBar }} → {{ dive.tankEndBar }} bar</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="dive.buddy || dive.guide || dive.equipment"
        class="detail-section"
        :aria-label="$t('divesPage.teamAndEquipment')"
      >
        <h3>{{ $t('divesPage.teamAndEquipment') }}</h3>
        <dl class="detail-grid">
          <div v-if="dive.buddy">
            <dt>{{ $t('divesPage.buddy') }}</dt>
            <dd>{{ dive.buddy }}</dd>
          </div>
          <div v-if="dive.guide">
            <dt>{{ $t('divesPage.guide') }}</dt>
            <dd>{{ dive.guide }}</dd>
          </div>
          <div v-if="dive.equipment?.tank">
            <dt>{{ $t('divesPage.tank') }}</dt>
            <dd>{{ dive.equipment.tank }}</dd>
          </div>
          <div v-if="dive.equipment?.suit">
            <dt>{{ $t('divesPage.suit') }}</dt>
            <dd>{{ localized(dive.equipment.suit) }}</dd>
          </div>
          <div v-if="dive.equipment?.weightKg !== undefined">
            <dt>{{ $t('divesPage.weight') }}</dt>
            <dd>{{ dive.equipment.weightKg }} kg</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="dive.conditions?.weather || dive.conditions?.current || dive.conditions?.waves"
        class="detail-section"
        :aria-label="$t('divesPage.conditions')"
      >
        <h3>{{ $t('divesPage.conditions') }}</h3>
        <dl class="detail-grid">
          <div v-if="dive.conditions.weather">
            <dt>{{ $t('divesPage.weather') }}</dt>
            <dd>{{ localized(dive.conditions.weather) }}</dd>
          </div>
          <div v-if="dive.conditions.current">
            <dt>{{ $t('divesPage.current') }}</dt>
            <dd>{{ localized(dive.conditions.current) }}</dd>
          </div>
          <div v-if="dive.conditions.waves">
            <dt>{{ $t('divesPage.waves') }}</dt>
            <dd>{{ localized(dive.conditions.waves) }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="dive.wildlife.length" class="detail-section">
        <h3>{{ $t('divesPage.wildlife') }}</h3>
        <ul class="wildlife-list">
          <li v-for="animal in dive.wildlife" :key="animal.en">{{ animal[locale] }}</li>
        </ul>
      </section>

      <section v-if="dive.notes" class="detail-section detail-notes">
        <h3>{{ $t('divesPage.notes') }}</h3>
        <p>{{ dive.notes[locale] }}</p>
      </section>

      <section v-if="dive.photos.length" class="detail-section">
        <h3>{{ $t('divesPage.photos') }}</h3>
        <div class="detail-photos">
          <button
            v-for="(photo, index) in dive.photos"
            :key="photo"
            type="button"
            @click="lightboxIndex = index"
          >
            <ResponsiveImage
              :src="photo"
              :alt="$t('divesPage.photoAlt', { number: index + 1 })"
              sizes="(max-width: 560px) 44vw, 240px"
              :default-width="384"
            />
          </button>
        </div>
      </section>
    </article>
  </dialog>

  <Lightbox
    v-if="lightboxIndex !== undefined"
    :open="true"
    :src="dive.photos[lightboxIndex] || ''"
    :index="lightboxIndex"
    @close="lightboxIndex = undefined"
  />
</template>

<style scoped>
.dive-log-dialog {
  width: min(820px, calc(100% - 28px));
  max-height: min(860px, calc(100dvh - 40px));
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 26px;
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  color: var(--text);
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(28px);
}

.dive-log-dialog::backdrop {
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(10px);
}

.dive-log-detail {
  display: grid;
  max-height: min(860px, calc(100dvh - 40px));
  gap: 24px;
  overflow-y: auto;
  padding: clamp(20px, 4vw, 34px);
}

.detail-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 24px;
}

.detail-header .eyebrow {
  margin: 0 0 8px;
}

.detail-header h2 {
  margin: 0;
  font-size: clamp(1.45rem, 3.6vw, 2.25rem);
  font-weight: 540;
  line-height: 1.2;
}

.detail-byline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 12px;
  margin-top: 12px;
  color: var(--muted);
  font-size: 0.75rem;
}

.demo-badge {
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  white-space: nowrap;
}

.detail-close {
  flex: 0 0 auto;
  padding: 0.52rem 0.72rem;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg-soft);
  color: var(--muted);
  cursor: pointer;
}

.detail-summary,
.detail-notes p {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.profile-loading {
  display: grid;
  min-height: 300px;
  place-items: center;
  border-top: 1px solid var(--line);
  border-radius: 17px;
  background: color-mix(in srgb, var(--bg-soft) 62%, transparent);
  color: var(--muted);
}

.detail-section {
  display: grid;
  gap: 13px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.detail-section h3 {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 560;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.detail-grid > div {
  display: grid;
  gap: 5px;
  padding: 13px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-soft) 76%, transparent);
}

.detail-grid dt {
  color: var(--muted);
  font-size: 0.68rem;
}

.detail-grid dd {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
}

.wildlife-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.wildlife-list li {
  padding: 0.48rem 0.72rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.78rem;
}

.detail-photos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.detail-photos button {
  aspect-ratio: 4 / 3;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 14px;
  background: var(--bg-soft);
  cursor: zoom-in;
}

.detail-photos img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .dive-log-dialog {
    width: calc(100% - 16px);
    max-height: calc(100dvh - 16px);
    border-radius: 22px;
  }

  .dive-log-detail {
    max-height: calc(100dvh - 16px);
    gap: 20px;
    padding: 20px 16px 28px;
  }

  .detail-header {
    gap: 12px;
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-photos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
