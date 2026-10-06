import { Link } from 'react-router-dom'
import { money, useShop } from '../store'
import { studentPrice } from '../yale'

export interface CardData {
  product_id: string
  name: string
  price: number
  image_url: string
  tagline: string
  category: string
  total_stock: number
}

/** The one product card used everywhere: Products grid, home page, and the
 * cards the chatbot puts on the page. Every card opens the single-item page. */
export default function ProductCard({ p, badge }: { p: CardData; badge?: string }) {
  const { user } = useShop()
  const low = p.total_stock > 0 && p.total_stock <= 15
  return (
    <Link to={`/products/${p.product_id}`} className="card">
      <div className="card-img">
        <img src={p.image_url} alt={p.name} loading="lazy" />
        {badge && <span className="pill pill-chat">{badge}</span>}
        {p.total_stock === 0 && <span className="pill pill-out">Sold out</span>}
        {low && <span className="pill pill-low">Few left</span>}
      </div>
      <div className="card-body">
        <span className="card-cat">{p.category}</span>
        <h3>{p.name}</h3>
        <p className="card-tag">{p.tagline}</p>
        <span className="card-price">
          {user?.student_discount ? (
            <>
              <s>{money(p.price)}</s> {money(studentPrice(p.price))} <em className="stu">Student</em>
            </>
          ) : (
            money(p.price)
          )}
        </span>
      </div>
    </Link>
  )
}
