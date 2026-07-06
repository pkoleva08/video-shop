export function buildSessionShareUrl(sessionId: string): string {
    const url = new URL(window.location.href)
    url.searchParams.set('sessionId', sessionId)
    return url.toString()
}

export async function copySessionShareUrl(sessionId: string): Promise<boolean> {
    try {
        const shareUrl = buildSessionShareUrl(sessionId)
        await navigator.clipboard.writeText(shareUrl)
        return true
    } catch {
        return false
    }
}