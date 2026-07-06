import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createHangupMessage,
  createIceCandidateMessage,
  createJoinMessage,
  createLeaveMessage,
  createOfferMessage,
} from '../../../realtime/signaling/protocol'
import { resolveSessionId, writeSessionIdToUrl } from '../../../realtime/signaling/sessionId'
import { copySessionShareUrl } from '../../../realtime/signaling/sessionLink'
import { SignalingWsClient } from '../../../realtime/signaling/wsClient'
import { getMediaAccessErrorMessage } from '../../../realtime/webrtc/mediaError'
import { attachStream, detachStream, getConsultantMediaStream, stopStream } from '../../../realtime/webrtc/media'
import { CallPeer } from '../../../realtime/webrtc/peer'
import type { SignalMessage } from '../../../shared/types/signaling.types'

interface ConsultantCallViewProps {
  signalingUrl?: string
}

export function ConsultantCallView({
  signalingUrl = 'ws://localhost:8080/ws/signaling',
}: ConsultantCallViewProps) {
  const { sessionId } = useMemo(() => resolveSessionId(window.location.search), [])
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const wsRef = useRef<SignalingWsClient | null>(null)
  const peerRef = useRef<CallPeer | null>(null)
  const localMediaRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState('Idle')

  useEffect(() => {
    const localVideoElement = localVideoRef.current
    const remoteAudioElement = remoteAudioRef.current
    writeSessionIdToUrl(sessionId)

    return () => {
      peerRef.current?.close()
      wsRef.current?.close()
      stopStream(localMediaRef.current)
      detachStream(localVideoElement)
      detachStream(remoteAudioElement)
    }
  }, [sessionId])

  const handleSignal = async (message: SignalMessage) => {
    if (message.event === 'server-error') {
      if (!message.sessionId || message.sessionId === sessionId) {
        setStatus(`Server error: ${message.reason}`)
      }
      return
    }

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
      stopStream(localMediaRef.current)
      peerRef.current = null
      localMediaRef.current = null
      detachStream(localVideoRef.current)
      detachStream(remoteAudioRef.current)
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
    } catch (error) {
      setStatus(getMediaAccessErrorMessage(error, 'consultant'))
    }
  }

  const endCall = () => {
    wsRef.current?.send(createLeaveMessage(sessionId, 'consultant-left'))
    wsRef.current?.send(createHangupMessage(sessionId))
    peerRef.current?.close()
    wsRef.current?.close()
    stopStream(localMediaRef.current)
    detachStream(localVideoRef.current)
    detachStream(remoteAudioRef.current)
    peerRef.current = null
    wsRef.current = null
    localMediaRef.current = null
    setStatus('Call ended')
  }

  const copySessionLink = async () => {
    const copied = await copySessionShareUrl(sessionId)
    setStatus(copied ? 'Session link copied.' : 'Could not copy session link.')
  }

  return (
    <section className="panel">
      <h2>Consultant view</h2>
      <p className="status">{status}</p>
      <video ref={localVideoRef} className="video" playsInline autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
      <div className="actions">
        <button type="button" onClick={start}>
          Go online
        </button>
        <button type="button" onClick={() => void copySessionLink()}>
          Copy session link
        </button>
        <button type="button" onClick={endCall}>
          End call
        </button>
      </div>
      <p className="meta">Session: {sessionId}</p>
    </section>
  )
}

