-- =========================================================
-- Ray's Collection — Supabase setup
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- =========================================================

-- ---------- 1. Products table ----------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text,
  category    text,
  price       text,
  description text not null,
  image       text,
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone (including visitors who aren't logged in) can read the catalog.
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

-- Only the shop's admin account can add, edit, or remove products.
-- This is the real enforcement point — the frontend's email check
-- is just a UX nicety, this policy is what actually protects the data.
drop policy if exists "Admin can insert products" on public.products;
create policy "Admin can insert products"
  on public.products
  for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com');

drop policy if exists "Admin can update products" on public.products;
create policy "Admin can update products"
  on public.products
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com');

drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products"
  on public.products
  for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com');


-- ---------- 2. Storage bucket for product photos ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can view product photos (the bucket is public + this policy
-- covers the case where "public" alone isn't enough for some clients).
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Only the admin account can upload / replace / delete photos.
drop policy if exists "Admin can upload product images" on storage.objects;
create policy "Admin can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com'
  );

drop policy if exists "Admin can update product images" on storage.objects;
create policy "Admin can update product images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com'
  );

drop policy if exists "Admin can delete product images" on storage.objects;
create policy "Admin can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (auth.jwt() ->> 'email') = 'yeboahrachel383@gmail.com'
  );


-- ---------- 3. Seed the starting catalog (optional) ----------
-- Safe to re-run: only inserts if the table is empty.
insert into public.products (name, brand, category, price, description, image, in_stock)
select * from (values
  ('NOW', 'Rave', 'Unisex', '', 'A bold, magnetic eau de parfum in a sleek geometric bottle — modern, confident, unforgettable.', 'images/now-rave.jpg', true),
  ('Eclaire', 'Diese', 'For Her', '', 'Warm and radiant, with a soft golden trail that lingers — poured in a sculpted heart-shaped flacon.', 'images/eclaire.jpg', true),
  ('Morning of Camellias', '', 'For Her', '', 'A delicate floral opening inspired by camellia blossoms at first light — fresh, tender, elegant.', 'images/morning-of-camellias.jpg', true),
  ('Paris Purple', '', 'For Her', '', 'A rich, velvety fragrance wrapped in violet and amber notes — Parisian glamour in every spray.', 'images/paris-purple.jpg', true),
  ('Noble Black', 'Hanna''s Secret', 'For Him', '', 'Deep, distinguished and smoky — a signature scent for the man who commands a room.', 'images/noble-black.jpg', true),
  ('Royal Seduction Secret', 'Hanna''s Secret', 'For Her', '', 'Sensual and mysterious, built around dark florals and a whisper of spice.', 'images/royal-seduction-secret.jpg', true),
  ('Elea', '', 'For Her', '', 'A luminous, crystal-cut bottle holding a soft floral-fruity blend — light, graceful, timeless.', 'images/elea.jpg', true),
  ('Club de Nuit Intense', 'Armaf', 'For Him', '', 'A cult-favourite oriental fragrance — intense, long-lasting and instantly recognisable.', 'images/club-de-nuit-intense.jpg', true),
  ('Red Elve', 'Hanna''s Secret', 'Unisex', '', 'A daring, spicy-sweet composition in a deep red box — for the bold at heart.', 'images/red-elve.jpg', true),
  ('Bloom for Love', '', 'For Her', '', 'A romantic bouquet of blooming petals — soft, pretty, and made for everyday elegance.', 'images/bloom-for-love.jpg', true),
  ('Blue Snow Whisper', 'Vzyca', 'For Her', '', 'A cool, powdery floral in a violet-blue bottle — quiet, fresh and gently sweet.', 'images/blue-snow-whisper.jpg', true),
  ('Vibrant Tulips', 'Vzyca', 'For Her', '', 'Cheerful and bright, wrapped in painted tulip artwork — a fresh floral pick-me-up.', 'images/vibrant-tulips.jpg', true),
  ('Violet', '', 'For Her', '', 'Soft purple florals and a hint of powder — gentle, romantic and easy to wear daily.', 'images/violet.jpg', true),
  ('Royal', 'Hanna''s Secret', 'For Him', '', 'A limited-edition blend in a rich amber bottle — warm, refined, and quietly luxurious.', 'images/royal-hannas-secret.jpg', true),
  ('Hayati', 'Rafah', 'Unisex', '', 'Meaning ''my life'' — a natural spray eau de parfum with a soft, comforting signature scent.', 'images/hayati.jpg', true)
) as seed(name, brand, category, price, description, image, in_stock)
where not exists (select 1 from public.products);
