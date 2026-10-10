import {
  createError,
  defineEventHandler,
  readMultipartFormData
} from 'h3'
import type { CmsR2UploadResult } from '../../../../shared/types/cms'
import { assertLocalCmsRequest } from '../../../utils/cms/security'
import {
  R2_UPLOAD_LIMITS,
  uploadR2Image,
  validateR2Image
} from '../../../utils/cms/r2'

export default defineEventHandler(async (event): Promise<CmsR2UploadResult> => {
  assertLocalCmsRequest(event, true)

  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, message: '請使用 multipart/form-data 上傳圖片。' })
  }

  const translationKeyPart = parts.find(part => part.name === 'translationKey' && !part.filename)
  const translationKey = translationKeyPart?.data.toString('utf8').trim() || undefined
  if (translationKey && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(translationKey)) {
    throw createError({ statusCode: 400, message: 'translationKey 格式不正確。' })
  }

  const files = parts.filter(part => part.name === 'files' && part.filename)
  if (!files.length) {
    throw createError({ statusCode: 400, message: '至少選擇一張圖片。' })
  }
  if (files.length > R2_UPLOAD_LIMITS.files) {
    throw createError({ statusCode: 413, message: `一次最多上傳 ${R2_UPLOAD_LIMITS.files} 張圖片。` })
  }

  const totalBytes = files.reduce((sum, file) => sum + file.data.length, 0)
  if (totalBytes > R2_UPLOAD_LIMITS.totalBytes) {
    throw createError({ statusCode: 413, message: '單次上傳總量不可超過 250 MB。' })
  }

  try {
    for (const file of files) {
      validateR2Image({ data: file.data, fileName: file.filename || 'image' })
    }

    const uploaded = []
    for (const file of files) {
      uploaded.push(await uploadR2Image({
        data: file.data,
        fileName: file.filename || 'image',
        translationKey
      }))
    }
    return { ok: true, files: uploaded }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'R2 圖片上傳失敗。'
    })
  }
})
