import DanPhoto from '../components/DanPhoto'
import { usePageContext, useShop } from '../store'

export default function About() {
  usePageContext({ path: '/about', page_type: 'about' })
  const { setChatOpen } = useShop()
  return (
    <div className="page about">
      <section className="about-hero about-photo">
        <span className="eyebrow">About us</span>
        <h1>Bulldog pride, made in New Haven.</h1>
        <p className="lead">
          Yale Bulldog Blue is the officially licensed Yale apparel shop run by Campus Customs. We
          make gear for everyone who bleeds Yale blue: students, alumni, parents, grandparents,
          and the fans who never miss The Game.
        </p>
      </section>

      <section className="about-grid">
        <div className="about-card">
          <h3>Officially licensed</h3>
          <p>
            Every crest, shield and bulldog on our shelves is official Yale merchandise. From
            residential colleges to varsity sports to the graduate schools, wear it with pride.
          </p>
        </div>
        <div className="about-card">
          <h3>Made to order</h3>
          <p>
            Your order is produced just for you, usually within 5–8 business days (a little longer
            at peak times like Commencement and the holidays). Then it ships by UPS with tracking.
          </p>
        </div>
        <div className="about-card">
          <h3>Something for everyone</h3>
          <p>
            Big Yale classics, vintage bulldogs, college crests, sports left-chest hits, and
            Mom, Dad, Grandpa and Cousin designs for the whole Bulldog family.
          </p>
        </div>
        <div className="about-card">
          <h3>Easy returns</h3>
          <p>
            Changed your mind? Send unworn items back with tags attached within 30 days of the
            ship date. Custom-made items are final sale.
          </p>
        </div>
      </section>

      <section className="about-visit">
        <div>
          <h2>Come say hi</h2>
          <p>
            <strong>57 Broadway, New Haven, CT 06511</strong>
            <br />
            (475) 301-4205 · orderdept@campuscustoms.com
          </p>
        </div>
        <div className="about-dan">
          <DanPhoto size={88} />
          <button className="btn btn-primary" onClick={() => setChatOpen(true)}>
            Or ask Friendly Bulldog
          </button>
        </div>
      </section>
    </div>
  )
}
