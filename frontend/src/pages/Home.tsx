import { useState } from 'react'
import { Link } from 'react-router-dom'
import DanPhoto from '../components/DanPhoto'
import ProductCard from '../components/ProductCard'
import StudentBanner from '../components/StudentBanner'
import SuggestBox from '../components/SuggestBox'
import TheGame from '../components/TheGame'
import { FactTicker, YaleFactCard } from '../components/YaleFact'
import { money, usePageContext, useShop } from '../store'

const CATEGORY_BLURBS: Record<string, string> = {
  Hoodies: 'Casual comfort, classic Bulldog pride',
  Crewnecks: 'The sweatshirt you live in',
  'T-Shirts': 'Game day to lecture hall',
  'Quarter-Zips': 'Polished layers for crisp mornings',
  'Jackets & Fleece': 'Shop comfy layers',
  'Long Sleeve': 'Long sleeves we love',
}

const COVERS: Record<string, string> = {
  Hoodies: 'district-vit-hoodie-vintage-bulldog',
  Crewnecks: 'davenport-college-crewneck',
  'T-Shirts': 'boola-boola-t-shirt',
  'Quarter-Zips': 'benjamin-franklin-1-4-zip',
  'Jackets & Fleece': 'benjamin-franklin-fleece-jacket',
  'Long Sleeve': '',
}

const FEATURED = [
  'basic-hoodie-big-yale',
  'district-vit-hoodie-vintage-bulldog',
  'davenport-college-crewneck',
  'champion-full-zip-hood',
]

export default function Home() {
  usePageContext({ path: '/', page_type: 'home' })
  const { products, setChatOpen } = useShop()
  const find = (id: string) => products.find((p) => p.product_id === id)
  const cover = (cat: string) => find(COVERS[cat]) || products.find((p) => p.category === cat)
  const featured = FEATURED.map(find).filter((p): p is NonNullable<typeof p> => !!p)
  const count = (cat: string) => products.filter((p) => p.category === cat).length

  // Hero people: if an AI-generated photo of students in Yale gear is saved
  // as public/hero-students.jpg, it is shown. Otherwise the floating product cards are.
  const [heroPhoto, setHeroPhoto] = useState(true)
  const floating = ['basic-hoodie-big-yale', 'davenport-college-crewneck', 'boola-boola-t-shirt']
    .map(find)
    .filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <>
      {/* 1. Hero on Old Campus */}
      <section className="hero-x">
        <div className="hero-photo-bg" />
        <div className="hero-x-inner">
          <div className="hero-x-copy">
            <span className="varsity hero-kicker">Officially licensed · New Haven, CT</span>
            <h1>
              Wear your <em>Bulldog</em> pride.
            </h1>
            <p>
              Hoodies, crewnecks, tees and quarter-zips for students, alumni, families and every
              Bulldog fan in between. Made to order, just steps from Old Campus.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-gold">Shop the collection</Link>
              <button className="btn btn-glass" onClick={() => setChatOpen(true)}>
                <DanPhoto size={26} /> Ask Friendly Bulldog
              </button>
            </div>
            <ul className="hero-facts">
              <li><strong>102</strong> designs</li>
              <li><strong>11 + 11</strong> colleges &amp; schools</li>
              <li><strong>XS–XXL</strong> in every style</li>
            </ul>
          </div>
          <div className="hero-x-art">
            {heroPhoto ? (
              <img
                className="hero-people"
                src="/hero-students.jpg"
                alt="Yale students wearing Campus Customs gear"
                onError={() => setHeroPhoto(false)}
              />
            ) : (
              floating.map((p, i) => (
                <Link key={p.product_id} to={`/products/${p.product_id}`} className={`float-card fc-${i}`}>
                  <img src={p.image_url} alt={p.name} />
                  <div>
                    <span>{p.name}</span>
                    <b>{money(p.price)}</b>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <div className="hero-scroll">↓ Scroll for The Game, Handsome Dan &amp; more</div>
      </section>

      {/* 2. Student discount: the banner the brief asked to make evident */}
      <div className="wrap">
        <StudentBanner />
      </div>

      <FactTicker />

      {/* 3. Categories */}
      <section className="section">
        <div className="section-head">
          <div>
            <span className="varsity">Shop by category</span>
            <h2>Find your layer</h2>
          </div>
          <Link to="/products">See all 102 →</Link>
        </div>
        <div className="cat-grid-x">
          {Object.keys(CATEGORY_BLURBS).map((cat) => (
            <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="cat-x">
              {cover(cat) && <img src={cover(cat)!.image_url} alt="" loading="lazy" />}
              <div className="cat-x-label">
                <strong>{cat}</strong>
                <span>{CATEGORY_BLURBS[cat]}</span>
                <small>{count(cat)} styles →</small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Yale vs Harvard */}
      <TheGame />

      {/* 5. Handsome Dan + random facts */}
      <section className="section dan-section">
        <div className="dan-photo-card">
          <img src="/photos/handsome-dan.jpg" alt="Handsome Dan, Yale's bulldog mascot, wearing a blue Y bandana" />
          <span className="dan-caption">Handsome Dan, Yale's real-life bulldog</span>
        </div>
        <div className="dan-copy">
          <span className="varsity">Meet the mascot</span>
          <h2>Bulldog spirit, since 1889.</h2>
          <p>
            Handsome Dan, Yale's bulldog, is often called America's first live college mascot. Our
            shopping assistant, <b>Friendly Bulldog</b>, is named in his spirit. Ask it about sizes,
            stock, or a gift for your roommate's mom, and it checks the shop's real inventory.
          </p>
          <button className="btn btn-primary" onClick={() => setChatOpen(true)}>
            <DanPhoto size={26} /> Chat with Friendly Bulldog
          </button>
          <YaleFactCard />
        </div>
      </section>

      {/* 6. Fan favorites */}
      <section className="section">
        <div className="section-head">
          <div>
            <span className="varsity">Fan favorites</span>
            <h2>The ones everyone reaches for</h2>
          </div>
        </div>
        <div className="grid">
          {featured.map((p) => <ProductCard key={p.product_id} p={p} />)}
        </div>
      </section>

      {/* 7. Shopper suggestions */}
      <div className="wrap">
        <SuggestBox />
      </div>
    </>
  )
}
