import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/products";

const PLACEHOLDER_IMAGES = [
  "basque-burnt-cheesecake-7-ea4f9217.jpg",
  "cakey-brownies-9be5f813.jpg",
  "cupcakes-93683e4e.jpg",
  "classic-victoria-sandwich-2c76678e.jpg",
  "combo-tarts-7aab1604.jpg",
  "chocolate-raspberry-c1a82b3f.jpg",
  "carrot-cake-500a0637.jpg",
  "assorted-mini-cheesecake-334d8f7b.jpg",
  "red-velvet-18696d75.jpg",
  "premium-cupcakes-a60ea0ee.jpg",
  "fudgy-brownies-dc00ea38.jpg",
  "victoria-35917466.jpg",
];

export default async function Home() {
  const categories = await getCategories();

  return (
    <main className="flex flex-col">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center relative overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-linear-to-b from-header/70 to-surface pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-140 h-140 rounded-full border border-purple/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-85 h-85 rounded-full border border-purple/10 pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <p className="text-[11px] font-body font-light tracking-[0.35em] uppercase text-purple mb-5">
            Freshly Baked · Made to Order
          </p>
          <h1 className="font-display text-5xl sm:text-7xl font-bold text-ink leading-[1.05] mb-5">
            Bakes &amp;<br />
            <em className="text-purple not-italic">Bliss</em>
          </h1>
          <p className="font-body font-light text-ink text-base sm:text-lg mb-10 max-w-sm leading-relaxed">
            Artisan cookies, cheesecakes, tarts, and more — each one crafted
            with love and baked fresh to your order.
          </p>
          <Link
            href="/products"
            className="inline-block bg-purple text-white font-body font-light tracking-[0.2em] uppercase text-xs px-10 py-4 rounded-full hover:bg-purple/90 transition-colors duration-300"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* ── Category Cards ── */}
      <section className="bg-surface px-4 sm:px-6 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-body font-light text-purple uppercase tracking-[0.3em] mb-2">
            Browse by Category
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-8">
            What are you craving?
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {categories.map((cat, i) => {
              const img = PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length];
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-purple/15 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 bg-white"
                >
                  {/* Hero — header-pink base with photo */}
                  <div className="relative aspect-4/3 bg-header overflow-hidden">
                    <Image
                      src={`/images/products/${img}`}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-ink/40 via-transparent to-transparent" />
                  </div>

                  {/* Body */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-ink text-sm leading-snug">
                      {cat.name}
                    </h3>
                    <span className="text-purple text-sm shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="border-t border-purple/10 bg-surface py-8 sm:py-10">
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
          {[
            { label: "Made to Order", desc: "Nothing sits on a shelf" },
            { label: "Baked Fresh", desc: "Delivered at peak flavour" },
            { label: "Artisan Craft", desc: "Small-batch, big love" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5">
              <span className="text-purple text-xs mb-0.5">✦</span>
              <p className="font-display text-sm font-bold text-ink">{f.label}</p>
              <p className="font-body font-light text-xs text-ink/70 tracking-wide">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
