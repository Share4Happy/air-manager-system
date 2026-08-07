import { getZaloLiteConfig } from '@/utils/zalolite-config'

const NETWORK_RETRY_CODES = [502, 503, 504]

let circuitOpen = false
let circuitFailures = 0
const CIRCUIT_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 60 * 1000

function resetCircuit() {
  circuitFailures = 0
  circuitOpen = false
}

function recordFailure() {
  circuitFailures++
  if (circuitFailures >= CIRCUIT_THRESHOLD) circuitOpen = true
}

function isRetryableError(err, status) {
  if (NETWORK_RETRY_CODES.includes(status)) return true
  const msg = String(err?.message || err || '').toLowerCase()
  return /timeout|econnrefused|econnreset|socket hang up|fetch failed|network/i.test(msg)
}

function isPermanentError(status, err) {
  if (status === -201) return true
  if (status === -213 || status === -117) return true
  const msg = String(err?.message || err || '').toLowerCase()
  return /blocked|spam|không.*bạn bè|không phải bạn bè/i.test(msg)
}

function normalizePhone(phone) {
  if (!phone) return ''
  let p = String(phone).trim().replace(/[^\d]/g, '')
  if (p.startsWith('84') && p.length > 10) p = p.slice(2)
  else if (p.startsWith('0')) p = p.slice(1)
  return `84${p}`
}

async function zaloliteFetch(path, { method = 'GET', body } = {}, retries = 3) {
  if (circuitOpen) {
    const err = new Error('Circuit breaker đang mở: quá nhiều lỗi spam/mạng liên tiếp. Campaign tạm dừng.')
    err.circuitOpen = true
    throw err
  }
  const { baseUrl, apiKey } = await getZaloLiteConfig()
  if (!apiKey) throw new Error('Chưa cấu hình ZALOLITE_API_KEY trong Cài đặt (tab ZaloLite).')

  const url = `${baseUrl}${path}`
  let attempt = 0
  let lastErr = null
  while (attempt <= retries) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      })
      if (res.status === 202) {
        const json = await res.json()
        return { status: 202, async: true, data: json }
      }
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        const bizStatus = json?.status ?? json?.error_code ?? json?.code
        const err = new Error(json?.message || json?.error || `HTTP ${res.status} từ ZaloLite Gateway.`)
        err.status = res.status
        if (isPermanentError(bizStatus, json)) {
          recordFailure()
          err.permanent = true
        }
        throw err
      }
      resetCircuit()
      return { status: res.status, async: false, data: json }
    } catch (err) {
      lastErr = err
      if (err.permanent || err.circuitOpen) throw err
      if (!isRetryableError(err, err?.status)) recordFailure()
      const shouldRetry = isRetryableError(err, err?.status) && attempt < retries
      if (shouldRetry) {
        attempt++
        await new Promise(r => setTimeout(r, 1000 * attempt))
        continue
      }
      throw err
    }
  }
  throw lastErr || new Error('Lỗi không xác định khi gọi ZaloLite Gateway.')
}

function unwrap(body) {
  return body?.data ?? body
}

export async function fetchBot(botId) {
  const { data } = await zaloliteFetch(`/bots/${botId}`)
  return unwrap(data)
}

export async function fetchBots() {
  const { data } = await zaloliteFetch('/bots')
  return unwrap(data) || []
}

export async function sendBatch(botId, { recipients, text, mode = 'safe' }) {
  const { async, data } = await zaloliteFetch(`/bots/${botId}/messages/send-batch`, {
    method: 'POST',
    body: {
      recipients: recipients.map(r => ({ phone: normalizePhone(r.phone) })),
      content: { type: 'text', data: { text } },
      mode,
    },
  })
  return { async, data: unwrap(data) }
}

export async function sendByPhone(botId, { phone, text, mode = 'safe' }) {
  const { async, data } = await zaloliteFetch(`/bots/${botId}/messages/send-by-phone`, {
    method: 'POST',
    body: {
      phone: normalizePhone(phone),
      content: { type: 'text', data: { text } },
      mode,
    },
  })
  return { async, data: unwrap(data) }
}

export async function pollCampaign(botId, campaignId) {
  const { data } = await zaloliteFetch(`/bots/${botId}/campaigns/${campaignId}`)
  return unwrap(data)
}

export async function sendFriendBatch(botId, { recipients, message, aliasPrefix = '', mode = 'safe' }) {
  const { async, data } = await zaloliteFetch(`/bots/${botId}/friends/requests/send-batch`, {
    method: 'POST',
    body: {
      recipients: recipients.map(r => ({ phone: normalizePhone(r.phone) })),
      message,
      ...(aliasPrefix ? { alias_prefix: aliasPrefix } : {}),
      mode,
    },
  })
  return { async, data: unwrap(data) }
}

export function isBatchAsync(response) {
  return response?.async === true
}
