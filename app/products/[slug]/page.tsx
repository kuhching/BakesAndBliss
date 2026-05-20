import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, formatPrice } from '@/lib/products';

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

  // De-duplicate images by filename — one representative per distinct photo
  const seenFilenames = new Set<string>();
  const uniqueImages = product.images.filter((img) => {
    if (seenFilenames.has(img.filename)) return false;
    seenFilenames.add(img.filename);
    return true;
  });
  const galleryImages = uniqueImages.slice(0, MAX_GALLERY_IMAGES);
  const extraCount = uniqueImages.length - galleryImages.length;

  // Unique sizes and flavors for the options summary
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

        {/* Images — capped at 4, de-duplicated */}
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
            <p className="font-body font-light text-ink/80 leading-relaxed mb-8 text-sm sm:text-base">
              {product.description}
            </p>
          )}

          {/* Variants table */}
          <div className="border border-purple/15 rounded-2xl overflow-hidden mb-6">
            <div className="bg-header px-4 py-3 border-b border-purple/10">
              <p className="text-[11px] font-body font-light text-ink uppercase tracking-[0.22em]">
                Options &amp; Pricing
              </p>
            </div>
            <table className="w-full">
              <thead className="border-b border-purple/10 bg-surface">
                <tr>
                  {['Flavour', 'Size', 'Price', 'Min'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[10px] font-body font-light text-ink/60 uppercase tracking-widest ${
                        i >= 2 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple/10">
                {sortedVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-surface transition-colors bg-white">
                    <td className="px-4 py-3 font-body text-sm text-ink">{v.flavor ?? '—'}</td>
                    <td className="px-4 py-3 font-body font-light text-sm text-ink/70">{v.size_label ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-body font-bold text-ink text-sm">
                      {formatPrice(v.price_cents)}
                    </td>
                    <td className="px-4 py-3 text-right font-body font-light text-sm text-ink/60">
                      {v.min_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] font-body font-light text-ink/40 tracking-wide">
            Page {product.source_page} · {sortedVariants.length} option{sortedVariants.length !== 1 ? 's' : ''}
          </p>
        </div>

      </div>
    </main>
  );
}
