import type { SearchLocale } from '~/utils/search'

type LocalizedSearchMetadata = Record<SearchLocale, string[]>

export const searchMetadata: Record<string, LocalizedSearchMetadata> = {
  'clare-first-dive-at-bitoujiao': {
    en: [
      'Bitoujiao',
      'northeast coast',
      'first ocean experience',
      'beginner snorkeling',
      'coral reef',
      'float buoy',
      'underwater photography'
    ],
    'zh-TW': [
      '鼻頭角',
      '東北角',
      '第一次下水',
      '初學者浮潛',
      '珊瑚礁',
      '浮標',
      '水下攝影'
    ]
  },
  'yuting-first-ocean-training-at-longdong': {
    en: [
      'Longdong',
      'first ocean training',
      'open water training',
      'freediving practice',
      'underwater photography',
      'Portuguese man of war',
      'northeast coast'
    ],
    'zh-TW': [
      '龍洞',
      '第一次海訓',
      '海洋訓練',
      '開放水域訓練',
      '自由潛水練習',
      '水下攝影',
      '僧帽水母',
      '東北角'
    ]
  }
}
