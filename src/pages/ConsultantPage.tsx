import { ConsultantCallView } from '../features/consultant/call/ConsultantCallView'

export function ConsultantPage() {
  return (
    <main>
      <h1 className='video-shop'>Video Shop Console</h1>
      <p className="subtitle">Consultant publishes video and receives customer audio only.</p>
      <ConsultantCallView />
    </main>
  )
}
