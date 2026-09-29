-- ============================================================================
-- MIGRATION: Multiple products per order
--
-- Lets one order (one customer, one order number, one set of files) contain
-- several products — e.g. a keychain AND a photo frame for the same person
-- in one order. Adds a `line_items` array; each item carries its own
-- category, product, quantity, size, colour, and customization fields.
--
-- Existing single-product orders are converted into a one-item line_items
-- array automatically, so nothing is lost. The old category_text/
-- product_text/quantity/size/colour/customization_data columns are kept
-- (for now, unused going forward) rather than dropped, so this is safe to
-- run without any risk of losing data.
-- ============================================================================

alter table orders add column if not exists line_items jsonb not null default '[]'::jsonb;

update orders
set line_items = jsonb_build_array(
  jsonb_build_object(
    'category_text', category_text,
    'product_text', product_text,
    'quantity', quantity,
    'size', size,
    'colour', colour,
    'customization_data', coalesce(customization_data, '[]'::jsonb)
  )
)
where line_items = '[]'::jsonb
  and (category_text is not null or product_text is not null);
