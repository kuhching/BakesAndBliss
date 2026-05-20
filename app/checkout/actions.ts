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
  hotelsHospitalsOrPeak: boolean
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
    hotelsHospitalsOrPeak: formData.get('hotelsHospitalsOrPeak') === 'true',
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
    hotelsHospitalsOrPeak: input.hotelsHospitalsOrPeak,
    eveOrHoliday: input.eveOrHoliday,
    specificTime: input.specificTime,
  })

  const totalCents = subtotalCents + fee.totalCents

  // Build notes string
  const deliveryNote = input.mode === 'delivery'
    ? [
        `Delivery to: ${input.address}`,
        input.hotelsHospitalsOrPeak ? 'Hotels/Hospitals/Peak (+$5)' : '',
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
