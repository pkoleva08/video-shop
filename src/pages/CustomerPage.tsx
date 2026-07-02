import { useEffect, useState } from 'react'
import { CustomerCallView } from '../features/customer/call/CustomerCallView'

export function CustomerPage() {
  const [started, setStarted] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [readyForCall, setReadyForCall] = useState(false)

  useEffect(() => {
    if (!waiting) {
      return
    }

    const timer = window.setTimeout(() => {
      setWaiting(false)
      setReadyForCall(true)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [waiting])

  const handleAcceptConsent = () => {
    setConsentAccepted(true)
    setWaiting(true)
  }

  return (
    <main>
      <h1>Video Shop</h1>
      <p className="subtitle">Customer journey: consent to waiting room to consultant live video.</p>

      {!started && (
        <section className="panel">
          <h2>Start call</h2>
          <p>Press the button to start your video consultation flow.</p>
          <div className="actions">
            <button type="button" onClick={() => setStarted(true)}>
              Start video call
            </button>
          </div>
        </section>
      )}

      {started && !consentAccepted && (
        <section className="panel">
          <h2>Terms and consent</h2>
          <p>You must accept the terms before any microphone or connection starts.</p>
          <label>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => setConsentChecked(event.target.checked)}
            />{' '}
            I agree with the terms and conditions.
          </label>
          <div className="actions">
            <button type="button" disabled={!consentChecked} onClick={handleAcceptConsent}>
              Continue
            </button>
          </div>
        </section>
      )}

      {waiting && (
        <section className="panel">
          <h2>Waiting room</h2>
          <p className="status">Connecting you to a consultant...</p>
        </section>
      )}

      {readyForCall && <CustomerCallView />}
    </main>
  )
}
