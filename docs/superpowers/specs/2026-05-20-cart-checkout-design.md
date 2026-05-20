# Cart & Checkout — Design Spec
**Date:** 2026-05-20  
**Status:** Approved

---

## Overview

Add a full client-side cart with a slide-in drawer, variant selection on the product detail page, and a checkout form that saves orders to the existing PostgreSQL database.

---

## Architecture

Cart state lives in **React Context + localStorage** (client-side only). Server components are left untouched except where a client component is embedded. A server action handles the final order write.

### New files

| File | Purpose |
|---|---|
| `lib/cart-context.tsx` | CartProvider, useCart hook, localStorage sync |
| `components/CartDrawer.tsx` | Slide-in cart drawer (client) |
| `components/AddToCartSection.tsx` | Variant selector + Add to Cart on detail page (client) |
| `app/checkout/page.tsx` | Checkout form page (client form) |
| `app/checkout/actions.ts` | Server action — validates + writes order to DB |
| `app/checkout/confirmation/page.tsx` | Order confirmation page |

### Modified files

| File | Change |
|---|---|
| `app/layout.tsx` | Wrap with `CartProvider`; add cart icon button + badge to header |
| `app/products/[slug]/page.tsx` | Embed `<AddToCartSection>` client component; remove static variants table |

---

## Section 1 — Cart State (`lib/cart-context.tsx`)

### Cart item shape

```ts
interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantLabel: string   // e.g. "Chocolate · 6-inch"
  priceCents: number
  quantity: number
  imageFilename: string | null
}
```

### Context API

```ts
interface CartContext {
  items: CartItem[]
  addToCart(item: CartItem): void
  removeFromCart(variantId: string): void
  updateQuantity(variantId: string, qty: number): void
  clearCart(): void
  totalItems: number
  subtotalCents: number
}
```

- Synced to `localStorage` key `bb_cart` on every mutation.
- Loaded from `localStorage` on mount.
- Adding an item already in the cart increments its quantity.

---

## Section 2 — Product Detail Page (`AddToCartSection`)

The existing static variants table is replaced by this interactive client component (the server component passes `product` as a prop).

### Behaviour

- **Variant rows** — each row shows: Flavour | Size | Price | Min qty. Clicking a row selects it (purple highlight).
- **Pre-selection** — if only one variant exists, it is pre-selected automatically.
- **Quantity stepper** — `−` / `[number]` / `+`. Minimum clamped to `variant.min_quantity` (default 1).
- **"Add to Cart" button** — full-width, purple. On click:
  1. Adds item to cart context (or increments if already present).
  2. Opens cart drawer.
  3. Shows brief "Added!" state on the button for 1.5 s.
- **Disabled state** — button is disabled if no variant is selected.

---

## Section 3 — Cart Drawer (`components/CartDrawer.tsx`)

Triggered by the cart icon in the header. Slides in from the right with a semi-transparent dark overlay.

### Header icon

- Existing shopping-cart PNG becomes a `<button>` that opens the drawer.
- Pill badge shows total item count; hidden when cart is empty.

### Drawer contents

- **Item list** — for each item: thumbnail (if available), product name, variant label, price × qty, inline `−/+` quantity buttons, remove (×) button.
- **Empty state** — "Your cart is empty" with a link to `/products`.
- **Subtotal** — shown at the bottom.
- **"Checkout →"** button — navigates to `/checkout`; closes drawer.
- **"Continue Shopping"** link — closes drawer.
- Clicking the overlay closes the drawer.

---

## Section 4 — Checkout Form (`app/checkout/page.tsx`)

Client-rendered form. Cart is read from context on mount; if cart is empty the page redirects to `/products`.

### Contact section

| Field | Type | Required |
|---|---|---|
| Name | text | yes |
| Email | email | yes |
| Phone | tel | yes |

### Delivery section

**Mode toggle:** Self-Collect | Delivery (radio)

**Self-Collect:**
- Informational note: "Yishun Ring Road · 2 pm – 6 pm only"
- Date picker (required)
- Notes (optional)

**Delivery:**
- Delivery address (required)
- Product type (select, required for fee calculation):
  - Cookies / Brownies / Tartlets → base $15
  - Cakes with frosting → base $20
- Checkboxes (each optional):
  - Hotels / Hospitals / Peak period (+$5)
  - Eve or Public Holiday (+$5)
  - Specific time request (+$10) → if checked, show a time input field
- Date picker (required) — delivery window is 1 pm – 5 pm
- Notes (optional)

### Delivery fee calculation (client-side, live)

```
if self-collect:
  fee = 0

else if subtotal >= 20000:        // ≥ $200 FOC
  fee = 0
  fee += hotelsOrPeak ? 500 : 0
  fee += eveOrHoliday ? 500 : 0
  fee += specificTime ? 1000 : 0

else:
  base = productType === 'cookies' ? 1500 : 2000
  fee = base
      + (hotelsOrPeak ? 500 : 0)
      + (eveOrHoliday ? 500 : 0)
      + (specificTime ? 1000 : 0)
```

### Order summary panel

Displayed beside (desktop) or above (mobile) the form:
- Line items from cart (name, variant, qty, line total)
- Subtotal
- Delivery fee (with breakdown line items)
- **Grand total**

### Submission

On submit → calls `placeOrder` server action with cart items + form data.

---

## Section 5 — Server Action (`app/checkout/actions.ts`)

```
placeOrder(formData, cartItems)
```

1. **Validate** all required fields server-side (zod or manual checks).
2. **Re-fetch prices** from DB by `variantId` — never trust client-sent `priceCents`.
3. **Recalculate delivery fee** server-side using the same logic as client.
4. **Upsert customer** by email into `customers` table.
5. **Insert order** into `orders` (status `'pending'`, subtotal, delivery fee, total, notes, delivery_date).
6. **Insert order_items** rows.
7. **Clear cart** signal returned to client.
8. **Redirect** to `/checkout/confirmation?id=<orderId>`.

### Confirmation page

Shows order ID, customer name, summary of items, total paid, and pickup/delivery details. A "Back to shop" link.

---

## Delivery Fee Rules (reference)

| Condition | Amount |
|---|---|
| Self-collect | Free |
| Order ≥ $200 (delivery) | Free base (surcharges still apply) |
| Cookies / Brownies / Tartlets | $15 base |
| Cakes with frosting | $20 base |
| Hotels / Hospitals / Peak period | +$5 |
| Eve or Public Holiday | +$5 |
| Specific time request | +$10 |

---

## Design System

Existing tokens used throughout:
- `font-display` (Playfair Display) for headings
- `font-body` (Lato) for all other text
- `bg-purple text-white` for primary CTAs
- `border-purple/15`, `bg-surface`, `bg-header` for surfaces
- `text-ink`, `text-ink/60` for text hierarchy
