import { useState } from 'react'
import type { FormEvent } from 'react'
import { clientConfig } from '../config/clientConfig'
import { ConsultantCallView } from '../features/consultant/call/ConsultantCallView'

export function ConsultantPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [name, setName] = useState<string | null>(null)
  const [status, setStatus] = useState('Please log in before going online.')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setStatus('Checking consultant credentials...')

    try {
      const response = await fetch(`${clientConfig.apiBaseUrl}/consultants/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = (await response.json()) as {
        authenticated?: boolean
        name?: string | null
        message?: string
      }

      if (!response.ok || !data.authenticated) {
        setName(null)
        setStatus(data.message ?? 'Login failed.')
        return
      }

      setName(data.name ?? username)
      setStatus('Login successful. Consultant console unlocked.')
    } catch {
      setName(null)
      setStatus('Could not reach the Spring Boot backend.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setStatus('Creating consultant profile...')

    try {
      const response = await fetch(`${clientConfig.apiBaseUrl}/consultants/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          name: registerName,
        }),
      })

      const data = (await response.json()) as {
        registered?: boolean
        message?: string
      }

      if (!response.ok || !data.registered) {
        setStatus(data.message ?? 'Registration failed.')
        return
      }

      setMode('login')
      setPassword('')
      setStatus(data.message ?? 'Registration successful. Please log in.')
    } catch {
      setStatus('Could not reach the Spring Boot backend.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <h1 className='video-shop'>Video Shop</h1>
      <p className="subtitle">Consultant publishes video and receives customer audio only.</p>

      {!name ? (
        <section className="panel">
          <h2>{mode === 'login' ? 'Consultant login' : 'Consultant registration'}</h2>
          <p className="status">{status}</p>
          <form
            className="auth-form"
            onSubmit={(event) => void (mode === 'login' ? handleLogin(event) : handleRegister(event))}
          >
            {mode === 'register' && (
              <label className="field">
                <span>Name</span>
                <input
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder="e.g. Maria Petrova"
                />
              </label>
            )}
            <label className="field">
              <span>Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </label>
            <div className="actions">
              <button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === 'login'
                    ? 'Logging in...'
                    : 'Registering...'
                  : mode === 'login'
                    ? 'Login'
                    : 'Register'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setStatus(
                    mode === 'login'
                      ? 'Create consultant account first, then log in.'
                      : 'Please log in before going online.',
                  )
                }}
              >
                {mode === 'login' ? 'Register' : 'Back to Login'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>Consultant console</h2>
            <p className="status">Logged in as {name}</p>
          </section>
          <ConsultantCallView />
        </>
      )}
    </main>
  )
}
