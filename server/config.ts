export interface ServerConfig {
  port: number
  signalingPath: string
}

const DEFAULT_PORT = 8080
const DEFAULT_SIGNALING_PATH = '/ws/signaling'

export function getServerConfig(): ServerConfig {
  const port = readPortFromEnv(process.env.SIGNALING_PORT, DEFAULT_PORT)
  const signalingPath =
    typeof process.env.SIGNALING_PATH === 'string' && process.env.SIGNALING_PATH.trim().length > 0
      ? process.env.SIGNALING_PATH
      : DEFAULT_SIGNALING_PATH

  return {
    port,
    signalingPath,
  }
}

function readPortFromEnv(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback
  }

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback
  }

  return parsed
}

export const serverConfig = getServerConfig()
