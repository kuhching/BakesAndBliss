import Link from 'next/link'
import { getAllProductsForAdmin, getReviewItems, formatPrice } from '@/lib/products'
import { setProductActive } from './actions'

export default async function AdminProductsPage() {
  const [products, reviewItems] = await Promise.all([getAllProductsForAdmin(), getReviewItems()])

  const totalVariants = products.reduce((s, p) => s + p.variants.length, 0)
  const needsReviewCount = products.filter((p) => Number(p.review_count) > 0).length
  const noImageCount = products.filter((p) => p.images.length === 0).length
  const unpricedCount = products.filter((p) => !p.min_price_cents).length

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] font-body font-light text-purple uppercase tracking-[0.3em] mb-1">Dashboard</p>
          <h1 className="font-display text-3xl font-bold text-ink">Product Admin</h1>
          <p className="text-ink/60 text-sm mt-1 font-body font-light">
            {products.length} products · {totalVariants} variants
          </p>
        </div>
        <Link href="/products" className="text-xs font-body text-purple hover:text-ink transition-colors tracking-widest uppercase">
          View storefront →
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total products', value: products.length, ok: true },
          { label: 'Total variants', value: totalVariants, ok: true },
          { label: 'Needs review', value: needsReviewCount, ok: needsReviewCount === 0 },
          { label: 'No image', value: noImageCount, ok: noImageCount === 0 },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-4 border ${s.ok ? 'border-purple/15 bg-white' : 'border-amber-300 bg-amber-50'}`}
          >
            <p className="text-[11px] font-body font-light text-ink/60 mb-1 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold font-display ${s.ok ? 'text-ink' : 'text-amber-700'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Products table */}
      <div className="border border-purple/15 rounded-2xl overflow-hidden mb-12 bg-white">
        <div className="px-5 py-3 border-b border-purple/10 bg-surface flex items-center justify-between">
          <p className="text-[11px] font-body font-light text-ink/60 uppercase tracking-widest">All Products</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-purple/10 bg-surface">
              <tr>
                {['Product', 'Category', 'Pg', 'Variants', 'Price range', 'Img', 'Review', 'Active', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-body font-light text-ink/50 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple/10">
              {products.map((p) => {
                const hasReview = Number(p.review_count) > 0
                const noImg = p.images.length === 0
                const noPrice = !p.min_price_cents

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${!p.is_active ? 'opacity-50' : ''} ${hasReview || noImg || noPrice ? 'bg-amber-50/40' : 'bg-white'} hover:bg-surface`}
                  >
                    <td className="px-4 py-2.5 font-body text-sm text-ink font-medium max-w-[200px]">
                      <span className="block truncate">{p.name}</span>
                    </td>
                    <td className="px-4 py-2.5 font-body font-light text-sm text-ink/70 whitespace-nowrap">
                      {p.category_name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 font-body font-light text-sm text-ink/50 text-center">
                      {p.source_page ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 font-body text-sm text-ink/70 text-center">
                      {p.variants.length}
                    </td>
                    <td className="px-4 py-2.5 font-body font-medium text-sm text-ink whitespace-nowrap">
                      {p.min_price_cents
                        ? p.min_price_cents === p.max_price_cents
                          ? formatPrice(Number(p.min_price_cents))
                          : `${formatPrice(Number(p.min_price_cents))}–${formatPrice(Number(p.max_price_cents))}`
                        : <span className="text-red-500 text-xs font-semibold">No price</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {noImg
                        ? <span className="text-amber-500 text-xs font-semibold">✗</span>
                        : <span className="text-green-600 text-xs">✓</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hasReview
                        ? <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-medium">{p.review_count}</span>
                        : <span className="text-ink/20 text-xs">—</span>}
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-2.5">
                      <form action={setProductActive}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={(!p.is_active).toString()} />
                        <button
                          type="submit"
                          title={p.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${p.is_active ? 'bg-purple' : 'bg-ink/20'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${p.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </form>
                    </td>

                    {/* Edit link */}
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-[11px] font-body text-purple hover:text-ink transition-colors tracking-wide uppercase"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review items */}
      {reviewItems.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-ink mb-4">
            Items needing review ({reviewItems.length})
          </h2>
          <div className="border border-amber-200 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-amber-50 border-b border-amber-100">
                  <tr>
                    {['Page', 'Question', 'Raw text', 'Parsed name', 'Price', 'Confidence', 'Notes'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-body font-light text-amber-700 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {reviewItems.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-3 py-2 text-ink/50">{r.source_page}</td>
                      <td className="px-3 py-2 text-ink max-w-[160px] truncate">{r.question_text}</td>
                      <td className="px-3 py-2 text-ink/70 max-w-[200px] truncate font-mono">{r.raw_text}</td>
                      <td className="px-3 py-2 text-ink">{r.parsed_name}</td>
                      <td className="px-3 py-2 text-ink font-medium">{r.parsed_price != null ? `$${r.parsed_price}` : '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.confidence === 'high' ? 'bg-green-100 text-green-700'
                          : r.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>{r.confidence}</span>
                      </td>
                      <td className="px-3 py-2 text-ink/60 max-w-[200px] truncate">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {reviewItems.length === 0 && unpricedCount === 0 && noImageCount === 0 && (
        <p className="text-center text-green-600 font-body font-medium py-8 text-sm">
          All products verified — no issues found.
        </p>
      )}

    </main>
  )
}
