const SESSION_ID_PARAM = 'sessionId'
const MIN_LENGTH = 4
const MAX_LENGTH = 64
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]+$/

export interface ResolvedSessionId {
  sessionId: string
  fromUrl: boolean
}

export function createRandomSessionId(length = 8): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

export function normalizeSessionId(value: string): string {
  return value.trim()
}

export function isValidSessionId(value: string): boolean {
  const sessionId = normalizeSessionId(value)
  return (
    sessionId.length >= MIN_LENGTH &&
    sessionId.length <= MAX_LENGTH &&
    SESSION_ID_REGEX.test(sessionId)
  )
}

export function getSessionIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search)
  const candidate = params.get(SESSION_ID_PARAM)

  if (!candidate) {
    return null
  }

  const normalized = normalizeSessionId(candidate)
  return isValidSessionId(normalized) ? normalized : null
}

export function resolveSessionId(search: string): ResolvedSessionId {
  const fromUrl = getSessionIdFromSearch(search)
  if (fromUrl) {
    return { sessionId: fromUrl, fromUrl: true }
  }

  return { sessionId: createRandomSessionId(), fromUrl: false }
}

export function writeSessionIdToUrl(sessionId: string): void {
  if (!isValidSessionId(sessionId)) {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.set(SESSION_ID_PARAM, sessionId)
  window.history.replaceState({}, '', url.toString())
}