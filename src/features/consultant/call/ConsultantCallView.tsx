import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createHangupMessage,
  createIceCandidateMessage,
  createJoinMessage,
  createLeaveMessage,
  createOfferMessage,
} from '../../../realtime/signaling/protocol'
import { SignalingWsClient } from '../../../realtime/signaling/wsClient'
import { attachStream, getConsultantMediaStream, stopStream } from '../../../realtime/webrtc/media'
import { CallPeer } from '../../../realtime/webrtc/peer'
import type { SignalMessage } from '../../../shared/types/signaling.types'

interface ConsultantCallViewProps {
  signalingUrl?: string
}

function randomSessionId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function ConsultantCallView({
  signalingUrl = 'ws://localhost:8080/ws/signaling',
}: ConsultantCallViewProps) {
  const sessionId = useMemo(() => randomSessionId(), [])
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const wsRef = useRef<SignalingWsClient | null>(null)
  const peerRef = useRef<CallPeer | null>(null)
  const localMediaRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState('Idle')

  useEffect(() => {
    return () => {
      peerRef.current?.close()
      wsRef.current?.close()
      stopStream(localMediaRef.current)
    }
  }, [])

  const handleSignal = async (message: SignalMessage) => {
    const peer = peerRef.current
    if (!peer) {
      return
    }

    if (message.sessionId !== sessionId) {
      return
    }

    if (message.event === 'answer') {
      await peer.setRemoteDescription(message.sdp)
      setStatus('Answer received. Finalizing ICE...')
      return
    }

    if (message.event === 'ice-candidate') {
      await peer.addIceCandidate(message.candidate)
      return
    }

    if (message.event === 'hangup') {
      setStatus('Call ended by customer')
      peer.close()
      peerRef.current = null
    }
  }

  const start = async () => {
    try {
      setStatus('Requesting camera and microphone...')
      const localStream = await getConsultantMediaStream()
      localMediaRef.current = localStream
      attachStream(localVideoRef.current, localStream, true)

      const peer = new CallPeer('consultant', {
        onIceCandidate: (candidate) => {
          wsRef.current?.send(createIceCandidateMessage(sessionId, candidate))
        },
        onRemoteStream: (stream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream
            void remoteAudioRef.current.play().catch(() => {
              // Autoplay can be blocked until user interaction.
            })
          }
        },
        onConnectionStateChange: (connectionState) => {
          setStatus(`Connection: ${connectionState}`)
        },
      })

      peer.addLocalStream(localStream)
      peerRef.current = peer

      const ws = new SignalingWsClient()
      wsRef.current = ws

      setStatus('Connecting to signaling server...')
      await ws.connect({
        url: signalingUrl,
        onMessage: (message) => {
          void handleSignal(message)
        },
        onOpen: () => setStatus('Connected. Preparing offer...'),
      })

      ws.send(createJoinMessage(sessionId, 'consultant', 'consultant-page'))
      const offer = await peer.createOffer()
      ws.send(createOfferMessage(sessionId, offer))
      setStatus('Offer sent. Waiting for customer answer...')
    } catch {
      setStatus('Could not start call. Check camera/mic permission and signaling URL.')
    }
  }

  const endCall = () => {
    wsRef.current?.send(createLeaveMessage(sessionId, 'consultant-left'))
    wsRef.current?.send(createHangupMessage(sessionId))
    peerRef.current?.close()
    wsRef.current?.close()
    stopStream(localMediaRef.current)
    peerRef.current = null
    wsRef.current = null
    localMediaRef.current = null
    setStatus('Call ended')
  }

  return (
    <section className="panel">
      <h2>Consultant view</h2>
      <p className="status">{status}</p>
      <video ref={localVideoRef} className="video" playsInline autoPlay muted controls />
      <audio ref={remoteAudioRef} autoPlay controls />
      <div className="actions">
        <button type="button" onClick={start}>
          Go online
        </button>
        <button type="button" onClick={endCall}>
          End call
        </button>
      </div>
      <p className="meta">Session: {sessionId}</p>
    </section>
  )
}
