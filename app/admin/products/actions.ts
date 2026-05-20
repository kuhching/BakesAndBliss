'use server'

import pool from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function setProductActive(formData: FormData) {
  const id = formData.get('id') as string
  const active = formData.get('active') === 'true'
  await pool.query('UPDATE products SET is_active = $1 WHERE id = $2', [active, id])
  revalidatePath('/admin/products')
  revalidatePath('/products')
}

export async function saveProduct(formData: FormData) {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  await pool.query(
    'UPDATE products SET name = $1, description = $2 WHERE id = $3',
    [name, description, id]
  )
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/products')
}

export async function setVariantActive(formData: FormData) {
  const id = formData.get('id') as string
  const productId = formData.get('product_id') as string
  const active = formData.get('active') === 'true'
  await pool.query('UPDATE product_variants SET is_active = $1 WHERE id = $2', [active, id])
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/products')
}

export async function saveVariant(formData: FormData) {
  const id = formData.get('id') as string
  const productId = formData.get('product_id') as string
  const flavor = (formData.get('flavor') as string)?.trim() || null
  const sizeLabel = (formData.get('size_label') as string)?.trim() || null
  const priceDollars = parseFloat(formData.get('price') as string)
  const priceCents = isNaN(priceDollars) ? 0 : Math.round(priceDollars * 100)
  const minQty = parseInt(formData.get('min_quantity') as string, 10) || 1
  await pool.query(
    `UPDATE product_variants
     SET flavor = $1, size_label = $2, price_cents = $3, min_quantity = $4
     WHERE id = $5`,
    [flavor, sizeLabel, priceCents, minQty, id]
  )
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/products')
}
