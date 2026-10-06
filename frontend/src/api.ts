import type { Product, User, CartLine, ChatReply, HistoryMessage, PageContext, Suggestion } from './types'

const TOKEN_KEY = 'cc_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body.detail) detail = body.detail
    } catch {
      /* non-JSON error */
    }
    throw new Error(detail)
  }
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

export const api = {
  products: () => request<Product[]>('/api/products'),
  product: (id: string) => request<Product>(`/api/products/${id}`),

  signup: (data: {
    first_name: string
    last_name: string
    email: string
    password: string
    confirm_password: string
  }) =>
    request<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: User }>('/api/auth/me'),

  checkout: (data: {
    items: { product_id: string; size: string; quantity: number }[]
    contact_name: string
    email: string
    address: string
  }) =>
    request<{ order_id: number; confirmation: string; subtotal: number; discount: number; total: number }>(
      '/api/checkout',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  chat: (data: {
    message: string
    history: { role: string; content: string }[]
    page: PageContext
  }) =>
    request<ChatReply>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  suggestions: () => request<{ suggestions: Suggestion[] }>('/api/suggestions'),
  suggest: (data: { idea: string; category: string }) =>
    request<{ suggestions: Suggestion[] }>('/api/suggestions', { method: 'POST', body: JSON.stringify(data) }),
  vote: (id: number) =>
    request<{ suggestions: Suggestion[] }>(`/api/suggestions/${id}/vote`, { method: 'POST' }),

  chatHistory: () => request<{ messages: HistoryMessage[] }>('/api/chat/history'),
  clearChatHistory: () => request<null>('/api/chat/history', { method: 'DELETE' }),
}

export type { CartLine }
