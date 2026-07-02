import { useState } from 'react'
import { ConsultantPage } from './pages/ConsultantPage'
import { CustomerPage } from './pages/CustomerPage'
import './App.css'

function App() {
  const [view, setView] = useState<'customer' | 'consultant'>('customer')

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" onClick={() => setView('customer')} className={view === 'customer' ? 'active' : ''}>
          Customer mode
        </button>
        <button
          type="button"
          onClick={() => setView('consultant')}
          className={view === 'consultant' ? 'active' : ''}
        >
          Consultant mode
        </button>
      </header>
      {view === 'customer' ? <CustomerPage /> : <ConsultantPage />}
    </div>
  )
}

export default App
