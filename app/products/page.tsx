import Image from 'next/image';
import Link from 'next/link';
import { getCategories, getProducts, priceRange } from '@/lib/products';
import type { ProductWithDetails } from '@/types/product';

function slugify(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
}

function ProductCard({ product }: { product: ProductWithDetails }) {
  const image = product.images[0];
  const href = `/products/${slugify(product.name)}?id=${product.id}`;

  const sizes = [...new Set(product.variants.map((v) => v.size_label).filter(Boolean))] as string[];
  const flavorCount = new Set(product.variants.map((v) => v.flavor).filter(Boolean)).size;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl overflow-hidden border border-purple/15 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image — aspect-square crops to card width via object-cover */}
      <div className="relative aspect-square bg-header overflow-hidden">
        {image ? (
          <Image
            src={`/images/products/${image.filename}`}
            alt={image.alt_text ?? product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-ink/40 text-sm font-body font-light">
            No image
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 sm:p-5 flex flex-col gap-1 flex-1 bg-white">
        <span className="text-[11px] font-body font-light text-purple uppercase tracking-[0.18em]">
          {product.category_name}
        </span>

        <h3 className="font-display font-bold text-ink leading-snug text-base mt-0.5">
          {product.name}
        </h3>

        {/* Size chips */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {sizes.map((size) => (
              <span
                key={size}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-purple/20 text-ink font-body font-light"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {/* Flavour count when no sizes */}
        {sizes.length === 0 && flavorCount > 1 && (
          <p className="text-[11px] text-ink/60 font-body font-light mt-1">
            {flavorCount} flavours
          </p>
        )}

        {product.description && (
          <p className="text-xs text-ink/60 font-body font-light line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        )}

        <p className="mt-auto pt-3 font-body font-bold text-ink text-sm">
          {product.min_price_cents
            ? priceRange(Number(product.min_price_cents), Number(product.max_price_cents))
            : 'See options'}
        </p>
      </div>
    </Link>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(category),
  ]);

  const activeCategory = categories.find((c) => c.id === category);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      <div className="mb-10">
        <p className="text-[11px] font-body font-light text-purple uppercase tracking-[0.3em] mb-2">
          {activeCategory ? activeCategory.name : 'The Collection'}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink">
          {activeCategory ? activeCategory.name : 'Our Bakes'}
        </h1>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/products"
          className={`px-4 sm:px-5 py-2 rounded-full text-[11px] font-body font-light tracking-[0.15em] uppercase border transition-all duration-200 ${
            !category
              ? 'bg-purple text-white border-purple'
              : 'bg-white border-purple/20 text-ink hover:border-purple hover:text-purple'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className={`px-4 sm:px-5 py-2 rounded-full text-[11px] font-body font-light tracking-[0.15em] uppercase border transition-all duration-200 ${
              category === cat.id
                ? 'bg-purple text-white border-purple'
                : 'bg-white border-purple/20 text-ink hover:border-purple hover:text-purple'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-ink/50 py-20 text-center font-body font-light">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </main>
  );
}
