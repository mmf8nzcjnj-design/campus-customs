import { useState } from 'react'
import { YALE_FACTS } from '../yale'

const pick = (not?: number) => {
  let i = Math.floor(Math.random() * YALE_FACTS.length)
  if (i === not) i = (i + 1) % YALE_FACTS.length
  return i
}

/** "Did you know?" card with a shuffle button: a random Yale fact each time. */
export function YaleFactCard() {
  const [i, setI] = useState(() => pick())
  return (
    <div className="fact-card">
      <span className="varsity">Did you know?</span>
      <p key={i} className="fact-text">{YALE_FACTS[i]}</p>
      <button className="btn btn-ghost-light" onClick={() => setI(pick(i))}>
        🎲 Another Yale fact
      </button>
    </div>
  )
}

/** A slow-scrolling ribbon of facts between sections. */
export function FactTicker() {
  const items = [...YALE_FACTS, ...YALE_FACTS]
  return (
    <div className="ticker" aria-label="Yale facts">
      <div className="ticker-track">
        {items.map((f, i) => (
          <span key={i}>
            <b>Y</b> {f}
          </span>
        ))}
      </div>
    </div>
  )
}
