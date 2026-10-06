import { Link } from 'react-router-dom'
import { PHOTO_CREDITS } from '../yale'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="brand brand-light">
            <span className="brand-mark">Y</span>
            <span><strong>Campus Customs</strong><small>Yale Bulldog Blue</small></span>
          </div>
          <p className="footer-motto">Lux et Veritas, and a really good hoodie.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/products?category=Hoodies">Hoodies</Link>
          <Link to="/products?category=Crewnecks">Crewnecks</Link>
          <Link to="/products?category=T-Shirts">T-Shirts</Link>
          <Link to="/products?category=Quarter-Zips">Quarter-Zips</Link>
        </div>
        <div>
          <h4>Help</h4>
          <span>Made to order in 5–8 business days, then UPS</span>
          <span>Returns within 30 days, unworn with tags</span>
          <span>Yale students: 10% off with @yale.edu sign-in</span>
        </div>
        <div>
          <h4>Visit</h4>
          <span>57 Broadway, New Haven, CT 06511</span>
          <span>(475) 301-4205</span>
          <span>orderdept@campuscustoms.com</span>
        </div>
      </div>
      <div className="credits">
        <span>© Campus Customs · Officially licensed Yale merchandise · Class project for MGT 409.</span>
        <span>
          Photos via Wikimedia Commons:{' '}
          {PHOTO_CREDITS.map((c, i) => (
            <span key={c.url}>
              <a href={c.url} target="_blank" rel="noreferrer">{c.what}</a> by {c.who} ({c.license})
              {i < PHOTO_CREDITS.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </span>
      </div>
    </footer>
  )
}
