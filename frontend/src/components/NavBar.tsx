import { Link, NavLink } from 'react-router-dom'
import { useShop } from '../store'
import BagIcon from './BagIcon'

export default function NavBar() {
  const { user, signOut, cartCount, setCartOpen } = useShop()
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">Y</span>
          <span>
            <strong>Campus Customs</strong>
            <small>Yale Bulldog Blue</small>
          </span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/about">About Us</NavLink>
          {user ? (
            <>
              <span className="nav-hello">Hi, {user.first_name || user.name.split(' ')[0]}</span>
              <button className="link-btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup" className="nav-cta">Create Account</NavLink>
            </>
          )}
          <button className="bag-btn" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${cartCount} items`}>
            <BagIcon />
            <span>Bag</span>
            {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
          </button>
        </nav>
      </div>
    </header>
  )
}
