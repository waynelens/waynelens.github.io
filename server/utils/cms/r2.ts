import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

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

export type R2ConnectionStatus = {
  configured: boolean
  connected: boolean
  bucket?: string
  publicBaseUrl?: string
  error?: string
  missing?: string[]
}

const readR2Configuration = (): R2Configuration | { missing: string[] } => {
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

export const inspectR2Connection = async (): Promise<R2ConnectionStatus> => {
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

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${configuration.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey
    }
  })

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
