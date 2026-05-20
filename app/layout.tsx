import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bakes and Bliss SG",
  description: "Freshly baked to order",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-surface text-ink font-body">

        {/* ── Header ── */}
        <header className="bg-header sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

            <Link href="/" className="flex items-center gap-3 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo/logo.jpg"
                alt="Bakes and Bliss SG logo"
                width={40}
                height={40}
                className="rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-display text-base sm:text-lg font-bold text-ink tracking-tight">
                Bakes and Bliss SG
              </span>
            </Link>

            <nav className="flex items-center gap-5 sm:gap-6">
              <Link
                href="/products"
                className="flex items-center gap-1.5 text-ink font-body text-xs font-light tracking-widest uppercase hover:text-purple transition-colors duration-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/icons/shopping-cart.png" alt="" width={15} height={15} />
                Shop
              </Link>
              <Link
                href="/admin/products"
                className="text-ink/40 font-body text-xs font-light tracking-widest uppercase hover:text-ink/60 transition-colors duration-200"
              >
                Admin
              </Link>
            </nav>

          </div>
        </header>

        <div className="flex-1">{children}</div>

        {/* ── Footer ── */}
        <footer className="border-t border-purple/10 bg-surface mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between gap-4">

              {/* Left — Instagram */}
              <div className="shrink-0">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="block hover:opacity-70 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/icons/instagram.svg"
                    alt="Instagram"
                    width={22}
                    height={22}
                  />
                </a>
              </div>

              {/* Centre — Logo + legal + credit */}
              <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/logo/logo.jpg" alt="" width={22} height={22} className="rounded-full object-cover" />
                  <span className="font-body text-xs text-ink tracking-wide">
                    © 2026 Bakes and Bliss SG 🇸🇬 UEN 53279533D
                  </span>
                </div>
                <p className="text-[10px] font-body font-light text-ink/50">
                  Designed by{" "}
                  <a
                    href="https://kuhching.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold font-medium hover:opacity-80 transition-opacity"
                  >
                    kuhching.app
                  </a>
                </p>
              </div>

              {/* Right — symmetry spacer */}
              <div className="shrink-0 w-5.5" aria-hidden="true" />

            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
