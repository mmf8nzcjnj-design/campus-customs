import type { Product } from './types'

/** Words that describe the garment, not the design, so they don't count
 * when deciding whether two products share a theme ("Davenport", "hockey"). */
const GENERIC = new Set([
  'yale', 't', 'shirt', 'tee', 'hoodie', 'hood', 'crewneck', 'creqneck', 'sweater', 'fleece',
  'jacket', 'zip', '1', '4', 'full', 'the', 'and', 'of', 'tri', 'blend', 'sports', 'district', 'vit',
])

const words = (p: Product) =>
  new Set(p.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !GENERIC.has(w)))

const overlap = <T,>(a: Set<T>, b: Iterable<T>) => {
  let n = 0
  for (const x of b) if (a.has(x)) n++
  return n
}

/** How alike two designs are: shared theme words count most, then shared tags. */
export function likeness(a: Product, b: Product): number {
  return 3 * overlap(words(a), words(b)) + overlap(new Set(a.search_tags), b.search_tags)
}

export const inStockIn = (p: Product, size: string | null) =>
  size ? p.inventory.some((i) => i.size === size && i.quantity > 0) : p.in_stock

/** Each product is one colorway. For a color swatch on a product page, find
 * the closest matching style (same category, most alike) in that color. */
export function closestInColor(product: Product, family: string, all: Product[]): Product | null {
  let best: Product | null = null
  let bestScore = -1
  for (const p of all) {
    if (p.product_id === product.product_id || p.category !== product.category || p.color_family !== family) continue
    const score = likeness(product, p) * 10 + (p.in_stock ? 5 : 0) + Math.min(p.total_stock, 40) / 40
    if (score > bestScore) {
      best = p
      bestScore = score
    }
  }
  return best
}

/** What goes with what. The shop sells apparel only (no caps or accessories),
 * so "complementary" means a different layer from the same theme. */
const COMPLEMENTS: Record<string, string[]> = {
  Hoodies: ['T-Shirts', 'Long Sleeve', 'Quarter-Zips'],
  Crewnecks: ['T-Shirts', 'Hoodies'],
  'T-Shirts': ['Hoodies', 'Crewnecks', 'Jackets & Fleece'],
  'Quarter-Zips': ['T-Shirts', 'Jackets & Fleece'],
  'Jackets & Fleece': ['Hoodies', 'T-Shirts', 'Quarter-Zips'],
  'Long Sleeve': ['Hoodies', 'Quarter-Zips'],
}

/** "Complete the look" after adding to the bag: mostly complementary layers
 * plus one more of the same kind, all in stock in the shopper's size, never
 * something already in the bag. */
export function recommendFor(
  product: Product,
  size: string | null,
  all: Product[],
  exclude: Set<string>,
  n = 4,
): Product[] {
  const complements = COMPLEMENTS[product.category] ?? []
  const pool = all.filter(
    (p) => p.product_id !== product.product_id && !exclude.has(p.product_id) && inStockIn(p, size),
  )
  const rank = (list: Product[]) =>
    [...list].sort((a, b) => likeness(product, b) - likeness(product, a) || b.total_stock - a.total_stock)
  const complementary = rank(pool.filter((p) => complements.includes(p.category)))
  const sameKind = rank(pool.filter((p) => p.category === product.category))

  const picks: Product[] = []
  const used = new Set<string>()
  const take = (p?: Product) => {
    if (p && !used.has(p.product_id) && picks.length < n) {
      picks.push(p)
      used.add(p.product_id)
    }
  }
  // One from each complementary category first, so it's a real outfit,
  // then the closest one of the same kind, then fill up.
  for (const cat of complements) take(complementary.find((p) => p.category === cat))
  take(sameKind[0])
  for (const p of complementary) take(p)
  for (const p of sameKind) take(p)
  return picks
}
