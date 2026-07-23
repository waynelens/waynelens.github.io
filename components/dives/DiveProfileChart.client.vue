<script setup lang="ts">
import { LineChart, ScatterChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent
} from 'echarts/components'
import { init, use, type ECharts, type EChartsOption } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import type { DiveProfile, DiveProfileEvent } from '~/types/dive-profile'

use([
  LineChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
  SVGRenderer
])

type SiteLocale = 'en' | 'zh-TW'

const props = defineProps<{
  profile: DiveProfile
  locale: SiteLocale
}>()

const { t } = useI18n()
const chartElement = ref<HTMLDivElement>()
let chart: ECharts | undefined
let resizeObserver: ResizeObserver | undefined
let themeObserver: MutationObserver | undefined

const formatElapsed = (seconds: number) => {
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  const remainingSeconds = rounded % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const eventLabel = (event: DiveProfileEvent) => {
  if (event.label) return event.label[props.locale]
  return t(`divesPage.profileEvents.${event.type}`)
}

const readThemeColors = () => {
  const styles = getComputedStyle(document.documentElement)
  return {
    text: styles.getPropertyValue('--text').trim() || '#f5f5f5',
    muted: styles.getPropertyValue('--muted').trim() || '#999999',
    line: styles.getPropertyValue('--line').trim() || 'rgba(127,127,127,.3)',
    soft: styles.getPropertyValue('--bg-soft').trim() || 'rgba(127,127,127,.08)'
  }
}

const buildOption = (): EChartsOption => {
  const colors = readThemeColors()
  const samples = props.profile.samples
  const hasTemperature = samples.some(sample => sample.temperatureC !== undefined)
  const hasPressure = samples.some(sample => sample.tankPressureBar !== undefined)
  const hasSecondaryChart = hasTemperature || hasPressure
  const maxDepth = Math.max(...samples.map(sample => sample.depthM))
  const depthData = samples.map(sample => [sample.elapsedSec, sample.depthM])
  const secondaryTop = 316
  const safetyStart = props.profile.events.find(event => event.type === 'safety-stop-start')
  const safetyEnd = props.profile.events.find(event => event.type === 'safety-stop-end')
  const eventData = props.profile.events.map(event => [
    event.elapsedSec,
    event.depthM ?? samples.reduce((closest, sample) => (
      Math.abs(sample.elapsedSec - event.elapsedSec) < Math.abs(closest.elapsedSec - event.elapsedSec)
        ? sample
        : closest
    )).depthM,
    eventLabel(event)
  ])

  const xAxes: EChartsOption['xAxis'] = [
    {
      type: 'value',
      gridIndex: 0,
      min: 0,
      max: 'dataMax',
      axisLabel: {
        show: !hasSecondaryChart,
        color: colors.muted,
        formatter: (value: number) => formatElapsed(value)
      },
      axisLine: { lineStyle: { color: colors.line } },
      splitLine: { show: false }
    }
  ]

  const yAxes: EChartsOption['yAxis'] = [
    {
      type: 'value',
      gridIndex: 0,
      inverse: true,
      min: 0,
      max: Math.ceil((maxDepth + 2) / 5) * 5,
      name: t('divesPage.depthAxis'),
      nameTextStyle: { color: colors.muted },
      axisLabel: { color: colors.muted, formatter: '{value} m' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: colors.line } }
    }
  ]

  const series: NonNullable<EChartsOption['series']> = [
    {
      name: t('divesPage.depth'),
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: depthData,
      showSymbol: false,
      smooth: 0.22,
      sampling: 'lttb',
      lineStyle: { width: 2.5, color: '#3da7d8' },
      areaStyle: { color: 'rgba(61, 167, 216, 0.2)' },
      markLine: {
        silent: true,
        symbol: 'none',
        label: {
          color: colors.muted,
          position: 'insideEndTop',
          formatter: `${t('divesPage.maxDepth')} ${maxDepth.toFixed(1)} m`
        },
        lineStyle: { color: '#3da7d8', type: 'dashed', opacity: 0.65 },
        data: [{ yAxis: maxDepth }]
      },
      markArea: safetyStart && safetyEnd ? {
        silent: true,
        itemStyle: { color: 'rgba(67, 190, 143, 0.12)' },
        label: { color: colors.muted, formatter: t('divesPage.safetyStop') },
        data: [[{ xAxis: safetyStart.elapsedSec }, { xAxis: safetyEnd.elapsedSec }]]
      } : undefined
    },
    {
      name: t('divesPage.events'),
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: eventData,
      symbolSize: 8,
      itemStyle: { color: '#f2a65a', borderColor: colors.text, borderWidth: 1 },
      tooltip: {
        valueFormatter: (_value: unknown) => ''
      }
    }
  ]

  if (hasSecondaryChart) {
    xAxes.push({
      type: 'value',
      gridIndex: 1,
      min: 0,
      max: 'dataMax',
      axisLabel: { color: colors.muted, formatter: (value: number) => formatElapsed(value) },
      axisLine: { lineStyle: { color: colors.line } },
      splitLine: { show: false }
    })

    yAxes.push({
      type: 'value',
      gridIndex: 1,
      position: 'left',
      name: hasTemperature ? '°C' : '',
      nameTextStyle: { color: colors.muted },
      axisLabel: { color: colors.muted },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: colors.line } }
    })

    if (hasPressure) {
      yAxes.push({
        type: 'value',
        gridIndex: 1,
        position: 'right',
        name: 'bar',
        nameTextStyle: { color: colors.muted },
        axisLabel: { color: colors.muted },
        axisLine: { show: false },
        splitLine: { show: false }
      })
    }

    if (hasTemperature) {
      series.push({
        name: t('divesPage.temperatureCurve'),
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: samples
          .filter(sample => sample.temperatureC !== undefined)
          .map(sample => [sample.elapsedSec, sample.temperatureC]),
        showSymbol: false,
        smooth: 0.2,
        lineStyle: { width: 2, color: '#f2a65a' }
      })
    }

    if (hasPressure) {
      series.push({
        name: t('divesPage.pressureCurve'),
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: hasPressure ? 2 : 1,
        data: samples
          .filter(sample => sample.tankPressureBar !== undefined)
          .map(sample => [sample.elapsedSec, sample.tankPressureBar]),
        showSymbol: false,
        connectNulls: true,
        smooth: 0.12,
        lineStyle: { width: 2, color: '#7e8ce0' }
      })
    }
  }

  return {
    animationDuration: 500,
    backgroundColor: 'transparent',
    textStyle: { color: colors.text, fontFamily: 'Inter, Noto Sans TC, sans-serif' },
    grid: hasSecondaryChart
      ? [
          { left: 48, right: 20, top: 48, height: 210 },
          { left: 48, right: hasPressure ? 48 : 20, top: secondaryTop, height: 105 }
        ]
      : [{ left: 48, right: 20, top: 48, bottom: 48 }],
    legend: hasSecondaryChart ? {
      top: 278,
      left: 48,
      right: 48,
      itemGap: 12,
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { color: colors.muted, fontSize: 10 },
      data: [
        ...(hasTemperature ? [t('divesPage.temperatureCurve')] : []),
        ...(hasPressure ? [t('divesPage.pressureCurve')] : [])
      ]
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: colors.soft } },
      backgroundColor: colors.soft,
      borderColor: colors.line,
      textStyle: { color: colors.text },
      formatter: (rawParams: unknown) => {
        const params = Array.isArray(rawParams) ? rawParams : [rawParams]
        const validParams = params.filter((item): item is { axisValue: number, seriesName: string, value: unknown[] } => (
          Boolean(item && typeof item === 'object' && 'value' in item && Array.isArray((item as { value: unknown }).value))
        ))
        if (!validParams.length) return ''
        const lines = [`<strong>${formatElapsed(Number(validParams[0].axisValue))}</strong>`]
        for (const item of validParams) {
          if (item.seriesName === t('divesPage.events')) {
            if (item.value[2]) lines.push(String(item.value[2]))
            continue
          }
          const value = Number(item.value[1])
          if (!Number.isFinite(value)) continue
          const unit = item.seriesName === t('divesPage.depth')
            ? 'm'
            : item.seriesName === t('divesPage.pressureCurve') ? 'bar' : '°C'
          lines.push(`${item.seriesName}: ${value.toFixed(1)} ${unit}`)
        }
        return lines.join('<br>')
      }
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: hasSecondaryChart ? [0, 1] : [0], filterMode: 'none' }
    ],
    xAxis: xAxes,
    yAxis: yAxes,
    series
  }
}

const renderChart = () => {
  if (!chartElement.value || chartElement.value.clientWidth === 0 || chartElement.value.clientHeight === 0) return
  if (!chart) chart = init(chartElement.value, undefined, { renderer: 'svg' })
  chart.setOption(buildOption(), true)
}

const initializeChart = async () => {
  await nextTick()
  if (!chartElement.value) return
  renderChart()
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || entry.contentRect.width === 0 || entry.contentRect.height === 0) return
      if (chart) chart.resize()
      else renderChart()
    })
    resizeObserver.observe(chartElement.value)
  }
  if (!themeObserver) {
    themeObserver = new MutationObserver(renderChart)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
}

onMounted(() => {
  void initializeChart()
})

watch(chartElement, (element) => {
  if (element) void initializeChart()
}, { flush: 'post' })

watch(() => [props.profile, props.locale], () => {
  void nextTick(renderChart)
}, { deep: true })

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <section class="profile-chart-section" :aria-label="$t('divesPage.profileChart')">
    <header>
      <div>
        <h3>{{ $t('divesPage.profileChart') }}</h3>
        <p>{{ $t('divesPage.profileChartHint') }}</p>
      </div>
      <span class="profile-source">
        {{ $t(`divesPage.profileSources.${profile.source}`) }}
      </span>
    </header>
    <div
      ref="chartElement"
      class="profile-chart"
      role="img"
      :aria-label="$t('divesPage.profileChartAria')"
    />
  </section>
</template>

<style scoped>
.profile-chart-section {
  display: grid;
  gap: 14px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.profile-chart-section > header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.profile-chart-section h3,
.profile-chart-section p {
  margin: 0;
}

.profile-chart-section h3 {
  font-size: 0.78rem;
  font-weight: 560;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-chart-section p {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.74rem;
  line-height: 1.55;
}

.profile-source {
  padding: 0.32rem 0.58rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.66rem;
  white-space: nowrap;
}

.profile-chart {
  width: 100%;
  height: 450px;
  border-radius: 17px;
  background: color-mix(in srgb, var(--bg-soft) 62%, transparent);
}

@media (max-width: 640px) {
  .profile-chart {
    height: 430px;
  }
}
</style>
