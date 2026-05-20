// components/AddToCartSection.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart, CartItem } from '@/lib/cart-context'
import type { ProductVariant, ProductWithDetails } from '@/types/product'
import { formatPrice } from '@/lib/format'

interface Props {
  product: ProductWithDetails
  sortedVariants: ProductVariant[]
}

export function AddToCartSection({ product, sortedVariants }: Props) {
  const { addToCart, openCart } = useCart()

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    sortedVariants.length === 1 ? sortedVariants[0].id : null
  )
  const [quantity, setQuantity] = useState(
    sortedVariants.length === 1 ? sortedVariants[0].min_quantity : 1
  )
  const [added, setAdded] = useState(false)
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedVariant = sortedVariants.find(v => v.id === selectedVariantId) ?? null
  const minQty = selectedVariant?.min_quantity ?? 1

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current)
    }
  }, [])

  function handleSelectVariant(variant: ProductVariant) {
    setSelectedVariantId(variant.id)
    setQuantity(variant.min_quantity)
  }

  function handleAdd() {
    if (!selectedVariant || added) return

    const parts = [selectedVariant.flavor, selectedVariant.size_label].filter(Boolean)
    const variantLabel = parts.join(' · ') || 'Standard'

    const item: CartItem = {
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel,
      priceCents: selectedVariant.price_cents,
      quantity,
      minQuantity: selectedVariant.min_quantity,
      imageFilename: product.images[0]?.filename ?? null,
    }

    addToCart(item)
    openCart()
    setAdded(true)
    addedTimerRef.current = setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Variant selector */}
      <div className="border border-purple/15 rounded-2xl overflow-hidden">
        <div className="bg-header px-4 py-3 border-b border-purple/10">
          <p className="text-[11px] font-body font-light text-ink uppercase tracking-[0.22em]">
            Options &amp; Pricing
          </p>
        </div>
        <div className="divide-y divide-purple/10">
          {sortedVariants.map(v => {
            const isSelected = v.id === selectedVariantId
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelectVariant(v)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-purple/10' : 'bg-white hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                    isSelected ? 'border-purple bg-purple' : 'border-ink/30'
                  }`} />
                  <span className="font-body text-sm text-ink">{v.flavor ?? '—'}</span>
                  {v.size_label && (
                    <span className="font-body font-light text-sm text-ink/60">{v.size_label}</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-body font-bold text-sm text-ink">
                    {formatPrice(v.price_cents)}
                  </span>
                  {v.min_quantity > 1 && (
                    <span className="block text-[10px] font-body font-light text-ink/50">
                      min {v.min_quantity}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quantity stepper — only shown when a variant is selected */}
      {selectedVariant && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest w-6">
            Qty
          </span>
          <div className="flex items-center border border-purple/20 rounded-full overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(minQty, q - 1))}
              aria-label="Decrease quantity"
              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-surface transition-colors text-lg"
            >
              −
            </button>
            <span className="w-8 text-center font-body text-sm text-ink select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              aria-label="Increase quantity"
              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-surface transition-colors text-lg"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedVariant || added}
        className={`w-full py-3.5 rounded-full font-body text-sm font-bold tracking-[0.15em] uppercase transition-all duration-200 ${
          added
            ? 'bg-green-600 text-white cursor-default'
            : selectedVariant
            ? 'bg-purple text-white hover:bg-purple/90 active:scale-[0.98]'
            : 'bg-purple/30 text-white/70 cursor-not-allowed'
        }`}
      >
        {added ? '✓ Added to Cart' : selectedVariant ? 'Add to Cart' : 'Select an option'}
      </button>

    </div>
  )
}
