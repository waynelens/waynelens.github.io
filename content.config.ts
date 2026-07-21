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
        durationMin: z.number().int().positive(),
        waterTemperatureC: z.number().optional(),
        visibilityM: z.number().optional(),
        gas: z.string(),
        tankStartBar: z.number().int().positive().optional(),
        tankEndBar: z.number().int().nonnegative().optional(),
        entryType: z.enum(['shore', 'boat']),
        photos: z.array(z.string()).default([]),
        isDemo: z.boolean().default(false)
      })
    })
  }
})
