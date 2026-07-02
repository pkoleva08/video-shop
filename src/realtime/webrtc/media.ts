export async function getConsultantMediaStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
}

export async function getCustomerAudioStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true,
  })
}

export function attachStream(
  element: HTMLVideoElement | null,
  stream: MediaStream,
  muted = false,
): void {
  if (!element) {
    return
  }

  element.srcObject = stream
  element.muted = muted
  void element.play().catch(() => {
    // Autoplay can be blocked until user interaction.
  })
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}
