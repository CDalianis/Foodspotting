import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { SUPPORTED_LANGUAGES } from '../i18n/language'

export function Navbar({ token, username, theme, onToggleTheme, onLogout }) {
  const location = useLocation()
  const { language, setLanguage, t } = useI18n()

  const linkClasses = (isActive) =>
    `nav-link${isActive ? ' nav-link-active' : ''}`

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link className="navbar-logo" to={token ? '/places' : '/'}>
          FoodSpots
        </Link>
        {token && username && (
          <span className="navbar-username">{t('nav.welcome', { username })}</span>
        )}
      </div>

      <nav className="navbar-actions" aria-label={t('nav.mainNavigation')}>
        <div className="language-toggle" role="group" aria-label={t('nav.language')}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-btn${language === lang.code ? ' active' : ''}`}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={language === lang.code}
              title={lang.nativeLabel}
            >
              {lang.label}
            </button>
          ))}
        </div>
        {token ? (
          <>
            <Link className={linkClasses(location.pathname === '/places')} to="/places">
              {t('nav.myPlaces')}
            </Link>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
            </button>
            <button type="button" className="nav-logout" onClick={onLogout}>
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <Link className={linkClasses(location.pathname === '/register')} to="/register">
              {t('nav.register')}
            </Link>
            <Link className={linkClasses(location.pathname === '/login')} to="/login">
              {t('nav.login')}
            </Link>
            <button type="button" className="theme-toggle" onClick={onToggleTheme}>
              {theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
