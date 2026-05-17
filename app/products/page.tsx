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

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl overflow-hidden border border-sand bg-cream shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-square bg-blush overflow-hidden">
        {image ? (
          <Image
            src={`/images/products/${image.filename}`}
            alt={image.alt_text ?? product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-choc/30 text-sm font-body font-light">
            No image
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col gap-1 flex-1">
        <span className="text-[10px] font-body font-light text-rust uppercase tracking-[0.18em]">
          {product.category_name}
        </span>
        <h3 className="font-display font-bold text-espresso leading-snug text-base mt-0.5">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-choc/60 font-body font-light line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="mt-auto pt-3 font-body font-bold text-rust text-sm">
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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      <div className="mb-10">
        <p className="text-[10px] font-body font-light text-rust uppercase tracking-[0.3em] mb-2">
          The Collection
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-espresso">
          Our Bakes
        </h1>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/products"
          className={`px-4 sm:px-5 py-2 rounded-full text-[10px] font-body font-light tracking-[0.18em] uppercase border transition-all duration-200 ${
            !category
              ? 'bg-espresso text-cream border-espresso'
              : 'border-sand text-choc hover:border-espresso hover:text-espresso'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className={`px-4 sm:px-5 py-2 rounded-full text-[10px] font-body font-light tracking-[0.18em] uppercase border transition-all duration-200 ${
              category === cat.id
                ? 'bg-espresso text-cream border-espresso'
                : 'border-sand text-choc hover:border-espresso hover:text-espresso'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-choc/40 py-20 text-center font-body font-light">No products found.</p>
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
