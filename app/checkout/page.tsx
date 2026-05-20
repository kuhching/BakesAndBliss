// app/checkout/page.tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { calculateDeliveryFee, DeliveryMode, ProductType } from '@/lib/delivery-fee'
import { formatPrice } from '@/lib/products'
import { placeOrder } from './actions'

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest block mb-1"
    >
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

type Addon = { key: string; label: string; amount: string; value: boolean; set: (v: boolean) => void }

export default function CheckoutPage() {
  const { items, subtotalCents, clearCart } = useCart()
  const router = useRouter()

  // Redirect to products if cart is empty
  useEffect(() => {
    if (items.length === 0) router.replace('/products')
  }, [items.length, router])

  // Controlled delivery state for live fee calculation
  const [mode, setMode] = useState<DeliveryMode>('self-collect')
  const [productType, setProductType] = useState<ProductType>('cakes')
  const [hotelsHospitalsOrPeak, setHotelsHospitalsOrPeak] = useState(false)
  const [eveOrHoliday, setEveOrHoliday] = useState(false)
  const [specificTime, setSpecificTime] = useState(false)

  const fee = calculateDeliveryFee({
    mode,
    subtotalCents,
    productType,
    hotelsHospitalsOrPeak,
    eveOrHoliday,
    specificTime,
  })
  const grandTotalCents = subtotalCents + fee.totalCents

  const [state, formAction, pending] = useActionState(placeOrder, null)

  // On success: clear cart and redirect to confirmation
  useEffect(() => {
    if (state?.orderId) {
      clearCart()
      router.push(`/checkout/confirmation?id=${state.orderId}`)
    }
  }, [state, clearCart, router])

  if (items.length === 0) return null

  const addons: Addon[] = [
    { key: 'hotelsHospitalsOrPeak', label: 'Hotels / Hospitals / Peak period', amount: '+$5', value: hotelsHospitalsOrPeak, set: setHotelsHospitalsOrPeak },
    { key: 'eveOrHoliday', label: 'Eve or Public Holiday', amount: '+$5', value: eveOrHoliday, set: setEveOrHoliday },
    { key: 'specificTime', label: 'Specific time request', amount: '+$10', value: specificTime, set: setSpecificTime },
  ]

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-[11px] font-body font-light text-purple uppercase tracking-[0.3em] mb-2">
          Checkout
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink">Your Order</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

        {/* ── Form ── */}
        <form action={formAction} className="flex flex-col gap-8">

          {/* Hidden fields for controlled state */}
          <input type="hidden" name="items" value={JSON.stringify(items.map(i => ({ variantId: i.variantId, quantity: i.quantity })))} />
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="productType" value={productType} />
          <input type="hidden" name="hotelsHospitalsOrPeak" value={String(hotelsHospitalsOrPeak)} />
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
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    required
                    placeholder="Block 123, Ang Mo Kio Ave 3, #04-56, S(560123)"
                  />
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
                        <span className="block text-[11px] font-body font-light text-ink/60 mt-0.5">
                          Base fee {opt.fee}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Add-ons</Label>
                  {addons.map(opt => (
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
                    <p className="text-[10px] font-body font-light text-ink/40 mt-1">
                      Delivery window is 1 pm – 5 pm
                    </p>
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
              <p className="text-[11px] font-body font-light text-ink uppercase tracking-[0.22em]">
                Order Summary
              </p>
            </div>
            <div className="divide-y divide-purple/10 bg-white">
              {items.map(item => (
                <div key={item.variantId} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink font-bold truncate">{item.productName}</p>
                    <p className="font-body font-light text-xs text-ink/60">
                      {item.variantLabel} × {item.quantity}
                    </p>
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
                      Delivery{fee.isFoc && (
                        <span className="text-green-600 text-[10px] ml-1">(FOC ≥$200)</span>
                      )}
                    </span>
                    <span className="text-ink font-bold">
                      {fee.baseCents === 0 ? 'Free' : formatPrice(fee.baseCents)}
                    </span>
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
