export type MediaAccessRole = 'customer' | 'consultant'

interface NamedError {
    name?: string
    message?: string
}

function getRoleLabel(role: MediaAccessRole): string {
    return role === 'consultant' ? 'camera and microphone' : 'microphone'
}

export function getMediaAccessErrorMessage(error: unknown, role: MediaAccessRole): string {
    const target = getRoleLabel(role)
    const err = (error ?? {}) as NamedError
    const name = err.name ?? ''

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return `Permission denied for ${target}. Please allow access in browser settings and try again.`
    }

    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return `No available ${target} device was found. Check if it is connected and not disabled.`
    }

    if (name === 'NotReadableError' || name === 'TrackStartError') {
        return `Your ${target} device is currently busy or unavailable. Close other apps using it and retry.`
    }

    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
        return `Requested media constraints are not supported by your device.`
    }

    if (name === 'SecurityError') {
        return `Media access is blocked by browser security policy. Use HTTPS or localhost.`
    }

    if (typeof err.message === 'string' && err.message.trim().length > 0) {
        return `Could not access ${target}: ${err.message}`
    }

    return `Could not start call. Check ${target} permissions and try again.`
}
