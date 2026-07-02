import { parseSignalMessage, serializeSignalMessage } from './protocol'
import type { SignalMessage } from '../../shared/types/signaling.types'

interface ConnectOptions {
	url: string
	onMessage: (message: SignalMessage) => void
	onOpen?: () => void
	onClose?: () => void
	onError?: (event: Event) => void
}

export class SignalingWsClient {
	private socket: WebSocket | null = null

	connect(options: ConnectOptions): Promise<void> {
		const { url, onMessage, onOpen, onClose, onError } = options

		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			return Promise.resolve()
		}

		return new Promise((resolve, reject) => {
			const socket = new WebSocket(url)
			this.socket = socket

			socket.addEventListener('open', () => {
				onOpen?.()
				resolve()
			})

			socket.addEventListener('message', (event) => {
				if (typeof event.data !== 'string') {
					return
				}

				const parsed = parseSignalMessage(event.data)
				if (parsed) {
					onMessage(parsed)
				}
			})

			socket.addEventListener('close', () => {
				onClose?.()
				if (this.socket === socket) {
					this.socket = null
				}
			})

			socket.addEventListener('error', (event) => {
				onError?.(event)
				reject(new Error('WebSocket connection failed'))
			})
		})
	}

	send(message: SignalMessage): void {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			return
		}

		this.socket.send(serializeSignalMessage(message))
	}

	close(): void {
		if (!this.socket) {
			return
		}

		this.socket.close()
		this.socket = null
	}

	get isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN
	}
}

