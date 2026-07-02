import { ConsultantCallView } from '../features/consultant/call/ConsultantCallView'

export function ConsultantPage() {
  return (
    <main>
      <h1>Video Shop Console</h1>
      <p className="subtitle">Consultant publishes video and receives customer audio only.</p>
      <ConsultantCallView />
    </main>
  )
}
