export interface ClientConfig {
  signalingUrl: string
  apiBaseUrl: string
}

const DEFAULT_SIGNALING_URL = 'ws://localhost:8080/ws/signaling'
const DEFAULT_API_BASE_URL = 'http://localhost:8080/api'

function deriveApiBaseUrl(signalingUrl: string): string {
  try {
    const url = new URL(signalingUrl)
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:'
    url.pathname = '/api'
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_API_BASE_URL
  }
}

export function getClientConfig(): ClientConfig {
  const signalingUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SIGNALING_URL
      ? String(import.meta.env.VITE_SIGNALING_URL)
      : DEFAULT_SIGNALING_URL

  const apiBaseUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL)
      : deriveApiBaseUrl(signalingUrl)

  return {
    signalingUrl,
    apiBaseUrl,
  }
}

export const clientConfig = getClientConfig()
