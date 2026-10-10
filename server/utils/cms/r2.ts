import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { createHash } from 'node:crypto'
import type {
  CmsR2ConnectionStatus,
  CmsR2UploadedImage
} from '../../../shared/types/cms'

const REQUIRED_ENVIRONMENT_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL'
] as const

type R2Configuration = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
}

type SupportedImage = {
  extension: 'avif' | 'gif' | 'jpg' | 'png' | 'webp'
  contentType: string
}

export const R2_UPLOAD_LIMITS = {
  files: 20,
  bytesPerFile: 50 * 1024 * 1024,
  totalBytes: 250 * 1024 * 1024
} as const

export const readR2Configuration = (): R2Configuration | { missing: string[] } => {
  const values = Object.fromEntries(REQUIRED_ENVIRONMENT_KEYS.map(key => [key, process.env[key]?.trim() || '']))
  const missing = REQUIRED_ENVIRONMENT_KEYS.filter(key => !values[key])

  if (missing.length) return { missing: [...missing] }

  return {
    accountId: values.R2_ACCOUNT_ID!,
    accessKeyId: values.R2_ACCESS_KEY_ID!,
    secretAccessKey: values.R2_SECRET_ACCESS_KEY!,
    bucket: values.R2_BUCKET!,
    publicBaseUrl: values.R2_PUBLIC_BASE_URL!.replace(/\/$/u, '')
  }
}

const createR2Client = (configuration: R2Configuration) => new S3Client({
  region: 'auto',
  endpoint: `https://${configuration.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: configuration.accessKeyId,
    secretAccessKey: configuration.secretAccessKey
  }
})

const detectImage = (data: Buffer): SupportedImage | undefined => {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { extension: 'jpg', contentType: 'image/jpeg' }
  }
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: 'png', contentType: 'image/png' }
  }
  if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    return { extension: 'webp', contentType: 'image/webp' }
  }
  if (data.length >= 6 && ['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6))) {
    return { extension: 'gif', contentType: 'image/gif' }
  }
  if (data.length >= 12 && data.toString('ascii', 4, 8) === 'ftyp') {
    const brand = data.toString('ascii', 8, 12)
    if (brand === 'avif' || brand === 'avis') return { extension: 'avif', contentType: 'image/avif' }
  }
}

const safeStem = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/u, '')
  const normalized = withoutExtension
    .normalize('NFKC')
    .replace(/\s+/gu, '-')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-{2,}/gu, '-')
    .replace(/^[-_.]+|[-_.]+$/gu, '')
  return (normalized || 'image').slice(0, 80)
}

const safeFolder = (translationKey?: string) => {
  if (!translationKey) return 'uploads'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(translationKey)) return 'uploads'
  return `articles/${translationKey}`
}

const publicObjectUrl = (baseUrl: string, key: string) => (
  `${baseUrl}/${key.split('/').map(segment => encodeURIComponent(segment)).join('/')}`
)

const isMissingObjectError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const value = error as { name?: string, $metadata?: { httpStatusCode?: number } }
  return value.name === 'NotFound' || value.name === 'NoSuchKey' || value.$metadata?.httpStatusCode === 404
}

export const validateR2Image = (input: { data: Buffer, fileName: string }) => {
  if (!input.data.length) throw new Error(`${input.fileName} 是空白檔案。`)
  if (input.data.length > R2_UPLOAD_LIMITS.bytesPerFile) {
    throw new Error(`${input.fileName} 超過 50 MB 上限。`)
  }

  const image = detectImage(input.data)
  if (!image) throw new Error(`${input.fileName} 不是支援的圖片格式。`)
  return image
}

const safeConnectionError = (error: unknown) => {
  const name = error instanceof Error ? error.name : 'UnknownError'
  const messages: Record<string, string> = {
    AccessDenied: 'R2 拒絕存取，請確認 Token 權限與 bucket 範圍。',
    CredentialsProviderError: '無法讀取 R2 憑證。',
    InvalidAccessKeyId: 'R2 Access Key ID 無效。',
    NoSuchBucket: '找不到設定的 R2 bucket。',
    SignatureDoesNotMatch: 'R2 Secret Access Key 或簽章設定不正確。'
  }

  return messages[name] || `R2 連線失敗（${name}）。`
}

export const inspectR2Connection = async (): Promise<CmsR2ConnectionStatus> => {
  const configuration = readR2Configuration()
  if ('missing' in configuration) {
    return {
      configured: false,
      connected: false,
      missing: configuration.missing
    }
  }

  let publicBaseUrl: URL
  try {
    publicBaseUrl = new URL(configuration.publicBaseUrl)
    if (publicBaseUrl.protocol !== 'https:') throw new Error('Invalid protocol')
  } catch {
    return {
      configured: false,
      connected: false,
      bucket: configuration.bucket,
      error: 'R2_PUBLIC_BASE_URL 必須是有效的 HTTPS 網址。'
    }
  }

  const client = createR2Client(configuration)

  try {
    await client.send(new ListObjectsV2Command({
      Bucket: configuration.bucket,
      MaxKeys: 1
    }))

    return {
      configured: true,
      connected: true,
      bucket: configuration.bucket,
      publicBaseUrl: publicBaseUrl.toString().replace(/\/$/u, '')
    }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      bucket: configuration.bucket,
      publicBaseUrl: publicBaseUrl.toString().replace(/\/$/u, ''),
      error: safeConnectionError(error)
    }
  } finally {
    client.destroy()
  }
}

export const uploadR2Image = async (input: {
  data: Buffer
  fileName: string
  translationKey?: string
}): Promise<CmsR2UploadedImage> => {
  const configuration = readR2Configuration()
  if ('missing' in configuration) {
    throw new Error(`R2 尚未設定完成：${configuration.missing.join(', ')}`)
  }

  const image = validateR2Image(input)

  const digest = createHash('sha256').update(input.data).digest('hex')
  const folder = safeFolder(input.translationKey)
  const stem = safeStem(input.fileName)
  let key = `${folder}/${stem}-${digest.slice(0, 16)}.${image.extension}`
  const client = createR2Client(configuration)
  let reused = false

  try {
    try {
      const existing = await client.send(new HeadObjectCommand({
        Bucket: configuration.bucket,
        Key: key
      }))
      if (existing.Metadata?.sha256 === digest) {
        reused = true
      } else {
        key = `${folder}/${stem}-${digest}.${image.extension}`
      }
    } catch (error) {
      if (!isMissingObjectError(error)) throw error
    }

    if (!reused) {
      await client.send(new PutObjectCommand({
        Bucket: configuration.bucket,
        Key: key,
        Body: input.data,
        ContentLength: input.data.length,
        ContentType: image.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { sha256: digest }
      }))
    }

    return {
      originalName: input.fileName,
      key,
      url: publicObjectUrl(configuration.publicBaseUrl, key),
      size: input.data.length,
      contentType: image.contentType,
      sha256: digest,
      reused
    }
  } catch (error) {
    throw new Error(safeConnectionError(error))
  } finally {
    client.destroy()
  }
}
