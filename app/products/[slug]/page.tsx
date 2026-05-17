import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, formatPrice } from '@/lib/products';

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
  const sortedImages = [...product.images];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-[10px] font-body font-light text-rust hover:text-choc transition-colors tracking-[0.2em] uppercase mb-8"
      >
        ← Back to bakes
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">

        {/* Images */}
        <div className="flex flex-col gap-3">
          {sortedImages.length > 0 ? (
            sortedImages.map((img, i) => (
              <div
                key={img.id}
                className={`relative overflow-hidden rounded-2xl bg-blush ${i === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}
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
            ))
          ) : (
            <div className="aspect-square rounded-2xl bg-blush flex items-center justify-center text-choc/30 font-body text-sm">
              No image available
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-[10px] font-body font-light text-rust uppercase tracking-[0.25em] mb-3">
            {product.category_name}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-espresso leading-tight mb-4">
            {product.name}
          </h1>
          {product.description && (
            <p className="font-body font-light text-choc/80 leading-relaxed mb-8 text-sm sm:text-base">
              {product.description}
            </p>
          )}

          {/* Variants */}
          <div className="border border-sand rounded-2xl overflow-hidden mb-6">
            <div className="bg-sand px-4 py-3 border-b border-sand/70">
              <p className="text-[10px] font-body font-light text-choc/60 uppercase tracking-[0.22em]">
                Options &amp; Pricing
              </p>
            </div>
            <table className="w-full">
              <thead className="border-b border-sand">
                <tr>
                  {['Flavour', 'Size', 'Price', 'Min'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[9px] font-body font-light text-choc/50 uppercase tracking-widest ${i >= 2 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {sortedVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-blush/40 transition-colors">
                    <td className="px-4 py-3 font-body text-sm text-espresso">
                      {v.flavor ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-body font-light text-sm text-choc/70">
                      {v.size_label ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-body font-bold text-rust text-sm">
                      {formatPrice(v.price_cents)}
                    </td>
                    <td className="px-4 py-3 text-right font-body font-light text-xs text-choc/40">
                      {v.min_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] font-body font-light text-choc/30 tracking-wide">
            Page {product.source_page} · {sortedVariants.length} variant{sortedVariants.length !== 1 ? 's' : ''}
          </p>
        </div>

      </div>
    </main>
  );
}
