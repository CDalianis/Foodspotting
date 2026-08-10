import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { http } from '../api/http'
import { useI18n } from '../i18n/I18nProvider'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useI18n()

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await http.post('/users', { username, email, password })
      setSuccess(t('register.success'))
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setError(
        err?.response?.data?.description || err?.response?.data?.message || t('register.failed'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-card">
      <h2>{t('register.title')}</h2>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          {t('register.username')}
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          {t('register.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('register.password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="full-width" disabled={loading} type="submit">
          {loading ? t('register.submitting') : t('register.submit')}
        </button>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>
    </section>
  )
}
