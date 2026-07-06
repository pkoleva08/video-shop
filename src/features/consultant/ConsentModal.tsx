import { useState } from 'react'

interface ConsentModalProps {
    isOpen: boolean
    onAccept: () => void
    onClose: () => void
}

export function ConsentModal({ isOpen, onAccept, onClose }: ConsentModalProps) {
    const [checked, setChecked] = useState(false)

    if (!isOpen) {
        return null
    }

    const handleAccept = () => {
        if (!checked) {
            return
        }

        onAccept()
        setChecked(false)
    }

    const handleClose = () => {
        setChecked(false)
        onClose()
    }

    return (
        <div 
        style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '15px',
        }}
        >
            <div
            className="panel"
            style={{
                width: '100%',
                maxWidth: '520px',
                background: '#fff',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-modal-title"
            >
                <h2 id="consent-modal-title">Terms and consent</h2>
                <p>You must accept the terms before any microphone or connection starts.</p>

                <label>
                    <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => setChecked(event.target.checked)}
                    />
                    I accept the terms and conditions for video consultation.
                </label>

                <div className="actions">
                    <button type="button" onClick={handleClose}>
                        Close
                    </button>
                    <button type="button" disabled={!checked} onClick={handleAccept}>
                        Continue
                    </button>
                </div>
            </div>
        </div>
    )
}
