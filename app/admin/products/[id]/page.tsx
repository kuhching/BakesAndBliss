import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAdminProductById } from '@/lib/products'
import { saveProduct, saveVariant, setVariantActive } from '../actions'

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getAdminProductById(id)
  if (!product) notFound()

  const sortedVariants = [...product.variants].sort((a, b) => a.display_order - b.display_order)
  const firstImage = product.images[0]

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-[11px] font-body font-light text-purple hover:text-ink transition-colors tracking-[0.2em] uppercase mb-8"
      >
        ← All products
      </Link>

      <div className="grid md:grid-cols-[1fr_280px] gap-8 items-start">

        {/* ── Left: edit forms ── */}
        <div className="flex flex-col gap-8">

          {/* Product details */}
          <section className="bg-white border border-purple/15 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-purple/10 bg-surface">
              <p className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest">Product Details</p>
            </div>
            <form action={saveProduct} className="p-5 flex flex-col gap-4">
              <input type="hidden" name="id" value={product.id} />

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest">
                  Name
                </label>
                <input
                  name="name"
                  defaultValue={product.name}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-purple/20 bg-surface text-sm text-ink font-body focus:outline-none focus:ring-2 focus:ring-purple/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={product.description ?? ''}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-purple/20 bg-surface text-sm text-ink font-body resize-y focus:outline-none focus:ring-2 focus:ring-purple/30"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] font-body font-light text-ink/50 uppercase tracking-widest">
                  Category: <span className="text-ink font-medium normal-case">{product.category_name ?? '—'}</span>
                </div>
                <button
                  type="submit"
                  className="bg-purple text-white text-[11px] font-body tracking-widest uppercase px-5 py-2 rounded-full hover:bg-purple/90 transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </section>

          {/* Variants */}
          <section className="bg-white border border-purple/15 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-purple/10 bg-surface flex items-center justify-between">
              <p className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest">
                Variants ({sortedVariants.length})
              </p>
              <p className="text-[10px] font-body text-ink/40">Price in $</p>
            </div>

            {/* Hidden forms — linked from table inputs via form= attribute */}
            {sortedVariants.map((v) => (
              <form key={`save-${v.id}`} id={`save-${v.id}`} action={saveVariant}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="product_id" value={product.id} />
              </form>
            ))}
            {sortedVariants.map((v) => (
              <form key={`toggle-${v.id}`} id={`toggle-${v.id}`} action={setVariantActive}>
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="active" value={(!v.is_active).toString()} />
              </form>
            ))}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-purple/10 bg-surface">
                  <tr>
                    {['Flavour', 'Size', 'Price ($)', 'Min qty', 'Active', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-body font-light text-ink/50 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple/10">
                  {sortedVariants.map((v) => (
                    <tr key={v.id} className={`bg-white hover:bg-surface transition-colors ${!v.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <input
                          form={`save-${v.id}`}
                          name="flavor"
                          defaultValue={v.flavor ?? ''}
                          placeholder="—"
                          className="w-full min-w-[120px] px-2.5 py-1.5 rounded-lg border border-purple/20 bg-surface text-xs text-ink font-body focus:outline-none focus:ring-2 focus:ring-purple/30"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          form={`save-${v.id}`}
                          name="size_label"
                          defaultValue={v.size_label ?? ''}
                          placeholder="—"
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-purple/20 bg-surface text-xs text-ink font-body focus:outline-none focus:ring-2 focus:ring-purple/30"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          form={`save-${v.id}`}
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={(v.price_cents / 100).toFixed(2)}
                          required
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-purple/20 bg-surface text-xs text-ink font-body focus:outline-none focus:ring-2 focus:ring-purple/30"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          form={`save-${v.id}`}
                          name="min_quantity"
                          type="number"
                          min="1"
                          defaultValue={v.min_quantity}
                          required
                          className="w-16 px-2.5 py-1.5 rounded-lg border border-purple/20 bg-surface text-xs text-ink font-body focus:outline-none focus:ring-2 focus:ring-purple/30"
                        />
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-2.5">
                        <button
                          form={`toggle-${v.id}`}
                          type="submit"
                          title={v.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${v.is_active ? 'bg-purple' : 'bg-ink/20'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${v.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </td>

                      {/* Save button */}
                      <td className="px-4 py-2.5">
                        <button
                          form={`save-${v.id}`}
                          type="submit"
                          className="text-[11px] font-body text-purple hover:text-ink border border-purple/20 hover:border-purple px-3 py-1 rounded-full transition-colors uppercase tracking-wide whitespace-nowrap"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* ── Right: image preview + meta ── */}
        <div className="flex flex-col gap-4 md:sticky md:top-24">
          <div className="bg-white border border-purple/15 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-purple/10 bg-surface">
              <p className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest">Preview</p>
            </div>
            <div className="p-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-header mb-3">
                {firstImage ? (
                  <Image
                    src={`/images/products/${firstImage.filename}`}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-ink/30 text-xs font-body">
                    No image
                  </div>
                )}
              </div>
              <p className="font-display font-bold text-ink text-sm leading-snug">{product.name}</p>
              {product.category_name && (
                <p className="text-[11px] font-body text-purple uppercase tracking-wide mt-0.5">{product.category_name}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-purple/15 rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest mb-1">Meta</p>
            <div className="flex justify-between text-xs font-body">
              <span className="text-ink/50">Source page</span>
              <span className="text-ink font-medium">{product.source_page ?? '—'}</span>
            </div>
            <div className="flex justify-between text-xs font-body">
              <span className="text-ink/50">Images</span>
              <span className="text-ink font-medium">{product.images.length}</span>
            </div>
            <div className="flex justify-between text-xs font-body">
              <span className="text-ink/50">Variants</span>
              <span className="text-ink font-medium">{product.variants.length}</span>
            </div>
            <div className="flex justify-between text-xs font-body">
              <span className="text-ink/50">Status</span>
              <span className={`font-medium ${product.is_active ? 'text-green-600' : 'text-red-500'}`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="pt-2 border-t border-purple/10 mt-1">
              <p className="text-[9px] font-mono text-ink/30 break-all">{product.id}</p>
            </div>
          </div>

          <Link
            href={`/products/${encodeURIComponent(product.name.toLowerCase())}?id=${product.id}`}
            target="_blank"
            className="text-center text-[11px] font-body text-purple hover:text-ink border border-purple/20 hover:border-purple px-4 py-2 rounded-full transition-colors uppercase tracking-widest"
          >
            View on storefront ↗
          </Link>
        </div>

      </div>
    </main>
  )
}
