export interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  filename: string;
  alt_text: string | null;
  url: string | null;
  sha: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  raw_option_id: string | null;
  flavor: string | null;
  size_label: string | null;
  price_cents: number;
  min_quantity: number;
  max_quantity: number | null;
  is_active: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  category_name: string | null;
  name: string;
  description: string | null;
  source_page: number | null;
  display_order: number;
  is_active: boolean;
}

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  min_price_cents: number;
  max_price_cents: number;
}

export interface RawFormOption {
  id: string;
  product_id: string;
  source_page: number | null;
  question_text: string | null;
  question_type: string | null;
  row_name: string | null;
  raw_text: string | null;
  parsed_name: string | null;
  parsed_price: number | null;
  parsed_qty: number | null;
  parsed_unit: string | null;
  parsed_size: string | null;
  confidence: string | null;
  needs_review: boolean;
  notes: string | null;
  image_filenames: string | null;
}
