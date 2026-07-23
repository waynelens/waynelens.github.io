import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        lang: z.enum(['en', 'zh-TW']),
        translationKey: z.string(),
        title: z.string(),
        description: z.string(),
        date: z.string(),
        tags: z.array(z.string()).default([]),
        cover: z.string().optional(),
        images: z.array(z.string()).default([])
      })
    }),
    diveSites: defineCollection({
      type: 'data',
      source: 'dive-sites/**/*.yml',
      schema: z.object({
        siteId: z.string(),
        name: z.object({
          en: z.string(),
          'zh-TW': z.string()
        }),
        region: z.object({
          en: z.string(),
          'zh-TW': z.string()
        }),
        description: z.object({
          en: z.string(),
          'zh-TW': z.string()
        }),
        coordinates: z.object({
          latitude: z.number(),
          longitude: z.number()
        }),
        precision: z.enum(['exact', 'approximate']),
        entryType: z.enum(['shore', 'boat']),
        isDemo: z.boolean().default(false)
      })
    }),
    dives: defineCollection({
      type: 'data',
      source: 'dives/**/*.yml',
      schema: z.object({
        diveId: z.string(),
        profileId: z.string().optional(),
        siteId: z.string(),
        date: z.string(),
        diveNumber: z.number().int().positive(),
        title: z.object({
          en: z.string(),
          'zh-TW': z.string()
        }),
        summary: z.object({
          en: z.string(),
          'zh-TW': z.string()
        }),
        maxDepthM: z.number().nonnegative(),
        averageDepthM: z.number().nonnegative().optional(),
        durationMin: z.number().int().positive(),
        startTime: z.string().optional(),
        surfaceIntervalMin: z.number().int().nonnegative().optional(),
        waterTemperatureC: z.number().optional(),
        visibilityM: z.number().optional(),
        gas: z.string(),
        tankStartBar: z.number().int().positive().optional(),
        tankEndBar: z.number().int().nonnegative().optional(),
        entryType: z.enum(['shore', 'boat']),
        buddy: z.string().optional(),
        guide: z.string().optional(),
        conditions: z.object({
          weather: z.object({
            en: z.string(),
            'zh-TW': z.string()
          }).optional(),
          current: z.object({
            en: z.string(),
            'zh-TW': z.string()
          }).optional(),
          waves: z.object({
            en: z.string(),
            'zh-TW': z.string()
          }).optional()
        }).optional(),
        equipment: z.object({
          suit: z.object({
            en: z.string(),
            'zh-TW': z.string()
          }).optional(),
          weightKg: z.number().nonnegative().optional(),
          tank: z.string().optional()
        }).optional(),
        notes: z.object({
          en: z.string(),
          'zh-TW': z.string()
        }).optional(),
        wildlife: z.array(z.object({
          en: z.string(),
          'zh-TW': z.string()
        })).default([]),
        photos: z.array(z.string()).default([]),
        isDemo: z.boolean().default(false)
      })
    }),
    diveProfiles: defineCollection({
      type: 'data',
      source: 'dive-profiles/**/*.json',
      schema: z.object({
        profileId: z.string(),
        diveId: z.string(),
        source: z.enum(['demo', 'fit', 'uddf']),
        recordedAt: z.string().optional(),
        sampleIntervalSec: z.number().positive().optional(),
        samples: z.array(z.object({
          elapsedSec: z.number().nonnegative(),
          depthM: z.number().nonnegative(),
          temperatureC: z.number().optional(),
          tankPressureBar: z.number().nonnegative().optional(),
          ndlSec: z.number().nonnegative().optional(),
          ceilingM: z.number().nonnegative().optional()
        })).min(2),
        events: z.array(z.object({
          elapsedSec: z.number().nonnegative(),
          depthM: z.number().nonnegative().optional(),
          type: z.enum([
            'max-depth',
            'safety-stop-start',
            'safety-stop-end',
            'rapid-ascent',
            'gas-switch',
            'deco',
            'custom'
          ]),
          label: z.object({
            en: z.string(),
            'zh-TW': z.string()
          }).optional()
        })).default([])
      })
    })
  }
})
