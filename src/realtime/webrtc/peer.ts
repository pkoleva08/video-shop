import type { ParticipantRole } from '../../shared/types/signaling.types'

interface CallPeerHandler {
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: ['stun:stun.l.google.com:19302'],
  },
]

export class CallPeer {
  private readonly peer: RTCPeerConnection
  private readonly remoteStream = new MediaStream()
  private readonly role: ParticipantRole

  constructor(role: ParticipantRole, handler: CallPeerHandler) {
    this.role = role
    this.peer = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS })

    this.configureRoleDirections()

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        handler.onIceCandidate?.(event.candidate.toJSON())
      }
    }

    this.peer.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        handler.onRemoteStream?.(stream)
        return
      }

      this.remoteStream.addTrack(event.track)
      handler.onRemoteStream?.(this.remoteStream)
    }

    this.peer.onconnectionstatechange = () => {
      handler.onConnectionStateChange?.(this.peer.connectionState)
    }
  }

  private configureRoleDirections(): void {
    if (this.role === 'consultant') {
      this.peer.addTransceiver('video', { direction: 'sendonly' })
      this.peer.addTransceiver('audio', { direction: 'sendrecv' })
      return
    }

    this.peer.addTransceiver('video', { direction: 'recvonly' })
    this.peer.addTransceiver('audio', { direction: 'sendrecv' })
  }

  addLocalStream(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      if (this.role === 'customer' && track.kind === 'video') {
        return
      }

      this.peer.addTrack(track, stream)
    })
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.peer.createAnswer()
    await this.peer.setLocalDescription(answer)
    return answer
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peer.createOffer()
    await this.peer.setLocalDescription(offer)
    return offer
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.peer.setRemoteDescription(description)
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.peer.addIceCandidate(candidate)
  }

  close(): void {
    this.peer.getSenders().forEach((sender) => sender.track?.stop())
    this.peer.close()
  }
}
