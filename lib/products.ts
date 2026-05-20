import pool from './db';
import type { Category, ProductWithDetails, RawFormOption } from '@/types/product';

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query<Category>(
    `SELECT id, name, display_order, is_active
     FROM categories
     WHERE is_active = TRUE AND name != '_Logistics'
     ORDER BY display_order`
  );
  return rows;
}

export async function getProducts(categoryId?: string): Promise<ProductWithDetails[]> {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.category_id, p.category_name, p.name, p.description,
       p.source_page, p.display_order, p.is_active,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pv.id, 'product_id', pv.product_id, 'raw_option_id', pv.raw_option_id,
           'flavor', pv.flavor, 'size_label', pv.size_label, 'price_cents', pv.price_cents,
           'min_quantity', pv.min_quantity, 'max_quantity', pv.max_quantity,
           'is_active', pv.is_active, 'display_order', pv.display_order
         )) FILTER (WHERE pv.id IS NOT NULL), '[]'
       ) AS variants,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', i.id, 'filename', i.filename, 'alt_text', i.alt_text,
           'url', i.url, 'sha', i.sha
         )) FILTER (WHERE i.id IS NOT NULL), '[]'
       ) AS images,
       MIN(pv.price_cents) AS min_price_cents,
       MAX(pv.price_cents) AS max_price_cents
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
     LEFT JOIN product_image_links pil ON pil.product_id = p.id
     LEFT JOIN images i ON i.id = pil.image_id
     WHERE p.is_active = TRUE
       ${categoryId ? 'AND p.category_id = $1' : ''}
     GROUP BY p.id
     ORDER BY p.display_order`,
    categoryId ? [categoryId] : []
  );
  return rows as ProductWithDetails[];
}

export async function getProductByName(name: string): Promise<ProductWithDetails | null> {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.category_id, p.category_name, p.name, p.description,
       p.source_page, p.display_order, p.is_active,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pv.id, 'product_id', pv.product_id, 'raw_option_id', pv.raw_option_id,
           'flavor', pv.flavor, 'size_label', pv.size_label, 'price_cents', pv.price_cents,
           'min_quantity', pv.min_quantity, 'max_quantity', pv.max_quantity,
           'is_active', pv.is_active, 'display_order', pv.display_order
         )) FILTER (WHERE pv.id IS NOT NULL), '[]'
       ) AS variants,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', i.id, 'filename', i.filename, 'alt_text', i.alt_text,
           'url', i.url, 'sha', i.sha
         )) FILTER (WHERE i.id IS NOT NULL), '[]'
       ) AS images,
       MIN(pv.price_cents) AS min_price_cents,
       MAX(pv.price_cents) AS max_price_cents
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
     LEFT JOIN product_image_links pil ON pil.product_id = p.id
     LEFT JOIN images i ON i.id = pil.image_id
     WHERE p.is_active = TRUE AND LOWER(p.name) = LOWER($1)
     GROUP BY p.id`,
    [name]
  );
  return (rows[0] as ProductWithDetails) ?? null;
}

export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.category_id, p.category_name, p.name, p.description,
       p.source_page, p.display_order, p.is_active,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pv.id, 'product_id', pv.product_id, 'raw_option_id', pv.raw_option_id,
           'flavor', pv.flavor, 'size_label', pv.size_label, 'price_cents', pv.price_cents,
           'min_quantity', pv.min_quantity, 'max_quantity', pv.max_quantity,
           'is_active', pv.is_active, 'display_order', pv.display_order
         )) FILTER (WHERE pv.id IS NOT NULL), '[]'
       ) AS variants,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', i.id, 'filename', i.filename, 'alt_text', i.alt_text,
           'url', i.url, 'sha', i.sha
         )) FILTER (WHERE i.id IS NOT NULL), '[]'
       ) AS images,
       MIN(pv.price_cents) AS min_price_cents,
       MAX(pv.price_cents) AS max_price_cents
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
     LEFT JOIN product_image_links pil ON pil.product_id = p.id
     LEFT JOIN images i ON i.id = pil.image_id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return (rows[0] as ProductWithDetails) ?? null;
}

export async function getAdminProductById(id: string): Promise<ProductWithDetails | null> {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.category_id, p.category_name, p.name, p.description,
       p.source_page, p.display_order, p.is_active,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pv.id, 'product_id', pv.product_id, 'raw_option_id', pv.raw_option_id,
           'flavor', pv.flavor, 'size_label', pv.size_label, 'price_cents', pv.price_cents,
           'min_quantity', pv.min_quantity, 'max_quantity', pv.max_quantity,
           'is_active', pv.is_active, 'display_order', pv.display_order
         )) FILTER (WHERE pv.id IS NOT NULL), '[]'
       ) AS variants,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', i.id, 'filename', i.filename, 'alt_text', i.alt_text,
           'url', i.url, 'sha', i.sha
         )) FILTER (WHERE i.id IS NOT NULL), '[]'
       ) AS images,
       MIN(pv.price_cents) AS min_price_cents,
       MAX(pv.price_cents) AS max_price_cents
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     LEFT JOIN product_image_links pil ON pil.product_id = p.id
     LEFT JOIN images i ON i.id = pil.image_id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return (rows[0] as ProductWithDetails) ?? null;
}

export async function getAllProductsForAdmin(): Promise<(ProductWithDetails & { review_count: number })[]> {
  const { rows } = await pool.query(
    `SELECT
       p.id, p.category_id, p.category_name, p.name, p.description,
       p.source_page, p.display_order, p.is_active,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pv.id, 'flavor', pv.flavor, 'size_label', pv.size_label,
           'price_cents', pv.price_cents, 'is_active', pv.is_active
         )) FILTER (WHERE pv.id IS NOT NULL), '[]'
       ) AS variants,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', i.id, 'filename', i.filename, 'alt_text', i.alt_text
         )) FILTER (WHERE i.id IS NOT NULL), '[]'
       ) AS images,
       MIN(pv.price_cents) AS min_price_cents,
       MAX(pv.price_cents) AS max_price_cents,
       COUNT(DISTINCT r.id) FILTER (WHERE r.needs_review = TRUE) AS review_count
     FROM products p
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     LEFT JOIN product_image_links pil ON pil.product_id = p.id
     LEFT JOIN images i ON i.id = pil.image_id
     LEFT JOIN raw_form_options r ON r.product_id = p.id
     GROUP BY p.id
     ORDER BY p.source_page, p.display_order`
  );
  return rows as (ProductWithDetails & { review_count: number })[];
}

export async function getReviewItems(): Promise<RawFormOption[]> {
  const { rows } = await pool.query<RawFormOption>(
    `SELECT * FROM raw_form_options WHERE needs_review = TRUE ORDER BY source_page`
  );
  return rows;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function priceRange(min: number, max: number): string {
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}
