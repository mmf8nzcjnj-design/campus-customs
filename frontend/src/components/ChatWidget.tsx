import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { money, useShop } from '../store'
import DanPhoto from './DanPhoto'
import Markdown from './Markdown'

const SUGGESTIONS = [
  'What hoodies do you have?',
  'Gift ideas for my dad',
  'Anything navy under $60?',
  'Do you have this in black?',
]

/** Floating Friendly Bulldog chat. Problem 7: when the agent returns
 * page_results, they go into the shop store and the Products page shows them
 * as cards. Problem 8: every message carries the current page context, and
 * signed-in shoppers' chats are saved server-side. */
export default function ChatWidget() {
  const {
    chatOpen, setChatOpen, chatMessages, setChatMessages, setPageResults, pageResults,
    pageContext, user, resetChat,
  } = useShop()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [nudge, setNudge] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatMessages, busy, chatOpen])

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus()
  }, [chatOpen])

  useEffect(() => {
    const t = setTimeout(() => setNudge(false), 9000)
    return () => clearTimeout(t)
  }, [])

  async function send(text: string) {
    const message = text.trim()
    if (!message || busy) return
    setInput('')
    const history = chatMessages
      .filter((m) => !m.error)
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }))
    setChatMessages((prev) => [...prev, { role: 'user', content: message }])
    setBusy(true)
    try {
      const reply = await api.chat({
        message,
        history,
        page: { ...pageContext, results_title: pageResults?.title ?? null },
      })
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply.content, products: reply.products },
      ])
      if (reply.page_results) {
        setPageResults(reply.page_results)
        if (location.pathname !== '/products') navigate('/products')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: (e as Error).message, error: true },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!chatOpen && (
        <button className="chat-fab" onClick={() => setChatOpen(true)} aria-label="Chat with Friendly Bulldog">
          {nudge && <span className="chat-nudge">Woof! Need help finding something?</span>}
          <DanPhoto size={74} />
          <span className="fab-label">Ask me</span>
        </button>
      )}

      {chatOpen && (
        <section className="chat-panel" aria-label="Shopping assistant chat">
          <header className="chat-head">
            <DanPhoto size={46} talking={busy} />
            <div>
              <strong>Friendly Bulldog <i className="online" /></strong>
              <span>{user ? `Chatting as ${user.first_name || user.name} · history saved` : 'Guest chat · sign in to save it'}</span>
            </div>
            <button className="icon-btn" title="New chat" onClick={resetChat}>↺</button>
            <button className="icon-btn" title="Close" onClick={() => setChatOpen(false)}>✕</button>
          </header>

          <div className="chat-list" ref={listRef}>
            {chatMessages.map((m, i) => (
              <div key={i} className={`msg msg-${m.role}${m.error ? ' msg-error' : ''}`}>
                {m.role === 'assistant' && <DanPhoto size={28} />}
                <div className="bubble">
                  {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
                </div>
                {!!m.products?.length && (
                  <div className="chat-cards">
                    {m.products.map((p) => (
                      <Link key={p.product_id} to={`/products/${p.product_id}`} className="chat-card">
                        <img src={p.image_url} alt="" />
                        <div>
                          <span className="chat-card-name">{p.name}</span>
                          <span className="chat-card-meta">
                            {money(p.price)} ·{' '}
                            {p.total_stock === 0
                              ? 'Sold out'
                              : `${p.sizes_in_stock.join(' ')}`}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="msg msg-assistant">
                <DanPhoto size={28} talking />
                <div className="bubble typing">
                  <span /> <span /> <span />
                </div>
              </div>
            )}
          </div>

          {chatMessages.length <= 2 && !busy && (
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              placeholder="Ask about products, sizes, stock…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send(input)
                }
              }}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send">➤</button>
          </form>
        </section>
      )}
    </>
  )
}
