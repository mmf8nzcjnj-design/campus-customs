import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { money, usePageContext, useShop } from '../store'

/** One-page checkout: bag summary + contact/shipping form. No real payment. */
export default function Checkout() {
  usePageContext({ path: '/checkout', page_type: 'checkout' })
  const { cart, cartTotal, setQuantity, clearCart, user } = useShop()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ confirmation: string; subtotal: number; discount: number; total: number } | null>(null)
  const discount = user?.student_discount ? Math.round(cartTotal * 10) / 100 : 0
  const total = Math.round((cartTotal - discount) * 100) / 100

  useEffect(() => {
    if (user) {
      setName((n) => n || user.name)
      setEmail((e) => e || user.email)
    }
  }, [user])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.checkout({
        items: cart.map((l) => ({ product_id: l.product_id, size: l.size, quantity: l.quantity })),
        contact_name: name,
        email,
        address,
      })
      setDone(res)
      clearCart()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="page center-page">
        <div className="auth-card">
          <h1>Boola boola! 🎉</h1>
          <p>
            Your order <strong>{done.confirmation}</strong> is in ({money(done.total)}
            {done.discount > 0 && <>, including {money(done.discount)} student savings</>}).
          </p>
          <p className="muted">
            It's made to order in 5–8 business days, then ships by UPS. We'll email tracking to {email}.
          </p>
          <Link to="/products" className="btn btn-primary btn-block">Keep shopping</Link>
        </div>
      </div>
    )
  }

  if (!cart.length) {
    return (
      <div className="page center-page">
        <div className="auth-card">
          <h1>Your bag is empty</h1>
          <p className="muted">Find something Bulldog-worthy first.</p>
          <Link to="/products" className="btn btn-primary btn-block">Shop products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Checkout</h1>
      <div className="checkout">
        <form className="checkout-form" onSubmit={submit}>
          {!user && (
            <p className="muted small">
              Checking out as a guest. <Link to="/login" state={{ from: '/checkout' }}>Log in</Link> or{' '}
              <Link to="/signup" state={{ from: '/checkout' }}>create an account</Link> to fill this in for you.
            </p>
          )}
          <label>
            Full name
            <input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Shipping address
            <textarea autoComplete="street-address" required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <p className="muted small">This is a class demo: no payment is taken.</p>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Placing order…' : `Place order · ${money(total)}`}
          </button>
        </form>

        <aside className="summary">
          <h2>Order summary</h2>
          <ul className="bag-lines">
            {cart.map((l) => (
              <li key={`${l.product_id}-${l.size}`}>
                <img src={l.image_url} alt="" />
                <div>
                  <strong>{l.name}</strong>
                  <span className="muted">Size {l.size}</span>
                  <div className="qty">
                    <button type="button" onClick={() => setQuantity(l.product_id, l.size, l.quantity - 1)}>−</button>
                    <span>{l.quantity}</span>
                    <button type="button" onClick={() => setQuantity(l.product_id, l.size, l.quantity + 1)}>+</button>
                  </div>
                </div>
                <span>{money(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="bag-total"><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
          {discount > 0 && (
            <div className="bag-total stu-line"><span>🎓 Yale student 10%</span><strong>−{money(discount)}</strong></div>
          )}
          <div className="bag-total grand"><span>Total</span><strong>{money(total)}</strong></div>
          {!user?.student_discount && (
            <p className="muted small">
              🎓 Yale student? <Link to="/login" state={{ from: '/checkout' }}>Log in</Link> or{' '}
              <Link to="/signup" state={{ from: '/checkout' }}>sign up</Link> with your @yale.edu email to take 10% off this order.
            </p>
          )}
          <p className="muted small">Shipping cost is not charged in this class demo.</p>
        </aside>
      </div>
    </div>
  )
}
