import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api'
import type { Suggestion } from '../types'

const IDEA_TYPES = ['Hats & caps', 'Drinkware', 'Accessories', 'Kids & baby', 'Pets', 'Dorm & home', 'Apparel', 'Other']

/** "What should we make next?": shoppers suggest merch and upvote ideas.
 * Saved in the product_suggestions table as a demand signal for the buyers. */
export default function SuggestBox() {
  const [ideas, setIdeas] = useState<Suggestion[]>([])
  const [idea, setIdea] = useState('')
  const [category, setCategory] = useState(IDEA_TYPES[0])
  const [voted, setVoted] = useState<Set<number>>(new Set())
  const [thanks, setThanks] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.suggestions().then((r) => setIdeas(r.suggestions)).catch(() => {})
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (idea.trim().length < 3) return
    try {
      const r = await api.suggest({ idea, category })
      setIdeas(r.suggestions)
      setIdea('')
      setThanks(true)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function vote(id: number) {
    if (voted.has(id)) return
    const r = await api.vote(id)
    setIdeas(r.suggestions)
    setVoted(new Set(voted).add(id))
  }

  return (
    <section className="suggest">
      <div className="suggest-copy">
        <span className="varsity">Your call</span>
        <h2>What should we make next?</h2>
        <p>
          Caps? Mugs? A Pierson pennant? Tell us what's missing. The most-wanted ideas go to our
          New Haven design team.
        </p>
        <form onSubmit={submit} className="suggest-form">
          <input
            value={idea}
            maxLength={120}
            placeholder="e.g. Navy Yale baseball cap"
            onChange={(e) => { setIdea(e.target.value); setThanks(false) }}
            aria-label="Your product idea"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Type">
            {IDEA_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary" disabled={idea.trim().length < 3}>Suggest</button>
        </form>
        {thanks && <p className="hint">✓ Thanks! Your idea is on the board.</p>}
        {error && <p className="error small">{error}</p>}
      </div>
      <div className="suggest-board">
        <h3>Most wanted</h3>
        {ideas.length === 0 ? (
          <p className="muted small">No ideas yet. Be the first!</p>
        ) : (
          <ol>
            {ideas.map((s) => (
              <li key={s.id}>
                <button
                  className={`vote${voted.has(s.id) ? ' voted' : ''}`}
                  onClick={() => vote(s.id)}
                  aria-label={`Upvote ${s.idea}`}
                >
                  ▲<b>{s.votes}</b>
                </button>
                <div>
                  <strong>{s.idea}</strong>
                  <span className="muted">{s.category}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
