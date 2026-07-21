import type { SearchLocale } from '~/utils/search'

type LocalizedSearchMetadata = Record<SearchLocale, string[]>

export const searchMetadata: Record<string, LocalizedSearchMetadata> = {
  'clare-first-dive-at-bitoujiao': {
    en: [
      '2024-09-01',
      'September 1 2024',
      'Bitoujiao',
      'northeast coast',
      'first ocean experience',
      'beginner snorkeling',
      'coral reef',
      'float buoy',
      'underwater photography'
    ],
    'zh-TW': [
      '2024-09-01',
      '2024年9月1日',
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
      '2026-07-05',
      'July 5 2026',
      'Longdong',
      'first ocean training',
      'open water training',
      'freediving practice',
      'underwater photography',
      'Portuguese man of war',
      'northeast coast'
    ],
    'zh-TW': [
      '2026-07-05',
      '2026年7月5日',
      '龍洞',
      '第一次海訓',
      '海洋訓練',
      '開放水域訓練',
      '自由潛水練習',
      '水下攝影',
      '僧帽水母',
      '東北角'
    ]
  },
  'longdong-demo-2026-07-20-01': {
    en: [
      'Longdong',
      'Northeast Coast',
      'scuba diving',
      'shore dive',
      'dive log',
      '2026-07-20',
      'demo dive'
    ],
    'zh-TW': [
      '龍洞',
      '東北角',
      '水肺潛水',
      '岸潛',
      '潛水紀錄',
      '2026-07-20',
      '示範潛水'
    ]
  }
}
