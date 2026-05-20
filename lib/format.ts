export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function priceRange(min: number, max: number): string {
  if (min === max) return formatPrice(min)
  return `${formatPrice(min)} – ${formatPrice(max)}`
}
