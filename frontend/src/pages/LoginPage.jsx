import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { http } from '../api/http'
import { useI18n } from '../i18n/I18nProvider'
import { setAuthToken } from '../services/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useI18n()

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await http.post('/auth/authenticate', { username, password })
      setAuthToken(data.token)
      navigate('/places')
    } catch (err) {
      setError(err?.response?.data?.description || err?.response?.data?.message || t('login.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-card">
      <h2>{t('login.title')}</h2>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          {t('login.username')}
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          {t('login.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="full-width" disabled={loading} type="submit">
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  )
}
