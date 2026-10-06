import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { CartLine, ChatMessage, PageContext, PageResults, Product, User } from './types'

const CART_KEY = 'cc_cart'
const CHAT_KEY = 'cc_chat'
const SIZE_KEY = 'cc_size'

export const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    "Woof! I'm **Friendly Bulldog**, your Campus Customs shopping buddy. Ask me about hoodies, sizes, stock, gifts — anything in the shop.",
}

interface Shop {
  products: Product[]
  productsLoading: boolean
  productsError: string | null

  user: User | null
  signIn: (user: User, token: string, isNew?: boolean) => void
  signOut: () => void

  cart: CartLine[]
  cartCount: number
  cartTotal: number
  addToCart: (product: Product, size: string, quantity?: number, showRecs?: boolean) => void
  setQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  /** The size the shopper last added to the bag, pre-selected on other items. */
  preferredSize: string | null
  /** The item just added, for "complete the look" in the bag drawer. */
  lastAdded: { product: Product; size: string } | null

  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  chatMessages: ChatMessage[]
  setChatMessages: (update: (prev: ChatMessage[]) => ChatMessage[]) => void
  pageResults: PageResults | null
  setPageResults: (results: PageResults | null) => void
  pageContext: PageContext
  setPageContext: (ctx: PageContext) => void
  resetChat: () => void
  welcome: string | null
  dismissWelcome: () => void
}

const ShopContext = createContext<Shop | null>(null)

function load<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [cart, setCart] = useState<CartLine[]>(() => load(localStorage, CART_KEY, []))
  const [cartOpen, setCartOpenState] = useState(false)
  const [preferredSize, setPreferredSize] = useState<string | null>(() => localStorage.getItem(SIZE_KEY))
  const [lastAdded, setLastAdded] = useState<{ product: Product; size: string } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>(() =>
    load(sessionStorage, CHAT_KEY, [WELCOME]),
  )
  const [pageResults, setPageResults] = useState<PageResults | null>(null)
  const [welcome, setWelcome] = useState<string | null>(null)
  const [pageContext, setPageContext] = useState<PageContext>({ path: '/', page_type: 'home' })

  useEffect(() => {
    api
      .products()
      .then(setProducts)
      .catch((e: Error) => setProductsError(e.message))
      .finally(() => setProductsLoading(false))
    if (getToken()) {
      api
        .me()
        .then((r) => setUser(r.user))
        .catch(() => setToken(null))
    }
  }, [])

  // Problem 8: a signed-in shopper's saved chat is reloaded from the database.
  useEffect(() => {
    if (!user) return
    api
      .chatHistory()
      .then(({ messages }) => {
        const greeting: ChatMessage = {
          role: 'assistant',
          content: `Welcome back, **${user.first_name || user.name.split(' ')[0]}**! ${
            messages.length ? 'Here is our chat from last time.' : 'What can I help you find today?'
          }`,
        }
        setChatMessagesState([
          ...messages.map((m) => ({ role: m.role, content: m.content, products: m.products })),
          greeting,
        ])
      })
      .catch(() => {})
  }, [user])

  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart])
  useEffect(
    () => sessionStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages.slice(-40))),
    [chatMessages],
  )

  // Called only after a successful login or sign-up (not when a saved token
  // is restored on page load), so the welcome banner shows once per sign-in.
  const signIn = useCallback((u: User, token: string, isNew = false) => {
    setToken(token)
    setUser(u)
    const name = u.first_name || u.name.split(' ')[0]
    setWelcome(
      isNew
        ? `Welcome to the Bulldog family, ${name}! Your account is ready.`
        : `Welcome back, ${name}, to Yale Bulldog Blue!`,
    )
  }, [])

  const dismissWelcome = useCallback(() => setWelcome(null), [])

  useEffect(() => {
    if (!welcome) return
    const t = setTimeout(() => setWelcome(null), 5000)
    return () => clearTimeout(t)
  }, [welcome])

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    setChatMessagesState([WELCOME]) // a guest must not see the last shopper's chat
  }, [])

  const resetChat = useCallback(() => {
    setChatMessagesState([WELCOME])
    if (getToken()) api.clearChatHistory().catch(() => {})
  }, [])

  const setCartOpen = useCallback((open: boolean) => {
    setCartOpenState(open)
    if (!open) setLastAdded(null) // recommendations are for the moment of adding
  }, [])

  const addToCart = useCallback((product: Product, size: string, quantity = 1, showRecs = true) => {
    setPreferredSize(size)
    localStorage.setItem(SIZE_KEY, size)
    if (showRecs) setLastAdded({ product, size })
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === product.product_id && l.size === size)
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity } : l))
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          size,
          quantity,
          image_url: product.image_url,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId: string, size: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => !(l.product_id === productId && l.size === size))
        : prev.map((l) =>
            l.product_id === productId && l.size === size ? { ...l, quantity } : l,
          ),
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])
  const setChatMessages = useCallback(
    (update: (prev: ChatMessage[]) => ChatMessage[]) => setChatMessagesState(update),
    [],
  )

  const value = useMemo<Shop>(
    () => ({
      products,
      productsLoading,
      productsError,
      user,
      signIn,
      signOut,
      cart,
      cartCount: cart.reduce((n, l) => n + l.quantity, 0),
      cartTotal: cart.reduce((n, l) => n + l.quantity * l.price, 0),
      addToCart,
      setQuantity,
      clearCart,
      cartOpen,
      setCartOpen,
      preferredSize,
      lastAdded,
      chatOpen,
      setChatOpen,
      chatMessages,
      setChatMessages,
      pageResults,
      setPageResults,
      pageContext,
      setPageContext,
      resetChat,
      welcome,
      dismissWelcome,
    }),
    [products, productsLoading, productsError, user, signIn, signOut, cart, addToCart,
     setQuantity, clearCart, cartOpen, setCartOpen, preferredSize, lastAdded, chatOpen, chatMessages, setChatMessages, pageResults,
     pageContext, resetChat, welcome, dismissWelcome],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): Shop {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used inside ShopProvider')
  return ctx
}

export const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/** Pages call this so the chatbot knows where the shopper is (Problem 8). */
export function usePageContext(ctx: PageContext) {
  const { setPageContext } = useShop()
  const key = JSON.stringify(ctx)
  useEffect(() => {
    setPageContext(JSON.parse(key) as PageContext)
  }, [key, setPageContext])
}
