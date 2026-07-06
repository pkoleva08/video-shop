import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createAnswerMessage,
  createHangupMessage,
  createIceCandidateMessage,
  createJoinMessage,
  createLeaveMessage,
} from '../../../realtime/signaling/protocol'
import { resolveSessionId, writeSessionIdToUrl } from '../../../realtime/signaling/sessionId'
import { copySessionShareUrl } from '../../../realtime/signaling/sessionLink'
import { SignalingWsClient } from '../../../realtime/signaling/wsClient'
import { getMediaAccessErrorMessage } from '../../../realtime/webrtc/mediaError'
import { attachStream, detachStream, getCustomerAudioStream, stopStream } from '../../../realtime/webrtc/media'
import { CallPeer } from '../../../realtime/webrtc/peer'
import type { SignalMessage } from '../../../shared/types/signaling.types'

interface CustomerCallViewProps {
  signalingUrl?: string
}

export function CustomerCallView({
  signalingUrl = 'ws://localhost:8080/ws/signaling',
}: CustomerCallViewProps) {
  const { sessionId } = useMemo(() => resolveSessionId(window.location.search), [])
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const wsRef = useRef<SignalingWsClient | null>(null)
  const peerRef = useRef<CallPeer | null>(null)
  const localAudioRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState('Idle')

  useEffect(() => {
    const remoteVideoElement = remoteVideoRef.current
    writeSessionIdToUrl(sessionId)

    return () => {
      peerRef.current?.close()
      wsRef.current?.close()
      stopStream(localAudioRef.current)
      detachStream(remoteVideoElement)
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

    if (message.event === 'offer') {
      await peer.setRemoteDescription(message.sdp)
      const answer = await peer.createAnswer()
      wsRef.current?.send(createAnswerMessage(sessionId, answer))
      setStatus('Answer sent. Waiting for ICE completion...')
      return
    }

    if (message.event === 'ice-candidate') {
      await peer.addIceCandidate(message.candidate)
      return
    }

    if (message.event === 'hangup') {
      setStatus('Call ended by consultant')
      peer.close()
      peerRef.current = null
      detachStream(remoteVideoRef.current)
    }
  }

  const start = async () => {
    try {
      setStatus('Requesting customer microphone...')
      const localAudio = await getCustomerAudioStream()
      localAudioRef.current = localAudio

      const peer = new CallPeer('customer', {
        onIceCandidate: (candidate) => {
          wsRef.current?.send(createIceCandidateMessage(sessionId, candidate))
        },
        onRemoteStream: (stream) => {
          attachStream(remoteVideoRef.current, stream)
        },
        onConnectionStateChange: (connectionState) => {
          setStatus(`Connection: ${connectionState}`)
        },
      })

      peer.addLocalStream(localAudio)
      peerRef.current = peer

      const ws = new SignalingWsClient()
      wsRef.current = ws

      setStatus('Connecting to signaling server...')
      await ws.connect({
        url: signalingUrl,
        onMessage: (message) => {
          void handleSignal(message)
        },
        onOpen: () => setStatus('Waiting in queue for consultant...'),
      })

      ws.send(createJoinMessage(sessionId, 'customer', 'customer-page'))
    } catch (error) {
      setStatus(getMediaAccessErrorMessage(error, 'customer'))
    }
  }

  const endCall = () => {
    wsRef.current?.send(createLeaveMessage(sessionId, 'customer-left'))
    wsRef.current?.send(createHangupMessage(sessionId))
    peerRef.current?.close()
    wsRef.current?.close()
    stopStream(localAudioRef.current)
    detachStream(remoteVideoRef.current)
    peerRef.current = null
    wsRef.current = null
    localAudioRef.current = null
    setStatus('Call ended')
  }

  const copySessionLink = async () => {
    const copied = await copySessionShareUrl(sessionId)
    setStatus(copied ? 'Session link copied.' : 'Could not copy session link.')
  }

  return (
    <section className="panel">
      <h2 className='customer-view'>Customer view</h2>
      <p className="status">{status}</p>
      <video ref={remoteVideoRef} className="video" playsInline autoPlay />
      <div className="actions">
        <button type="button" onClick={start}>
          Join waiting room
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
