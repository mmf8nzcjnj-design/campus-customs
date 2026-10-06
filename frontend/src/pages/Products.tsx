import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DanPhoto from '../components/DanPhoto'
import ProductCard from '../components/ProductCard'
import { usePageContext, useShop } from '../store'

const CATEGORIES = ['All', 'Hoodies', 'Crewnecks', 'T-Shirts', 'Quarter-Zips', 'Jackets & Fleece', 'Long Sleeve']

// Garment color families (db.color_family). Swatch shows the main shade.
const COLORS: { name: string; swatch: string }[] = [
  { name: 'Navy', swatch: '#1f2f56' },
  { name: 'Gray', swatch: '#b9bcc2' },
  { name: 'Cream & White', swatch: '#f4eee0' },
  { name: 'Coral', swatch: '#d98a7e' },
]

export default function Products() {
  const { products, productsLoading, productsError, pageResults, setPageResults } = useShop()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'All'
  const color = params.get('color')

  // Category and color both live in the URL, so they combine and can be linked to.
  const setFilter = (key: 'category' | 'color', value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const [search, setSearch] = useState(() => params.get('q') || '')
  const [sort, setSort] = useState('featured')

  usePageContext({
    path: '/products',
    page_type: 'products',
    category_filter: category === 'All' ? null : category,
    color_filter: color,
    search_text: search || null,
    results_title: pageResults?.title ?? null,
  })

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!color || p.color_family === color) &&
        (!q || `${p.name} ${p.description} ${p.colors.join(' ')} ${p.search_tags.join(' ')}`.toLowerCase().includes(q)),
    )
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [products, category, color, search, sort])

  const colorCount = (name: string) =>
    products.filter((p) => p.color_family === name && (category === 'All' || p.category === category)).length

  return (
    <div className="page">
      {/* Problem 7: results the chatbot found, laid out as real product cards. */}
      {pageResults && (
        <section className="chat-results" aria-live="polite">
          <div className="chat-results-head">
            <DanPhoto size={56} />
            <div>
              <span className="eyebrow">From your chat · “{pageResults.query}”</span>
              <h2>
                {pageResults.title} <small>{pageResults.products.length} found</small>
              </h2>
            </div>
            <button className="btn btn-ghost" onClick={() => setPageResults(null)}>Clear</button>
          </div>
          <div className="grid">
            {pageResults.products.map((p) => (
              <ProductCard key={p.product_id} p={p} badge="Bulldog's pick" />
            ))}
          </div>
        </section>
      )}

      <div className="page-band">
        <div>
          <span className="varsity">The collection</span>
          <h1>{pageResults ? 'All products' : 'Shop all'}</h1>
          <p>Officially licensed Yale apparel, made to order in New Haven.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip${c === category ? ' chip-on' : ''}`}
              onClick={() => setFilter('category', c === 'All' ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <input
            className="search"
            type="search"
            placeholder="Search Bulldog, Davenport, hockey…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="color-filter" role="group" aria-label="Filter by color">
        <span className="label">Color</span>
        {COLORS.map((c) => {
          const on = color === c.name
          const n = colorCount(c.name)
          return (
            <button
              key={c.name}
              className={`color-chip${on ? ' color-chip-on' : ''}`}
              aria-pressed={on}
              disabled={!n && !on}
              onClick={() => setFilter('color', on ? null : c.name)}
              title={on ? `Showing ${c.name}. Click again to clear.` : `Show ${c.name} only`}
            >
              <i style={{ background: c.swatch }} />
              {c.name}
              <small>{n}</small>
            </button>
          )
        })}
        {color && (
          <button className="link-btn small" onClick={() => setFilter('color', null)}>Clear color ✕</button>
        )}
        <span className="muted small result-count">{shown.length} products</span>
      </div>

      {productsLoading && <p className="muted">Loading the shop…</p>}
      {productsError && <p className="error">Couldn't load products: {productsError}</p>}
      {!productsLoading && !shown.length && <p className="muted">No products match these filters. Try clearing one, or ask Friendly Bulldog.</p>}
      <div className="grid">
        {shown.map((p) => <ProductCard key={p.product_id} p={p} />)}
      </div>
    </div>
  )
}
