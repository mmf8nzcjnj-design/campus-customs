import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import BagIcon from '../components/BagIcon'
import ProductCard from '../components/ProductCard'
import { closestInColor, inStockIn } from '../match'
import { money, usePageContext, useShop } from '../store'
import { studentPrice } from '../yale'
import type { Product } from '../types'

const SWATCH: Record<string, string> = {
  navy: '#1f2f56', 'navy blue': '#1f2f56', white: '#ffffff', 'heather gray': '#b9bcc2',
  gray: '#9ea2a8', 'dark heather gray': '#5f6368', 'charcoal gray': '#46494f', black: '#1b1b1b',
  red: '#b3262e', blue: '#2d5fa8', 'royal blue': '#2747a8', yellow: '#e8c23a', gold: '#c9a227',
  green: '#2f6b45', cream: '#f2ead8', maroon: '#6b1f2a', 'light blue': '#9cc3e6', pink: '#e8a1b6',
  orange: '#d9772b', silver: '#c0c4ca', brown: '#6b4b34', purple: '#5d3f8a',
  'light gray': '#cfd2d6', 'heather charcoal gray': '#55595f', 'dark heather charcoal': '#4a4d52',
  ivory: '#f6f1e3', 'dusty coral': '#d98a7e', multicolor: 'conic-gradient(#b3262e, #e8c23a, #2d5fa8, #2f6b45, #b3262e)',
}

export default function ProductDetail() {
  const { id = '' } = useParams()
  const { products, addToCart, setCartOpen, preferredSize, user } = useShop()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [autoSize, setAutoSize] = useState(false)

  usePageContext({ path: `/products/${id}`, page_type: 'product', product_id: id, selected_size: size })

  useEffect(() => {
    setProduct(null)
    setError(null)
    setSize(null)
    setAdded(false)
    window.scrollTo({ top: 0 })
    setAutoSize(false)
    api
      .product(id)
      .then((p) => {
        setProduct(p)
        // Usability: pre-select the size the shopper last put in the bag,
        // if this item has it in stock.
        if (preferredSize && inStockIn(p, preferredSize)) {
          setSize(preferredSize)
          setAutoSize(true)
        }
      })
      .catch((e: Error) => setError(e.message))
    // preferredSize is read once per product, not re-applied when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) {
    return (
      <div className="page">
        <p className="error">{error}</p>
        <Link to="/products">← Back to products</Link>
      </div>
    )
  }
  if (!product) return <div className="page"><p className="muted">Loading…</p></div>

  const chosen = product.inventory.find((i) => i.size === size)
  const familySwatch: Record<string, string> = {
    Navy: '#1f2f56', Gray: '#b9bcc2', 'Cream & White': '#f4eee0', Coral: '#d98a7e',
  }
  const colorOptions = ['Navy', 'Gray', 'Cream & White', 'Coral']
    .map((family) => ({
      family,
      swatch: familySwatch[family],
      current: family === product.color_family,
      match: family === product.color_family ? product : closestInColor(product, family, products),
    }))
    .filter((o) => o.match)
  const preferredSoldOut = !!preferredSize && !inStockIn(product, preferredSize) && !size
  const related = products
    .filter((p) => p.category === product.category && p.product_id !== product.product_id && p.in_stock)
    .slice(0, 4)

  const add = (goToCheckout: boolean) => {
    if (!size) return
    addToCart(product, size)
    if (goToCheckout) navigate('/checkout')
    else {
      setAdded(true)
      setCartOpen(true)
    }
  }

  return (
    <div className="page">
      <Link to="/products" className="back">← All products</Link>
      <div className="detail">
        <div className="detail-img">
          <img src={product.image_url} alt={product.name} />
        </div>
        <div className="detail-info">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-tag">{product.tagline}</p>
          <div className="detail-price">
            {money(product.price)}
            {user?.student_discount ? (
              <span className="stu-price">🎓 {money(studentPrice(product.price))} with your student 10%</span>
            ) : (
              <Link to="/signup" className="stu-price stu-link">🎓 Yale student? {money(studentPrice(product.price))} with your @yale.edu account</Link>
            )}
          </div>
          <p>{product.description}</p>

          {/* Each product is one colorway (colors[0] = garment, rest = print).
              Other swatches open the closest matching style in that color. */}
          {product.garment_color && (
            <div className="colors">
              <span className="label">
                Color: <em className="plain">{product.garment_color}</em>
                {product.print_colors.length > 0 && (
                  <span className="muted small"> · design in {product.print_colors.join(', ')}</span>
                )}
              </span>
              <div className="color-row">
                {colorOptions.map((opt) =>
                  opt.current ? (
                    <span key={opt.family} className="swatch swatch-on" title={`${opt.family} (this item)`}>
                      <i style={{ background: SWATCH[product.garment_color.toLowerCase()] || opt.swatch }} />
                    </span>
                  ) : (
                    <button
                      key={opt.family}
                      className="swatch"
                      title={`${opt.family}: ${opt.match!.name}`}
                      aria-label={`See this style in ${opt.family}: ${opt.match!.name}`}
                      onClick={() => navigate(`/products/${opt.match!.product_id}`)}
                    >
                      <i style={{ background: opt.swatch }} />
                    </button>
                  ),
                )}
                {colorOptions.length > 1 && (
                  <span className="muted small">Tap a color to see the closest {product.category.toLowerCase()} in it.</span>
                )}
              </div>
            </div>
          )}

          <div className="sizes">
            <span className="label">
              Size {chosen && <em className={chosen.quantity <= 5 ? 'warn' : ''}>· {chosen.quantity} in stock</em>}
            </span>
            <div className="size-grid">
              {product.inventory.map((i) => (
                <button
                  key={i.size}
                  className={`size${size === i.size ? ' size-on' : ''}`}
                  disabled={i.quantity === 0}
                  onClick={() => {
                    setSize(i.size)
                    setAutoSize(false)
                  }}
                  title={i.quantity === 0 ? 'Sold out' : `${i.quantity} in stock`}
                >
                  {i.size}
                  <small>{i.quantity === 0 ? 'Sold out' : i.quantity <= 5 ? `${i.quantity} left` : 'In stock'}</small>
                </button>
              ))}
            </div>
            {autoSize && size === preferredSize && (
              <p className="hint">✓ We picked <strong>{size}</strong>, the size in your bag. Tap another to change.</p>
            )}
            {preferredSoldOut && (
              <p className="hint hint-warn">Your size <strong>{preferredSize}</strong> is sold out in this one. Pick another, or tap a color for a similar style.</p>
            )}
            <p className="muted small">{product.total_stock} units in stock across all sizes.</p>
          </div>

          <div className="buy">
            <button className="btn btn-primary" disabled={!size} onClick={() => add(true)}>
              {size ? 'Buy now' : 'Pick a size'}
            </button>
            <button className="btn btn-ghost" disabled={!size} onClick={() => add(false)}>
              <BagIcon size={18} /> {added ? 'Added ✓' : 'Add to bag'}
            </button>
          </div>

          {product.delivery && (
            <div className="delivery">
              <strong>🚚 Estimated delivery</strong>
              <span>{product.delivery.text}</span>
            </div>
          )}
          <p className="muted small">Returns accepted within 30 days of shipping on unworn items with tags attached.</p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>More {product.category.toLowerCase()}</h2></div>
          <div className="grid">{related.map((p) => <ProductCard key={p.product_id} p={p} />)}</div>
        </section>
      )}
    </div>
  )
}
