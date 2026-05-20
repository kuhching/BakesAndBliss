// components/CartDrawer.tsx
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, subtotalCents, totalItems } = useCart()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus()
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-ink/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple/10 bg-header shrink-0">
          <h2 className="font-display font-bold text-ink text-lg">
            Your Cart{totalItems > 0 && <span className="text-purple ml-1">({totalItems})</span>}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="text-ink/50 hover:text-ink text-2xl leading-none transition-colors w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
              <p className="font-body font-light text-ink/50">Your cart is empty.</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="text-[11px] font-body text-purple uppercase tracking-widest hover:underline"
              >
                Browse bakes →
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.variantId} className="flex gap-3 items-start">
                {item.imageFilename ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-header">
                    <Image
                      src={`/images/products/${item.imageFilename}`}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-header flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-bold text-ink leading-snug truncate">
                    {item.productName}
                  </p>
                  <p className="font-body font-light text-xs text-ink/60 mt-0.5">
                    {item.variantLabel}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-purple/20 rounded-full overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.variantId, Math.max(item.minQuantity, item.quantity - 1))}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center text-ink hover:bg-surface text-sm transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-body text-xs text-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center text-ink hover:bg-surface text-sm transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-body font-bold text-sm text-ink">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-ink/30 hover:text-ink/70 text-[11px] font-body transition-colors"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-purple/10 px-5 py-4 flex flex-col gap-3 bg-surface shrink-0">
            <div className="flex justify-between items-center">
              <span className="font-body font-light text-sm text-ink/70">Subtotal</span>
              <span className="font-body font-bold text-ink">{formatPrice(subtotalCents)}</span>
            </div>
            <p className="text-[10px] font-body font-light text-ink/40">
              Delivery fee calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full py-3 rounded-full bg-purple text-white text-center font-body text-sm font-bold tracking-[0.15em] uppercase hover:bg-purple/90 transition-colors"
            >
              Checkout →
            </Link>
            <button
              type="button"
              onClick={closeCart}
              className="text-[11px] font-body font-light text-ink/50 uppercase tracking-widest hover:text-ink/70 transition-colors text-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
