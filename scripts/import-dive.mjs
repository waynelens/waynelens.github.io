import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Decoder, Stream, Utils } from '@garmin/fitsdk'
import { XMLParser } from 'fast-xml-parser'

const HELP = `
Import a FIT or UDDF dive log into the Waynelens content structure.

Usage:
  npm run import:dive -- <file.fit|file.uddf> --site-id <site-id> [options]

Options:
  --dive-number <number>      Dive number used in the generated YAML (default: 1)
  --dive-index <number>       Zero-based dive index inside a UDDF file (default: 0)
  --entry-type <shore|boat>   Entry type (default: shore)
  --gas <label>               Breathing gas label (default: Air)
  --date <YYYY-MM-DD>         Override the date when the source has no timestamp
  --timezone <IANA zone>      Timezone used for start time (default: Asia/Taipei)
  --sample-seconds <seconds>  Profile sampling interval (default: 5)
  --dry-run                   Parse and validate without writing files
  --force                     Replace existing generated files
  --help                      Show this help

The importer intentionally does not write GPS coordinates, device serials,
owner information, or other private FIT/UDDF metadata into the repository.
`

const parseArguments = (argv) => {
  const options = {
    diveNumber: 1,
    diveIndex: 0,
    entryType: 'shore',
    gas: 'Air',
    timezone: 'Asia/Taipei',
    sampleSeconds: 5,
    dryRun: false,
    force: false
  }

  let input
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('-') && !input) {
      input = argument
      continue
    }

    if (argument === '--help') options.help = true
    else if (argument === '--dry-run') options.dryRun = true
    else if (argument === '--force') options.force = true
    else {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`)
      index += 1
      if (argument === '--site-id') options.siteId = value
      else if (argument === '--dive-number') options.diveNumber = Number(value)
      else if (argument === '--dive-index') options.diveIndex = Number(value)
      else if (argument === '--entry-type') options.entryType = value
      else if (argument === '--gas') options.gas = value
      else if (argument === '--date') options.date = value
      else if (argument === '--timezone') options.timezone = value
      else if (argument === '--sample-seconds') options.sampleSeconds = Number(value)
      else throw new Error(`Unknown option: ${argument}`)
    }
  }

  if (options.help) return { ...options, input }
  if (!input) throw new Error('Provide a .fit, .uddf, or .xml file.')
  if (!options.siteId) throw new Error('Provide --site-id so the generated dive can reference a dive site.')
  if (!Number.isInteger(options.diveNumber) || options.diveNumber < 1) {
    throw new Error('--dive-number must be a positive integer.')
  }
  if (!Number.isInteger(options.diveIndex) || options.diveIndex < 0) {
    throw new Error('--dive-index must be a non-negative integer.')
  }
  if (!['shore', 'boat'].includes(options.entryType)) {
    throw new Error('--entry-type must be shore or boat.')
  }
  if (!Number.isFinite(options.sampleSeconds) || options.sampleSeconds <= 0) {
    throw new Error('--sample-seconds must be greater than zero.')
  }
  if (options.date && !/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new Error('--date must use YYYY-MM-DD.')
  }

  return { ...options, input }
}

const round = (value, digits = 1) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const numeric = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

const timestampMs = (value) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  if (typeof value === 'number') {
    if (value > 1_000_000_000_000) return value
    if (value > 1_000_000_000) return value * 1000
    try {
      return Utils.convertDateTimeToDate(value).getTime()
    } catch {
      return undefined
    }
  }
  return undefined
}

const nearestDepth = (samples, elapsedSec) => samples.reduce((closest, sample) => (
  Math.abs(sample.elapsedSec - elapsedSec) < Math.abs(closest.elapsedSec - elapsedSec)
    ? sample
    : closest
)).depthM

const normalizeTemperature = (value) => {
  const parsed = numeric(value)
  if (parsed === undefined) return undefined
  return round(parsed > 100 ? parsed - 273.15 : parsed, 1)
}

const normalizePressure = (value) => {
  const parsed = numeric(value)
  if (parsed === undefined || parsed < 0) return undefined
  return round(parsed > 10_000 ? parsed / 100_000 : parsed, 1)
}

const parseDurationSeconds = (value) => {
  const parsed = numeric(value)
  if (parsed !== undefined) return parsed
  if (typeof value !== 'string') return undefined
  const match = value.match(/^P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?$/i)
  if (!match) return undefined
  return (
    Number(match[1] || 0) * 86400
    + Number(match[2] || 0) * 3600
    + Number(match[3] || 0) * 60
    + Number(match[4] || 0)
  )
}

const normalizeProfile = (rawSamples, intervalSec) => {
  const sorted = rawSamples
    .filter(sample => Number.isFinite(sample.elapsedSec) && Number.isFinite(sample.depthM))
    .map(sample => ({
      ...sample,
      elapsedSec: Math.max(0, round(sample.elapsedSec, 1)),
      depthM: Math.max(0, round(sample.depthM, 2))
    }))
    .sort((first, second) => first.elapsedSec - second.elapsedSec)

  if (sorted.length < 2) throw new Error('The source does not contain at least two depth/time samples.')

  const firstTime = sorted[0].elapsedSec
  const rebased = sorted.map(sample => ({
    ...sample,
    elapsedSec: round(sample.elapsedSec - firstTime, 1)
  }))

  const sampled = [rebased[0]]
  let nextBoundary = intervalSec
  for (let index = 1; index < rebased.length - 1; index += 1) {
    const sample = rebased[index]
    if (sample.elapsedSec < nextBoundary) continue
    sampled.push(sample)
    nextBoundary = sample.elapsedSec + intervalSec
  }
  const last = rebased[rebased.length - 1]
  if (sampled[sampled.length - 1].elapsedSec !== last.elapsedSec) sampled.push(last)

  return sampled
}

const calculateAverageDepth = (samples) => {
  let area = 0
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]
    const current = samples[index]
    area += ((previous.depthM + current.depthM) / 2) * (current.elapsedSec - previous.elapsedSec)
  }
  const duration = samples[samples.length - 1].elapsedSec - samples[0].elapsedSec
  return duration > 0 ? round(area / duration, 1) : 0
}

const addMaxDepthEvent = (samples, events) => {
  if (events.some(event => event.type === 'max-depth')) return events
  const deepest = samples.reduce((maximum, sample) => (
    sample.depthM > maximum.depthM ? sample : maximum
  ))
  return [
    ...events,
    { elapsedSec: deepest.elapsedSec, depthM: deepest.depthM, type: 'max-depth' }
  ].sort((first, second) => first.elapsedSec - second.elapsedSec)
}

const mapFitEvent = (message) => {
  if (message.event === 'diveGasSwitched') return 'gas-switch'
  if (message.event !== 'diveAlert') return undefined
  if (message.diveAlert === 'safetyStopStarted') return 'safety-stop-start'
  if (message.diveAlert === 'safetyStopComplete') return 'safety-stop-end'
  if (message.diveAlert === 'ascentCritical') return 'rapid-ascent'
  if (['decoCeilingBroken', 'approachingFirstDecoStop'].includes(message.diveAlert)) return 'deco'
  return 'custom'
}

const parseFit = (buffer, sampleSeconds) => {
  const stream = Stream.fromBuffer(buffer)
  if (!Decoder.isFIT(stream)) throw new Error('The selected file is not a valid FIT file.')
  const decoder = new Decoder(stream)
  const { messages, errors } = decoder.read()
  if (errors?.length) {
    console.warn(`FIT decoder reported ${errors.length} warning(s); usable records will still be imported.`)
  }

  const records = messages.recordMesgs || []
  const timedRecords = records
    .map(record => ({ record, time: timestampMs(record.timestamp) }))
    .filter(item => item.time !== undefined && numeric(item.record.depth) !== undefined)
    .sort((first, second) => first.time - second.time)
  if (timedRecords.length < 2) throw new Error('No dive depth records were found in this FIT file.')

  const startMs = timedRecords[0].time
  const tankUpdates = (messages.tankUpdateMesgs || [])
    .map(update => ({ time: timestampMs(update.timestamp), pressure: numeric(update.pressure) }))
    .filter(update => update.time !== undefined && update.pressure !== undefined)
    .sort((first, second) => first.time - second.time)

  let tankIndex = 0
  let latestTankPressure
  const rawSamples = timedRecords.map(({ record, time }) => {
    while (tankUpdates[tankIndex] && tankUpdates[tankIndex].time <= time) {
      latestTankPressure = tankUpdates[tankIndex].pressure
      tankIndex += 1
    }
    return {
      elapsedSec: (time - startMs) / 1000,
      depthM: numeric(record.depth),
      temperatureC: normalizeTemperature(record.temperature),
      tankPressureBar: latestTankPressure === undefined ? undefined : round(latestTankPressure, 1),
      ndlSec: numeric(record.ndlTime),
      ceilingM: numeric(record.nextStopDepth)
    }
  })

  const samples = normalizeProfile(rawSamples, sampleSeconds)
  const events = (messages.eventMesgs || [])
    .map((message) => {
      const type = mapFitEvent(message)
      const time = timestampMs(message.timestamp)
      if (!type || time === undefined) return undefined
      const elapsedSec = Math.max(0, round((time - startMs) / 1000, 1))
      return {
        elapsedSec,
        depthM: nearestDepth(samples, elapsedSec),
        type,
        label: type === 'custom' && message.diveAlert
          ? { en: String(message.diveAlert), 'zh-TW': String(message.diveAlert) }
          : undefined
      }
    })
    .filter(Boolean)

  const summary = (messages.diveSummaryMesgs || [])[0]
  return {
    source: 'fit',
    recordedAt: new Date(startMs).toISOString(),
    samples,
    events: addMaxDepthEvent(samples, events),
    sourceSummary: {
      maxDepthM: numeric(summary?.maxDepth),
      averageDepthM: numeric(summary?.avgDepth),
      surfaceIntervalSec: numeric(summary?.surfaceInterval),
      diveNumber: numeric(summary?.diveNumber)
    }
  }
}

const localName = key => key.split(':').pop()

const findAll = (node, target, matches = []) => {
  if (!node || typeof node !== 'object') return matches
  if (Array.isArray(node)) {
    for (const item of node) findAll(item, target, matches)
    return matches
  }
  for (const [key, value] of Object.entries(node)) {
    if (localName(key) === target) {
      if (Array.isArray(value)) matches.push(...value)
      else matches.push(value)
    }
    findAll(value, target, matches)
  }
  return matches
}

const field = (node, name) => {
  if (!node || typeof node !== 'object') return undefined
  const entry = Object.entries(node).find(([key]) => localName(key) === name)
  if (!entry) return undefined
  const value = entry[1]
  if (value && typeof value === 'object' && '#text' in value) return value['#text']
  return value
}

const parseUddf = (text, sampleSeconds, diveIndex) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
    isArray: tagName => ['dive', 'waypoint', 'alarm'].includes(localName(tagName))
  })
  const document = parser.parse(text)
  const dives = findAll(document, 'dive')
  const dive = dives[diveIndex]
  if (!dive) throw new Error(`UDDF dive index ${diveIndex} does not exist; found ${dives.length} dive(s).`)

  const waypoints = findAll(dive, 'waypoint')
  const rawSamples = []
  const rawEvents = []
  for (const waypoint of waypoints) {
    const elapsedSec = parseDurationSeconds(field(waypoint, 'divetime'))
    const depthM = numeric(field(waypoint, 'depth'))
    if (elapsedSec === undefined || depthM === undefined) continue
    rawSamples.push({
      elapsedSec,
      depthM,
      temperatureC: normalizeTemperature(field(waypoint, 'temperature')),
      tankPressureBar: normalizePressure(field(waypoint, 'tankpressure'))
    })

    const alarms = findAll(waypoint, 'alarm')
    for (const alarm of alarms) {
      const label = String(alarm?.['#text'] ?? alarm)
      rawEvents.push({
        elapsedSec,
        depthM,
        type: /ascent/i.test(label) ? 'rapid-ascent' : 'custom',
        label: { en: label, 'zh-TW': label }
      })
    }
    if (field(waypoint, 'switchmix') !== undefined) {
      rawEvents.push({ elapsedSec, depthM, type: 'gas-switch' })
    }
  }

  const samples = normalizeProfile(rawSamples, sampleSeconds)
  const datetime = findAll(dive, 'datetime')
    .map(value => value?.['#text'] ?? value)
    .find(value => timestampMs(value) !== undefined)
  const startMs = timestampMs(datetime)

  return {
    source: 'uddf',
    recordedAt: startMs === undefined ? undefined : new Date(startMs).toISOString(),
    samples,
    events: addMaxDepthEvent(samples, rawEvents),
    sourceSummary: {}
  }
}

const inferSampleInterval = (samples) => {
  const differences = samples
    .slice(1)
    .map((sample, index) => sample.elapsedSec - samples[index].elapsedSec)
    .filter(value => value > 0)
    .sort((first, second) => first - second)
  return differences.length ? round(differences[Math.floor(differences.length / 2)], 1) : undefined
}

const formatDate = (recordedAt, override, timezone) => {
  if (override) return override
  if (!recordedAt) throw new Error('The source has no dive date; provide --date YYYY-MM-DD.')
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(new Date(recordedAt))
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

const formatStartTime = (recordedAt, timezone) => {
  if (!recordedAt) return undefined
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(recordedAt))
}

const quoteYaml = value => JSON.stringify(String(value))

const buildDiveYaml = ({ diveId, profileId, date, options, summary }) => {
  const lines = [
    `diveId: ${diveId}`,
    `profileId: ${profileId}`,
    `siteId: ${options.siteId}`,
    `date: ${date}`,
    `diveNumber: ${summary.diveNumber}`,
    'title:',
    `  zh-TW: ${quoteYaml(`${date} — 待補潛水紀錄`)}`,
    `  en: ${quoteYaml(`${date} — Imported Dive Log`)}`,
    'summary:',
    `  zh-TW: ${quoteYaml('由手錶紀錄匯入；發佈前請補上潛水摘要並核對所有數值。')}`,
    `  en: ${quoteYaml('Imported from a dive computer; review all values and add a summary before publishing.')}`,
    `maxDepthM: ${summary.maxDepthM}`,
    `averageDepthM: ${summary.averageDepthM}`,
    `durationMin: ${summary.durationMin}`
  ]
  if (summary.startTime) lines.push(`startTime: ${quoteYaml(summary.startTime)}`)
  if (summary.surfaceIntervalMin !== undefined) lines.push(`surfaceIntervalMin: ${summary.surfaceIntervalMin}`)
  if (summary.waterTemperatureC !== undefined) lines.push(`waterTemperatureC: ${summary.waterTemperatureC}`)
  lines.push(`gas: ${quoteYaml(options.gas)}`)
  if (summary.tankStartBar !== undefined) lines.push(`tankStartBar: ${summary.tankStartBar}`)
  if (summary.tankEndBar !== undefined) lines.push(`tankEndBar: ${summary.tankEndBar}`)
  lines.push(
    `entryType: ${options.entryType}`,
    'notes:',
    `  zh-TW: ${quoteYaml('匯入資料草稿；請補上潛水筆記。')}`,
    `  en: ${quoteYaml('Imported draft; add dive notes before publishing.')}`,
    'wildlife: []',
    'photos: []',
    'isDemo: false',
    ''
  )
  return lines.join('\n')
}

const assertWritablePaths = (filenames, force) => {
  if (force) return
  const existing = filenames.filter(filename => fs.existsSync(filename))
  if (existing.length) {
    throw new Error(`${existing.join(', ')} already exists. Use --force only after reviewing the existing files.`)
  }
}

const writeFile = (filename, content) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(filename, content, 'utf8')
}

const main = () => {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    console.log(HELP.trim())
    return
  }

  const inputPath = path.resolve(options.input)
  if (!fs.existsSync(inputPath)) throw new Error(`File not found: ${inputPath}`)
  const extension = path.extname(inputPath).toLowerCase()
  const imported = extension === '.fit'
    ? parseFit(fs.readFileSync(inputPath), options.sampleSeconds)
    : ['.uddf', '.xml'].includes(extension)
      ? parseUddf(fs.readFileSync(inputPath, 'utf8'), options.sampleSeconds, options.diveIndex)
      : undefined
  if (!imported) throw new Error('Supported file extensions are .fit, .uddf, and .xml.')

  const date = formatDate(imported.recordedAt, options.date, options.timezone)
  const suffix = String(options.diveNumber).padStart(2, '0')
  const diveId = `${options.siteId}-${date}-${suffix}`
  const profileId = `${diveId}-profile`
  const samples = imported.samples
  const durationSec = samples[samples.length - 1].elapsedSec
  const temperatures = samples.map(sample => sample.temperatureC).filter(value => value !== undefined)
  const pressures = samples.map(sample => sample.tankPressureBar).filter(value => value !== undefined)
  const summary = {
    diveNumber: options.diveNumber,
    maxDepthM: round(imported.sourceSummary.maxDepthM ?? Math.max(...samples.map(sample => sample.depthM)), 1),
    averageDepthM: round(imported.sourceSummary.averageDepthM ?? calculateAverageDepth(samples), 1),
    durationMin: Math.max(1, Math.ceil(durationSec / 60)),
    startTime: formatStartTime(imported.recordedAt, options.timezone),
    surfaceIntervalMin: imported.sourceSummary.surfaceIntervalSec === undefined
      ? undefined
      : Math.round(imported.sourceSummary.surfaceIntervalSec / 60),
    waterTemperatureC: temperatures.length ? round(Math.min(...temperatures), 1) : undefined,
    tankStartBar: pressures.length ? round(pressures[0], 0) : undefined,
    tankEndBar: pressures.length ? round(pressures[pressures.length - 1], 0) : undefined
  }
  const profile = {
    profileId,
    diveId,
    source: imported.source,
    ...(imported.recordedAt ? { recordedAt: imported.recordedAt } : {}),
    sampleIntervalSec: inferSampleInterval(samples),
    samples,
    events: imported.events
  }
  const yaml = buildDiveYaml({ diveId, profileId, date, options, summary })

  if (options.dryRun) {
    console.log(JSON.stringify({ summary, profile }, null, 2))
    return
  }

  const basename = `${date}-${options.siteId}-${suffix}`
  const profilePath = path.resolve('content', 'dive-profiles', `${basename}.json`)
  const divePath = path.resolve('content', 'dives', `${basename}.yml`)
  assertWritablePaths([profilePath, divePath], options.force)
  writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`)
  writeFile(divePath, yaml)
  console.log(`Created ${path.relative(process.cwd(), divePath)}`)
  console.log(`Created ${path.relative(process.cwd(), profilePath)}`)
  console.log(`Imported ${samples.length} samples and ${profile.events.length} events.`)
  console.log('Review the generated bilingual title, summary, notes, site, gas, and entry type before publishing.')
}

try {
  main()
} catch (error) {
  console.error(`Dive import failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
