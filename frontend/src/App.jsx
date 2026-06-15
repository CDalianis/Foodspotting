import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { LoginPage } from './pages/LoginPage'
import { PlacesPage } from './pages/PlacesPage'
import { RegisterPage } from './pages/RegisterPage'
import {
  clearAuthToken,
  getAuthToken,
  getUsernameFromToken,
  subscribeAuthChanges,
} from './services/auth'
import { getTheme, subscribeThemeChanges, toggleTheme } from './services/theme'

function PrivateRoute({ children }) {
  const token = getAuthToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const token = getAuthToken()
  if (token) return <Navigate to="/places" replace />
  return children
}

function App() {
  const [token, setToken] = useState(getAuthToken())
  const [username, setUsername] = useState(getUsernameFromToken())
  const [theme, setTheme] = useState(getTheme())
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribeAuth = subscribeAuthChanges(() => {
      const nextToken = getAuthToken()
      setToken(nextToken)
      setUsername(getUsernameFromToken(nextToken))
    })

    const unsubscribeTheme = subscribeThemeChanges(() => {
      setTheme(getTheme())
    })

    return () => {
      unsubscribeAuth()
      unsubscribeTheme()
    }
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    setToken(null)
    setUsername(null)
    navigate('/login')
  }

  const handleToggleTheme = () => {
    setTheme(toggleTheme())
  }

  return (
    <div className="app-shell">
      <Navbar
        token={token}
        username={username}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
      />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to={token ? '/places' : '/login'} replace />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="/places"
            element={
              <PrivateRoute>
                <PlacesPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
