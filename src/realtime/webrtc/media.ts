export async function getConsultantMediaStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
}

export const getConsultMediaStream = getConsultantMediaStream

export async function getCustomerAudioStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: false, audio: true })
}

export function attachStream( element: HTMLMediaElement | null, stream: MediaStream, muted = false): void {
  if (!element) {
    return
  }

  element.srcObject = stream
  element.muted = muted
  void element.play().catch(() => {
  })
}

export function detachStream(element: HTMLMediaElement | null): void {
  if (!element) {
    return
  }

  element.pause()
  element.srcObject = null
  element.removeAttribute('src')
  element.load()
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
}