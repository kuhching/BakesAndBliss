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
