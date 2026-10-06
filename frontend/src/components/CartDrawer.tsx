import { Link } from 'react-router-dom'
import { recommendFor } from '../match'
import { money, useShop } from '../store'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQuantity, cartTotal, lastAdded, products, addToCart, user } = useShop()
  const discount = user?.student_discount ? Math.round(cartTotal * 10) / 100 : 0
  if (!cartOpen) return null
  const inBag = new Set(cart.map((l) => l.product_id))
  const recs = lastAdded ? recommendFor(lastAdded.product, lastAdded.size, products, inBag) : []
  return (
    <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Your bag">
        <header>
          <h2>Your bag</h2>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close">✕</button>
        </header>
        {lastAdded && (
          <div className="added">
            <img src={lastAdded.product.image_url} alt="" />
            <div>
              <strong>✓ Added to your bag</strong>
              <span className="muted">{lastAdded.product.name} · Size {lastAdded.size}</span>
            </div>
          </div>
        )}
        {recs.length > 0 && (
          <section className="recs" aria-label="Complete the look">
            <h3>Complete the look</h3>
            <p className="muted small">Picked to go with your {lastAdded!.product.category.toLowerCase().replace(/s$/, '')}, all in stock in size {lastAdded!.size}.</p>
            <ul>
              {recs.map((p) => (
                <li key={p.product_id}>
                  <Link to={`/products/${p.product_id}`} onClick={() => setCartOpen(false)}>
                    <img src={p.image_url} alt="" />
                  </Link>
                  <div>
                    <Link to={`/products/${p.product_id}`} onClick={() => setCartOpen(false)} className="rec-name">{p.name}</Link>
                    <span className="muted">{p.category} · {money(p.price)}</span>
                  </div>
                  <button className="btn-mini" onClick={() => addToCart(p, lastAdded!.size, 1, false)}>
                    + {lastAdded!.size}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {cart.length === 0 ? (
          <p className="muted">Your bag is empty. Go find something Bulldog-worthy!</p>
        ) : (
          <>
            <ul className="bag-lines">
              {cart.map((l) => (
                <li key={`${l.product_id}-${l.size}`}>
                  <img src={l.image_url} alt="" />
                  <div>
                    <strong>{l.name}</strong>
                    <span className="muted">Size {l.size} · {money(l.price)}</span>
                    <div className="qty">
                      <button onClick={() => setQuantity(l.product_id, l.size, l.quantity - 1)}>−</button>
                      <span>{l.quantity}</span>
                      <button onClick={() => setQuantity(l.product_id, l.size, l.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <span>{money(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="bag-total">
              <span>Subtotal</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            {discount > 0 ? (
              <div className="bag-total stu-line">
                <span>🎓 Yale student 10%</span>
                <strong>−{money(discount)}</strong>
              </div>
            ) : (
              !user?.student_discount && (
                <p className="muted small">🎓 Yale student? Sign in with your @yale.edu email for 10% off.</p>
              )
            )}
            <Link to="/checkout" className="btn btn-primary btn-block" onClick={() => setCartOpen(false)}>
              Checkout
            </Link>
          </>
        )}
      </aside>
    </div>
  )
}
