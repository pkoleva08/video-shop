export interface ClientConfig {
  signalingUrl: string
}

const DEFAULT_SIGNALING_URL = 'ws://localhost:8080/ws/signaling'

export function getClientConfig(): ClientConfig {
  const signalingUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SIGNALING_URL
      ? String(import.meta.env.VITE_SIGNALING_URL)
      : DEFAULT_SIGNALING_URL

  return {
    signalingUrl,
  }
}

export const clientConfig = getClientConfig()
