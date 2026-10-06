import { Link } from 'react-router-dom'
import { useShop } from '../store'
import ProductCard from './ProductCard'

const GAME_DAY = ['2025-yale-vs-harvard-t-shirt', 'football-left-chest-t-shirt', 'tri-blend-sports-football-t-shirt', 'ua-gameday-double-knit-hood']

/** Yale vs. Harvard: the rivalry section, with game-day gear. */
export default function TheGame() {
  const { products } = useShop()
  const gear = GAME_DAY.map((id) => products.find((p) => p.product_id === id)).filter(
    (p): p is NonNullable<typeof p> => !!p,
  )
  return (
    <section className="the-game">
      <div className="game-bg" />
      <div className="game-inner">
        <div className="game-head">
          <span className="varsity game-kicker">Since 1875</span>
          <h2 className="game-title">
            <span className="yale">YALE</span>
            <span className="vs">vs</span>
            <span className="harvard">HARVARD</span>
          </h2>
          <p className="game-lede">
            They just call it <b>The Game</b>. Every November, Bulldogs and Crimson fill the stands for
            college football's most storied rivalry. Wear your blue loud and proud.
          </p>
          <ul className="game-facts">
            <li><b>1875</b><span>first Yale–Harvard football game</span></li>
            <li><b>1914</b><span>Yale Bowl opens, the first bowl stadium in America</span></li>
            <li><b>2004</b><span>Yale pranksters get Harvard fans to hold up "We Suck" cards</span></li>
          </ul>
          <Link to="/products?q=football" className="btn btn-gold">Shop game-day gear</Link>
        </div>
        <div className="game-gear">
          {gear.map((p) => <ProductCard key={p.product_id} p={p} />)}
        </div>
      </div>
    </section>
  )
}
