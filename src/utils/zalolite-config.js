import connectDB from '@/config/connectDB'
import NotificationSetting from '@/models/notificationSetting'
import { getZaloLiteBaseUrl, getZaloLiteApiKey } from '@/utils/env'

const KEYS = ['ZALOLITE_BASE_URL', 'ZALOLITE_API_KEY']
const TTL = 60 * 1000

let cache = { baseUrl: '', apiKey: '', loadedAt: 0 }

export async function getZaloLiteConfig() {
  const now = Date.now()
  if ((cache.baseUrl || cache.apiKey) && now - cache.loadedAt < TTL) {
    return { baseUrl: cache.baseUrl, apiKey: cache.apiKey }
  }
  try {
    await connectDB()
    const docs = await NotificationSetting.find({ key: { $in: KEYS } }).lean()
    const map = {}
    for (const d of docs) map[d.key] = d.value
    cache.baseUrl = map.ZALOLITE_BASE_URL || getZaloLiteBaseUrl()
    cache.apiKey = map.ZALOLITE_API_KEY || getZaloLiteApiKey()
  } catch (error) {
    console.error('[ZaloLite config] fallback to env:', error.message)
    cache.baseUrl = getZaloLiteBaseUrl()
    cache.apiKey = getZaloLiteApiKey()
  }
  cache.loadedAt = now
  return { baseUrl: cache.baseUrl, apiKey: cache.apiKey }
}

export function clearZaloLiteConfigCache() {
  cache = { baseUrl: '', apiKey: '', loadedAt: 0 }
}
