// app/products/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/products';
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
