'use client'

import { useCart } from '@/lib/cart-context'

export function CartHeaderButton() {
  const { totalItems, openCart } = useCart()

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
      className="relative flex items-center gap-1.5 text-ink font-body text-xs font-light tracking-widest uppercase hover:text-purple transition-colors duration-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/icons/shopping-cart.png" alt="" width={15} height={15} />
      Cart
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[16px] h-4 bg-purple text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  )
}
