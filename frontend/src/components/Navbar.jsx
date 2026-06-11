import { Link, useLocation } from 'react-router-dom'

export function Navbar({ token, username, theme, onToggleTheme, onLogout }) {
  const location = useLocation()

  const linkClasses = (isActive) =>
    `nav-link${isActive ? ' nav-link-active' : ''}`

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link className="navbar-logo" to={token ? '/places' : '/'}>
          FoodSpots
        </Link>
        {token && username && (
          <span className="navbar-username">Welcome, {username}</span>
        )}
      </div>

      <nav className="navbar-actions" aria-label="Main navigation">
        {token ? (
          <>
            <Link className={linkClasses(location.pathname === '/places')} to="/places">
              My Places
            </Link>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
            </button>
            <button type="button" className="nav-logout" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className={linkClasses(location.pathname === '/register')} to="/register">
              Register
            </Link>
            <Link className={linkClasses(location.pathname === '/login')} to="/login">
              Login
            </Link>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
