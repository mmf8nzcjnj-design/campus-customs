export interface InventoryRow {
  size: string
  quantity: number
}

export interface Product {
  product_id: string
  name: string
  garment_type: string
  category: string
  description: string
  tagline: string
  colors: string[]
  garment_color: string
  color_family: string
  print_colors: string[]
  search_tags: string[]
  image_url: string
  price: number
  inventory: InventoryRow[]
  total_stock: number
  in_stock: boolean
  delivery?: {
    business_days: [number, number]
    earliest: string
    latest: string
    text: string
  }
}

export interface User {
  id: number
  name: string
  first_name: string | null
  last_name: string | null
  email: string
  /** Signed in with @yale.edu: 10% off, applied at checkout (Problem 10). */
  student_discount: boolean
}

export interface Suggestion {
  id: number
  idea: string
  category: string
  votes: number
}

export interface CartLine {
  product_id: string
  name: string
  price: number
  size: string
  quantity: number
  image_url: string
}

/** A product card built by the backend from the database (models.ProductCard). */
export interface ChatProductCard {
  product_id: string
  name: string
  price: number
  image_url: string
  tagline: string
  category: string
  total_stock: number
  sizes_in_stock: string[]
}

/** Search results the chat sends to the page (Problem 7). */
export interface PageResults {
  title: string
  query: string
  products: ChatProductCard[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ChatProductCard[]
  error?: boolean
}

export interface ChatReply {
  role: 'assistant'
  content: string
  products: ChatProductCard[]
  page_results?: PageResults
  tools_used: string[]
}

/** What the website tells the chatbot about the current page (Problem 8). */
export interface PageContext {
  path: string
  page_type: 'home' | 'products' | 'product' | 'about' | 'login' | 'signup' | 'checkout' | 'other'
  product_id?: string | null
  selected_size?: string | null
  category_filter?: string | null
  color_filter?: string | null
  search_text?: string | null
  results_title?: string | null
}

export interface HistoryMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  products: ChatProductCard[]
  created_at: string
}
