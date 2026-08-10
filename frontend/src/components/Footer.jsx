import { useI18n } from '../i18n/I18nProvider'

export function Footer() {
  const year = new Date().getFullYear()
  const { t } = useI18n()

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-brand">FoodSpots</p>
        <p className="footer-text">{t('footer.tagline')}</p>
      </div>
      <p className="footer-copy">{t('footer.copy', { year })}</p>
    </footer>
  )
}
