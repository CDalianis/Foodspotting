export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-brand">FoodSpots</p>
        <p className="footer-text">Save and explore your favorite food places on the map.</p>
      </div>
      <p className="footer-copy">© {year} FoodSpots. Built with Spring Boot & React.</p>
    </footer>
  )
}
