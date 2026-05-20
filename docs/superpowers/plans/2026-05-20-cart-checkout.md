# Cart & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a localStorage cart with a slide-in drawer, variant selection on the product detail page, and a checkout form that saves orders to PostgreSQL.

**Architecture:** Cart state lives in React Context synced to `localStorage` (client-only). Server components are untouched except where a client component is embedded. A server action (in `app/checkout/actions.ts`) handles validation, price re-verification from DB, and writing the order.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, PostgreSQL via `pg`. No test framework — verification via `next dev` browser checks. Server actions use `useActionState` pattern.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `lib/cart-context.tsx` | **Create** | `CartItem` type, `CartProvider`, `useCart` hook |
| `lib/delivery-fee.ts` | **Create** | `calculateDeliveryFee` pure function |
| `components/CartHeaderButton.tsx` | **Create** | Header cart icon button + item-count badge |
| `components/CartDrawer.tsx` | **Create** | Slide-in cart drawer |
| `components/AddToCartSection.tsx` | **Create** | Variant selector + Add to Cart (client) |
| `app/layout.tsx` | **Modify** | Wrap with `CartProvider`, add `CartHeaderButton` + `CartDrawer` |
| `app/products/[slug]/page.tsx` | **Modify** | Embed `<AddToCartSection>`, remove static variants table |
| `app/checkout/actions.ts` | **Create** | `placeOrder` server action |
| `app/checkout/page.tsx` | **Create** | Checkout form (client component) |
| `app/checkout/confirmation/page.tsx` | **Create** | Order confirmation (server component) |

---

## Task 1: Cart Context

**Files:**
- Create: `lib/cart-context.tsx`

- [ ] **Step 1: Create the file**

```tsx
// lib/cart-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantLabel: string
  priceCents: number
  quantity: number
  imageFilename: string | null
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (variantId: string) => void
  updateQuantity: (variantId: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  subtotalCents: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'bb_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore corrupt storage */ }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addToCart(item: CartItem) {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === item.variantId)
      if (existing) {
        return prev.map(i =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  function removeFromCart(variantId: string) {
    setItems(prev => prev.filter(i => i.variantId !== variantId))
  }

  function updateQuantity(variantId: string, qty: number) {
    if (qty < 1) return
    setItems(prev =>
      prev.map(i => i.variantId === variantId ? { ...i, quantity: qty } : i)
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, subtotalCents,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add lib/cart-context.tsx
git commit -m "feat: add cart context with localStorage sync"
```

---

## Task 2: Delivery Fee Logic

**Files:**
- Create: `lib/delivery-fee.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/delivery-fee.ts

export type ProductType = 'cookies' | 'cakes'
export type DeliveryMode = 'self-collect' | 'delivery'

export interface DeliveryFeeParams {
  mode: DeliveryMode
  subtotalCents: number
  productType?: ProductType
  hotelsOrPeak?: boolean
  eveOrHoliday?: boolean
  specificTime?: boolean
}

export interface DeliveryFeeResult {
  baseCents: number
  surcharges: { label: string; cents: number }[]
  totalCents: number
  isFoc: boolean
}

export function calculateDeliveryFee(params: DeliveryFeeParams): DeliveryFeeResult {
  const { mode, subtotalCents, productType, hotelsOrPeak, eveOrHoliday, specificTime } = params

  if (mode === 'self-collect') {
    return { baseCents: 0, surcharges: [], totalCents: 0, isFoc: false }
  }

  const surcharges: { label: string; cents: number }[] = []
  if (hotelsOrPeak) surcharges.push({ label: 'Hotels / Hospitals / Peak', cents: 500 })
  if (eveOrHoliday) surcharges.push({ label: 'Eve or Public Holiday', cents: 500 })
  if (specificTime) surcharges.push({ label: 'Specific time request', cents: 1000 })

  const surchargeTotalCents = surcharges.reduce((s, x) => s + x.cents, 0)
  const isFoc = subtotalCents >= 20000
  const baseCents = isFoc ? 0 : (productType === 'cookies' ? 1500 : 2000)

  return { baseCents, surcharges, totalCents: baseCents + surchargeTotalCents, isFoc }
}
```

- [ ] **Step 2: Manually verify logic cases in your head**

| Scenario | Expected |
|---|---|
| Self-collect, any subtotal | `{ baseCents: 0, totalCents: 0 }` |
| Delivery, cookies, $50 subtotal | `{ baseCents: 1500, totalCents: 1500 }` |
| Delivery, cakes, $50 subtotal | `{ baseCents: 2000, totalCents: 2000 }` |
| Delivery, cakes, $200+ subtotal | `{ baseCents: 0, isFoc: true, totalCents: 0 }` |
| Delivery, cakes, $200+, hotels + specific time | `{ baseCents: 0, totalCents: 1500, isFoc: true }` |
| Delivery, cookies, $50, eve + hotels | `{ baseCents: 1500, totalCents: 2500 }` |

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add lib/delivery-fee.ts
git commit -m "feat: add delivery fee calculation logic"
```

---

## Task 3: Cart Header Button

**Files:**
- Create: `components/CartHeaderButton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/CartHeaderButton.tsx
'use client'

import { useCart } from '@/lib/cart-context'

export function CartHeaderButton() {
  const { totalItems, openCart } = useCart()

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
      className="relative flex items-center gap-1.5 text-ink font-body text-xs font-light tracking-widest uppercase hover:text-purple transition-colors duration-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/icons/shopping-cart.png" alt="" width={15} height={15} />
      Cart
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[16px] h-4 bg-purple text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add components/CartHeaderButton.tsx
git commit -m "feat: add cart header button with item count badge"
```

---

## Task 4: Cart Drawer

**Files:**
- Create: `components/CartDrawer.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/CartDrawer.tsx
'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/products'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, subtotalCents, totalItems } = useCart()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
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
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add components/CartDrawer.tsx
git commit -m "feat: add slide-in cart drawer"
```

---

## Task 5: Update Layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/CartDrawer";
import { CartHeaderButton } from "@/components/CartHeaderButton";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bakes and Bliss SG",
  description: "Freshly baked to order",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-surface text-ink font-body">
        <CartProvider>

          {/* ── Header ── */}
          <header className="bg-header sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

              <Link href="/" className="flex items-center gap-3 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo/logo.jpg"
                  alt="Bakes and Bliss SG logo"
                  width={40}
                  height={40}
                  className="rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="font-display text-base sm:text-lg font-bold text-ink tracking-tight">
                  Bakes and Bliss SG
                </span>
              </Link>

              <nav className="flex items-center gap-5 sm:gap-6">
                <Link
                  href="/products"
                  className="text-ink font-body text-xs font-light tracking-widest uppercase hover:text-purple transition-colors duration-200"
                >
                  Shop
                </Link>
                <CartHeaderButton />
                <Link
                  href="/admin/products"
                  className="text-ink/40 font-body text-xs font-light tracking-widest uppercase hover:text-ink/60 transition-colors duration-200"
                >
                  Admin
                </Link>
              </nav>

            </div>
          </header>

          <CartDrawer />
          <div className="flex-1">{children}</div>

          {/* ── Footer ── */}
          <footer className="border-t border-purple/10 bg-surface mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
              <div className="flex items-center justify-between gap-4">

                <div className="shrink-0">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="block hover:opacity-70 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/icons/instagram.svg" alt="Instagram" width={22} height={22} />
                  </a>
                </div>

                <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo/logo.jpg" alt="" width={22} height={22} className="rounded-full object-cover" />
                    <span className="font-body text-xs text-ink tracking-wide">
                      © 2026 Bakes and Bliss SG 🇸🇬 UEN 53279533D
                    </span>
                  </div>
                  <p className="text-[10px] font-body font-light text-ink/50">
                    Designed by{" "}
                    <a
                      href="https://kuhching.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold font-medium hover:opacity-80 transition-opacity"
                    >
                      kuhching.app
                    </a>
                  </p>
                </div>

                <div className="shrink-0 w-5.5" aria-hidden="true" />

              </div>
            </div>
          </footer>

        </CartProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Start dev server and verify the header renders with "Cart" button**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npm run dev
```

Open http://localhost:3000. The header should show: logo | Shop | Cart | Admin. Clicking "Cart" should open/close the empty drawer.

- [ ] **Step 3: Stop dev server, commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add app/layout.tsx
git commit -m "feat: integrate cart provider, drawer and header button into layout"
```

---

## Task 6: Add to Cart Section

**Files:**
- Create: `components/AddToCartSection.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/AddToCartSection.tsx
'use client'

import { useState } from 'react'
import { useCart, CartItem } from '@/lib/cart-context'
import type { ProductVariant, ProductWithDetails } from '@/types/product'
import { formatPrice } from '@/lib/products'

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

  const selectedVariant = sortedVariants.find(v => v.id === selectedVariantId) ?? null
  const minQty = selectedVariant?.min_quantity ?? 1

  function handleSelectVariant(variant: ProductVariant) {
    setSelectedVariantId(variant.id)
    setQuantity(variant.min_quantity)
  }

  function handleAdd() {
    if (!selectedVariant) return

    const parts = [selectedVariant.flavor, selectedVariant.size_label].filter(Boolean)
    const variantLabel = parts.join(' · ') || 'Standard'

    const item: CartItem = {
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel,
      priceCents: selectedVariant.price_cents,
      quantity,
      imageFilename: product.images[0]?.filename ?? null,
    }

    addToCart(item)
    openCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
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
        disabled={!selectedVariant}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add components/AddToCartSection.tsx
git commit -m "feat: add variant selector and add-to-cart component"
```

---

## Task 7: Update Product Detail Page

**Files:**
- Modify: `app/products/[slug]/page.tsx`

- [ ] **Step 1: Replace the entire file** (keeps server component, embeds client AddToCartSection)

```tsx
// app/products/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, formatPrice } from '@/lib/products';
import { AddToCartSection } from '@/components/AddToCartSection';

const MAX_GALLERY_IMAGES = 4;

export default async function ProductDetailPage({
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const product = await getProductById(id);
  if (!product) notFound();

  const sortedVariants = [...product.variants].sort((a, b) => a.display_order - b.display_order);

  const seenFilenames = new Set<string>();
  const uniqueImages = product.images.filter((img) => {
    if (seenFilenames.has(img.filename)) return false;
    seenFilenames.add(img.filename);
    return true;
  });
  const galleryImages = uniqueImages.slice(0, MAX_GALLERY_IMAGES);
  const extraCount = uniqueImages.length - galleryImages.length;

  const sizes = [...new Set(sortedVariants.map((v) => v.size_label).filter(Boolean))] as string[];
  const flavors = [...new Set(sortedVariants.map((v) => v.flavor).filter(Boolean))] as string[];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-[11px] font-body font-light text-purple hover:text-ink transition-colors tracking-[0.2em] uppercase mb-8"
      >
        ← Back to bakes
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">

        {/* Images */}
        <div className="flex flex-col gap-3">
          {galleryImages.length > 0 ? (
            <>
              {galleryImages.map((img, i) => (
                <div
                  key={img.id}
                  className={`relative overflow-hidden rounded-2xl bg-header ${
                    i === 0 ? 'aspect-square' : 'aspect-4/3'
                  }`}
                >
                  <Image
                    src={`/images/products/${img.filename}`}
                    alt={img.alt_text ?? product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={i === 0}
                  />
                </div>
              ))}
              {extraCount > 0 && (
                <p className="text-[11px] font-body font-light text-ink/50 text-center py-1">
                  +{extraCount} more photo{extraCount !== 1 ? 's' : ''}
                </p>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-2xl bg-header flex items-center justify-center text-ink/40 font-body text-sm">
              No image available
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-[11px] font-body font-light text-purple uppercase tracking-[0.25em] mb-3">
            {product.category_name}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight mb-4">
            {product.name}
          </h1>

          {/* Size + flavour summary chips */}
          {(sizes.length > 0 || flavors.length > 0) && (
            <div className="flex flex-col gap-2 mb-6">
              {sizes.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-body text-ink/50 uppercase tracking-widest w-14 shrink-0">
                    Sizes
                  </span>
                  {sizes.map((s) => (
                    <span key={s} className="text-[11px] px-3 py-1 rounded-full bg-surface border border-purple/20 text-ink font-body font-light">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {flavors.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-body text-ink/50 uppercase tracking-widest w-14 shrink-0">
                    Flavours
                  </span>
                  {flavors.slice(0, 6).map((f) => (
                    <span key={f} className="text-[11px] px-3 py-1 rounded-full bg-surface border border-purple/20 text-ink font-body font-light">
                      {f}
                    </span>
                  ))}
                  {flavors.length > 6 && (
                    <span className="text-[11px] text-ink/50 font-body">+{flavors.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
          )}

          {product.description && (
            <p className="font-body font-light text-ink/80 leading-relaxed mb-6 text-sm sm:text-base">
              {product.description}
            </p>
          )}

          {/* Interactive variant selector + Add to Cart */}
          <AddToCartSection product={product} sortedVariants={sortedVariants} />

          <p className="text-[11px] font-body font-light text-ink/40 tracking-wide mt-4">
            Page {product.source_page} · {sortedVariants.length} option{sortedVariants.length !== 1 ? 's' : ''}
          </p>
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 2: Start dev server and verify the product detail page**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npm run dev
```

Open http://localhost:3000/products, click any product. Verify:
- Variant rows appear with radio dots
- Selecting a variant shows the quantity stepper
- "Add to Cart" button turns active (purple) when a variant is selected
- Clicking "Add to Cart" opens the drawer with the item shown
- Button briefly shows "✓ Added to Cart"

- [ ] **Step 3: Stop dev server, commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add app/products/\[slug\]/page.tsx
git commit -m "feat: replace static variants table with interactive AddToCartSection"
```

---

## Task 8: Server Action

**Files:**
- Create: `app/checkout/actions.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /Users/taiga/Documents/BakesAndBliss/web/app/checkout
```

```ts
// app/checkout/actions.ts
'use server'

import pool from '@/lib/db'
import { calculateDeliveryFee, DeliveryMode, ProductType } from '@/lib/delivery-fee'

interface OrderItem {
  variantId: string
  quantity: number
}

interface PlaceOrderInput {
  name: string
  email: string
  phone: string
  mode: DeliveryMode
  address: string | null
  productType: ProductType | null
  hotelsOrPeak: boolean
  eveOrHoliday: boolean
  specificTime: boolean
  specificTimeValue: string | null
  date: string
  notes: string | null
  items: OrderItem[]
}

interface PlaceOrderResult {
  orderId?: string
  error?: string
}

export async function placeOrder(
  _prevState: PlaceOrderResult | null,
  formData: FormData
): Promise<PlaceOrderResult> {
  // Parse form data
  const rawItems = formData.get('items')
  if (!rawItems) return { error: 'Cart is empty.' }

  let items: OrderItem[]
  try {
    items = JSON.parse(rawItems as string) as OrderItem[]
  } catch {
    return { error: 'Invalid cart data.' }
  }

  if (!items.length) return { error: 'Cart is empty.' }

  const input: PlaceOrderInput = {
    name: (formData.get('name') as string | null)?.trim() ?? '',
    email: (formData.get('email') as string | null)?.trim() ?? '',
    phone: (formData.get('phone') as string | null)?.trim() ?? '',
    mode: (formData.get('mode') as DeliveryMode) ?? 'self-collect',
    address: (formData.get('address') as string | null)?.trim() || null,
    productType: (formData.get('productType') as ProductType | null) || null,
    hotelsOrPeak: formData.get('hotelsOrPeak') === 'true',
    eveOrHoliday: formData.get('eveOrHoliday') === 'true',
    specificTime: formData.get('specificTime') === 'true',
    specificTimeValue: (formData.get('specificTimeValue') as string | null)?.trim() || null,
    date: (formData.get('date') as string | null) ?? '',
    notes: (formData.get('notes') as string | null)?.trim() || null,
    items,
  }

  // Server-side validation
  if (!input.name) return { error: 'Name is required.' }
  if (!input.email || !input.email.includes('@')) return { error: 'A valid email is required.' }
  if (!input.phone) return { error: 'Phone number is required.' }
  if (!input.date) return { error: 'Please select a date.' }
  if (input.mode === 'delivery' && !input.address) return { error: 'Delivery address is required.' }
  if (input.mode === 'delivery' && input.specificTime && !input.specificTimeValue) {
    return { error: 'Please specify the requested time.' }
  }

  // Re-fetch prices from DB — never trust client
  const variantIds = input.items.map(i => i.variantId)
  const { rows: variants } = await pool.query<{ id: string; price_cents: number }>(
    `SELECT id, price_cents FROM product_variants WHERE id = ANY($1::uuid[])`,
    [variantIds]
  )

  if (variants.length !== variantIds.length) {
    return { error: 'One or more items are no longer available.' }
  }

  const priceMap = new Map(variants.map(v => [v.id, v.price_cents]))

  let subtotalCents = 0
  for (const item of input.items) {
    subtotalCents += priceMap.get(item.variantId)! * item.quantity
  }

  // Recalculate delivery fee server-side
  const fee = calculateDeliveryFee({
    mode: input.mode,
    subtotalCents,
    productType: input.productType ?? undefined,
    hotelsOrPeak: input.hotelsOrPeak,
    eveOrHoliday: input.eveOrHoliday,
    specificTime: input.specificTime,
  })

  const totalCents = subtotalCents + fee.totalCents

  // Build notes string
  const deliveryNote = input.mode === 'delivery'
    ? [
        `Delivery to: ${input.address}`,
        input.hotelsOrPeak ? 'Hotels/Hospitals/Peak (+$5)' : '',
        input.eveOrHoliday ? 'Eve/PH (+$5)' : '',
        input.specificTime ? `Specific time: ${input.specificTimeValue} (+$10)` : '',
      ].filter(Boolean).join('. ')
    : 'Self-collect at Yishun Ring Road (2–6pm).'

  const fullNotes = [deliveryNote, input.notes].filter(Boolean).join('\n')

  // Upsert customer by email
  const { rows: customerRows } = await pool.query<{ id: string }>(
    `INSERT INTO customers (name, email, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, phone = EXCLUDED.phone, updated_at = NOW()
     RETURNING id`,
    [input.name, input.email, input.phone]
  )
  const customerId = customerRows[0].id

  // Insert order
  const { rows: orderRows } = await pool.query<{ id: string }>(
    `INSERT INTO orders
       (customer_id, status, subtotal_cents, discount_cents, total_cents, notes, delivery_date)
     VALUES ($1, 'pending', $2, 0, $3, $4, $5)
     RETURNING id`,
    [customerId, subtotalCents, totalCents, fullNotes, input.date]
  )
  const orderId = orderRows[0].id

  // Insert order items
  for (const item of input.items) {
    const unitPrice = priceMap.get(item.variantId)!
    await pool.query(
      `INSERT INTO order_items (order_id, product_variant_id, quantity, unit_price_cents, line_total_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, item.variantId, item.quantity, unitPrice, unitPrice * item.quantity]
    )
  }

  return { orderId }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add app/checkout/actions.ts
git commit -m "feat: add placeOrder server action with DB price verification"
```

---

## Task 9: Checkout Page

**Files:**
- Create: `app/checkout/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/checkout/page.tsx
'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { calculateDeliveryFee, DeliveryMode, ProductType } from '@/lib/delivery-fee'
import { formatPrice } from '@/lib/products'
import { placeOrder } from './actions'

// Thin wrapper so useActionState gets the right signature
const initialState = null

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest block mb-1">
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-purple/20 rounded-xl px-4 py-2.5 font-body text-sm text-ink bg-white focus:outline-none focus:border-purple/60 transition-colors"
    />
  )
}

export default function CheckoutPage() {
  const { items, subtotalCents, clearCart } = useCart()
  const router = useRouter()

  // Redirect to products if cart is empty
  useEffect(() => {
    if (items.length === 0) router.replace('/products')
  }, [items.length, router])

  const formRef = useRef<HTMLFormElement>(null)

  // Delivery state (controlled, for live fee calculation)
  const [mode, setMode] = useClientState<DeliveryMode>('self-collect')
  const [productType, setProductType] = useClientState<ProductType>('cakes')
  const [hotelsOrPeak, setHotelsOrPeak] = useClientState(false)
  const [eveOrHoliday, setEveOrHoliday] = useClientState(false)
  const [specificTime, setSpecificTime] = useClientState(false)

  const fee = calculateDeliveryFee({ mode, subtotalCents, productType, hotelsOrPeak, eveOrHoliday, specificTime })
  const grandTotalCents = subtotalCents + fee.totalCents

  const [state, formAction, pending] = useActionState(placeOrder, initialState)

  // Redirect on success
  useEffect(() => {
    if (state?.orderId) {
      clearCart()
      router.push(`/checkout/confirmation?id=${state.orderId}`)
    }
  }, [state, clearCart, router])

  if (items.length === 0) return null

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-[11px] font-body font-light text-purple uppercase tracking-[0.3em] mb-2">Checkout</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink">Your Order</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

        {/* ── Form ── */}
        <form ref={formRef} action={formAction} className="flex flex-col gap-8">

          {/* Hidden fields for controlled state */}
          <input type="hidden" name="items" value={JSON.stringify(items.map(i => ({ variantId: i.variantId, quantity: i.quantity })))} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="productType" value={productType} />
          <input type="hidden" name="hotelsOrPeak" value={String(hotelsOrPeak)} />
          <input type="hidden" name="eveOrHoliday" value={String(eveOrHoliday)} />
          <input type="hidden" name="specificTime" value={String(specificTime)} />

          {/* Contact */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-bold text-ink border-b border-purple/10 pb-3">
              Contact Details
            </h2>
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" type="text" required placeholder="Jane Tan" />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required placeholder="jane@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="+65 9123 4567" />
            </div>
          </section>

          {/* Delivery */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-bold text-ink border-b border-purple/10 pb-3">
              Delivery / Collection
            </h2>

            {/* Mode toggle */}
            <div className="flex gap-3">
              {(['self-collect', 'delivery'] as DeliveryMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-body font-light tracking-wide transition-all ${
                    mode === m
                      ? 'bg-purple text-white border-purple'
                      : 'bg-white border-purple/20 text-ink hover:border-purple/50'
                  }`}
                >
                  {m === 'self-collect' ? 'Self-Collect' : 'Delivery'}
                </button>
              ))}
            </div>

            {mode === 'self-collect' ? (
              <p className="text-sm font-body font-light text-ink/70 bg-surface rounded-xl px-4 py-3 border border-purple/10">
                Pickup at <span className="font-normal text-ink">Yishun Ring Road</span> · 2 pm – 6 pm only
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input id="address" name="address" type="text" placeholder="Block 123, Ang Mo Kio Ave 3, #04-56, S(560123)" />
                </div>

                <div>
                  <Label>Product Type *</Label>
                  <div className="flex gap-3">
                    {([
                      { value: 'cookies' as ProductType, label: 'Cookies / Brownies / Tartlets', fee: '$15' },
                      { value: 'cakes' as ProductType, label: 'Cakes with Frosting', fee: '$20' },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProductType(opt.value)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-left transition-all ${
                          productType === opt.value
                            ? 'bg-purple/10 border-purple/40'
                            : 'bg-white border-purple/20 hover:border-purple/40'
                        }`}
                      >
                        <span className="block text-xs font-body text-ink leading-snug">{opt.label}</span>
                        <span className="block text-[11px] font-body font-light text-ink/60 mt-0.5">Base fee {opt.fee}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Add-ons</Label>
                  {[
                    { key: 'hotelsOrPeak', label: 'Hotels / Hospitals / Peak period', amount: '+$5', value: hotelsOrPeak, set: setHotelsOrPeak },
                    { key: 'eveOrHoliday', label: 'Eve or Public Holiday', amount: '+$5', value: eveOrHoliday, set: setEveOrHoliday },
                    { key: 'specificTime', label: 'Specific time request', amount: '+$10', value: specificTime, set: setSpecificTime },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={opt.value}
                        onChange={e => opt.set(e.target.checked)}
                        className="w-4 h-4 accent-purple"
                      />
                      <span className="font-body font-light text-sm text-ink group-hover:text-purple transition-colors">
                        {opt.label}
                      </span>
                      <span className="font-body text-sm text-ink/50 ml-auto">{opt.amount}</span>
                    </label>
                  ))}
                </div>

                {specificTime && (
                  <div>
                    <Label htmlFor="specificTimeValue">Requested Time</Label>
                    <Input
                      id="specificTimeValue"
                      name="specificTimeValue"
                      type="time"
                      min="13:00"
                      max="17:00"
                    />
                    <p className="text-[10px] font-body font-light text-ink/40 mt-1">Delivery window is 1 pm – 5 pm</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="date">
                {mode === 'self-collect' ? 'Collection Date *' : 'Delivery Date *'}
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes / Special Requests</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any customisations, allergen info, or special instructions…"
                className="w-full border border-purple/20 rounded-xl px-4 py-2.5 font-body text-sm text-ink bg-white focus:outline-none focus:border-purple/60 transition-colors resize-none"
              />
            </div>
          </section>

          {state?.error && (
            <p className="text-sm font-body text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 rounded-full bg-purple text-white font-body font-bold text-sm tracking-[0.15em] uppercase hover:bg-purple/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? 'Placing Order…' : 'Place Order'}
          </button>

          <p className="text-[10px] font-body font-light text-ink/40 text-center">
            By placing your order you agree to our terms. Payment details will be sent via email.
          </p>
        </form>

        {/* ── Order Summary ── */}
        <aside className="lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="border border-purple/15 rounded-2xl overflow-hidden">
            <div className="bg-header px-4 py-3 border-b border-purple/10">
              <p className="text-[11px] font-body font-light text-ink uppercase tracking-[0.22em]">Order Summary</p>
            </div>
            <div className="divide-y divide-purple/10 bg-white">
              {items.map(item => (
                <div key={item.variantId} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink font-bold truncate">{item.productName}</p>
                    <p className="font-body font-light text-xs text-ink/60">{item.variantLabel} × {item.quantity}</p>
                  </div>
                  <p className="font-body font-bold text-sm text-ink shrink-0">
                    {formatPrice(item.priceCents * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-surface border-t border-purple/10 flex flex-col gap-2">
              <div className="flex justify-between text-sm font-body">
                <span className="text-ink/70 font-light">Subtotal</span>
                <span className="text-ink font-bold">{formatPrice(subtotalCents)}</span>
              </div>
              {mode === 'delivery' && (
                <>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-ink/70 font-light">
                      Delivery {fee.isFoc && <span className="text-green-600 text-[10px]">(FOC ≥$200)</span>}
                    </span>
                    <span className="text-ink font-bold">{fee.baseCents === 0 ? 'Free' : formatPrice(fee.baseCents)}</span>
                  </div>
                  {fee.surcharges.map(s => (
                    <div key={s.label} className="flex justify-between text-xs font-body">
                      <span className="text-ink/60 font-light">{s.label}</span>
                      <span className="text-ink/80">+{formatPrice(s.cents)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between font-body border-t border-purple/10 pt-2 mt-1">
                <span className="text-ink font-bold text-sm">Total</span>
                <span className="text-ink font-bold text-base">{formatPrice(grandTotalCents)}</span>
              </div>
            </div>
          </div>

          <Link
            href="/products"
            className="text-[11px] font-body font-light text-ink/50 uppercase tracking-widest hover:text-purple transition-colors text-center"
          >
            ← Edit Cart
          </Link>
        </aside>

      </div>
    </main>
  )
}

// Tiny helper so we don't repeat useState import for each field
function useClientState<T>(initial: T): [T, (v: T) => void] {
  const { useState } = require('react') as typeof import('react')
  return useState<T>(initial)
}
```

> **Note:** The `useClientState` helper at the bottom uses `require` to avoid import ordering issues with `'use client'`. If the linter flags it, replace each call with a direct `useState` import at the top.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

If there are errors about `require`, replace `useClientState` calls with direct `useState` calls at the top of the component and remove the helper.

- [ ] **Step 3: Start dev server and test the checkout form**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npm run dev
```

- Add a product to the cart from a detail page.
- Open cart drawer → click "Checkout →".
- Verify the checkout page loads with your cart items in the summary.
- Switch between Self-Collect and Delivery — verify the form changes and the fee updates live.
- Check the $200 FOC threshold by mentally noting a high-value cart.
- Submit with an empty name — verify the error message appears.

- [ ] **Step 4: Stop dev server, commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add app/checkout/page.tsx
git commit -m "feat: add checkout form with live delivery fee calculation"
```

---

## Task 10: Confirmation Page

**Files:**
- Create: `app/checkout/confirmation/page.tsx`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p /Users/taiga/Documents/BakesAndBliss/web/app/checkout/confirmation
```

```tsx
// app/checkout/confirmation/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import pool from '@/lib/db'

interface OrderRow {
  id: string
  total_cents: number
  delivery_date: string | null
  notes: string | null
  name: string
  email: string
  items: {
    product_name: string
    variant_label: string
    quantity: number
    line_total_cents: number
  }[]
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) notFound()

  const { rows } = await pool.query<OrderRow>(
    `SELECT
       o.id, o.total_cents, o.delivery_date, o.notes,
       c.name, c.email,
       json_agg(
         json_build_object(
           'product_name', p.name,
           'variant_label', CONCAT_WS(' · ', pv.flavor, pv.size_label),
           'quantity', oi.quantity,
           'line_total_cents', oi.line_total_cents
         ) ORDER BY oi.id
       ) AS items
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN product_variants pv ON pv.id = oi.product_variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE o.id = $1
     GROUP BY o.id, c.name, c.email`,
    [id]
  )

  const order = rows[0]
  if (!order) notFound()

  const orderRef = order.id.slice(0, 8).toUpperCase()
  const formattedDate = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString('en-SG', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-14">

      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <p className="text-[11px] font-body font-light text-purple uppercase tracking-[0.3em] mb-2">
          Order Confirmed
        </p>
        <h1 className="font-display text-4xl font-bold text-ink mb-3">
          Thank you, {order.name.split(' ')[0]}!
        </h1>
        <p className="font-body font-light text-ink/60 text-sm">
          We'll be in touch at <span className="text-ink">{order.email}</span> with your order details.
        </p>
      </div>

      {/* Order card */}
      <div className="border border-purple/15 rounded-2xl overflow-hidden mb-6">
        <div className="bg-header px-4 py-3 border-b border-purple/10">
          <p className="text-[11px] font-body font-light text-ink uppercase tracking-[0.22em]">
            Order #{orderRef}
          </p>
        </div>
        <div className="divide-y divide-purple/10 bg-white">
          {order.items.map((item, i) => (
            <div key={i} className="px-4 py-3 flex justify-between items-center gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-ink truncate">{item.product_name}</p>
                <p className="font-body font-light text-xs text-ink/60">
                  {item.variant_label || 'Standard'} × {item.quantity}
                </p>
              </div>
              <p className="font-body font-bold text-sm text-ink shrink-0">
                ${(item.line_total_cents / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-surface border-t border-purple/10 flex justify-between items-center">
          <span className="font-body font-bold text-sm text-ink">Total Paid</span>
          <span className="font-body font-bold text-ink text-base">
            ${(order.total_cents / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {formattedDate && (
        <p className="text-sm font-body font-light text-ink/60 text-center mb-6">
          {formattedDate}
        </p>
      )}

      <div className="text-center">
        <Link
          href="/products"
          className="inline-block px-8 py-3 rounded-full border border-purple/30 text-[11px] font-body font-light text-purple uppercase tracking-widest hover:bg-purple hover:text-white transition-all duration-200"
        >
          ← Back to Shop
        </Link>
      </div>

    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Full end-to-end test in the browser**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npm run dev
```

Walk through the full flow:
1. Go to `/products`, open a product detail page.
2. Select a variant, set quantity, click "Add to Cart" — drawer opens.
3. Add a second product from another tab if desired.
4. Click "Checkout →" in the drawer.
5. Fill in all fields, select Delivery, check "Eve or Public Holiday".
6. Verify fee updates live in the Order Summary panel.
7. Submit — verify you land on `/checkout/confirmation?id=…` with order details.
8. Check the database: `psql bb_ecom -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;"`

- [ ] **Step 4: Stop dev server, commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add app/checkout/confirmation/page.tsx
git commit -m "feat: add order confirmation page"
```

---

## Task 11: Fix Checkout Page — Remove useClientState Helper

The `useClientState` helper using `require` is a workaround that may fail in strict TypeScript. This task replaces it with proper `useState` calls.

**Files:**
- Modify: `app/checkout/page.tsx`

- [ ] **Step 1: Replace the `useClientState` helper and all its usages**

At the top of `app/checkout/page.tsx`, ensure `useState` is imported:

```tsx
import { useActionState, useEffect, useRef, useState } from 'react'
```

Replace every `useClientState` call with `useState`:

```tsx
const [mode, setMode] = useState<DeliveryMode>('self-collect')
const [productType, setProductType] = useState<ProductType>('cakes')
const [hotelsOrPeak, setHotelsOrPeak] = useState(false)
const [eveOrHoliday, setEveOrHoliday] = useState(false)
const [specificTime, setSpecificTime] = useState(false)
```

Remove the `useClientState` function at the bottom of the file entirely.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/taiga/Documents/BakesAndBliss/web
git add app/checkout/page.tsx
git commit -m "refactor: replace useClientState helper with direct useState"
```
