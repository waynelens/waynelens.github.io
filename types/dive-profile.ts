export type DiveProfileSource = 'demo' | 'fit' | 'uddf'

export type DiveProfileSample = {
  elapsedSec: number
  depthM: number
  temperatureC?: number
  tankPressureBar?: number
  ndlSec?: number
  ceilingM?: number
}

export type DiveProfileEventType =
  | 'max-depth'
  | 'safety-stop-start'
  | 'safety-stop-end'
  | 'rapid-ascent'
  | 'gas-switch'
  | 'deco'
  | 'custom'

export type DiveProfileEvent = {
  elapsedSec: number
  depthM?: number
  type: DiveProfileEventType
  label?: {
    en: string
    'zh-TW': string
  }
}

export type DiveProfile = {
  profileId: string
  diveId: string
  source: DiveProfileSource
  recordedAt?: string
  sampleIntervalSec?: number
  samples: DiveProfileSample[]
  events: DiveProfileEvent[]
}
