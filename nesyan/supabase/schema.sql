-- ============================================================
--  NESYAN — قاعدة بيانات متجر نسيان للعطور (Supabase)
--  شغّلي الملف ده كله مرة واحدة من SQL Editor — آمن لو اتشغّل أكتر من مرة
-- ============================================================

-- 1) الأدمن
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- 2) أقسام الموقع (الواجهة، البانرات، التواصل، الشحن…) — كل قسم صف واحد
create table if not exists public.blocks (key text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());

-- 3) العطور
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null, name_en text,
  tagline_ar text, tagline_en text,
  description_ar text, description_en text,
  gender text not null default 'unisex', family text not null default 'oud', concentration text,
  sizes text,                                   -- كل سطر: الحجم | السعر | قبل الخصم
  notes_top_ar text, notes_top_en text, notes_heart_ar text, notes_heart_en text, notes_base_ar text, notes_base_en text,
  image_url text, box_url text, gallery text, inspired boolean not null default false,
  year int, longevity int, sillage int,
  is_new boolean not null default false, is_bestseller boolean not null default false, is_exclusive boolean not null default false, featured boolean not null default false,
  in_stock boolean not null default true, active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.products add column if not exists inspired boolean not null default false;

-- 4) الطلبات
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (char_length(code) between 4 and 30),
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  name text not null check (char_length(name) between 1 and 150),
  phone text not null check (char_length(phone) between 6 and 20),
  email text check (char_length(email) <= 200),
  governorate text check (char_length(governorate) <= 60),
  city text check (char_length(city) <= 150),
  address text check (char_length(address) <= 600),
  notes text check (char_length(notes) <= 1200),
  payment text not null default 'cod' check (payment in ('cod','transfer')),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 60),
  subtotal numeric not null default 0 check (subtotal >= 0), shipping numeric not null default 0 check (shipping >= 0), total numeric not null default 0 check (total >= 0),
  lang text,
  created_at timestamptz default now()
);

-- 5) الرسائل + المشتركين في النشرة
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'contact',
  name text not null check (char_length(name) between 1 and 150),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  body text check (char_length(body) <= 5000),
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
--  الصلاحيات: الزوار يقروا المحتوى الظاهر ويبعتوا طلبات ورسائل بس، والأدمن يعمل كل حاجة
-- ============================================================
alter table public.admin_users enable row level security;
drop policy if exists "admin reads admins" on public.admin_users;
create policy "admin reads admins" on public.admin_users for select using (public.is_admin());

alter table public.blocks enable row level security;
drop policy if exists "public read blocks" on public.blocks;
create policy "public read blocks" on public.blocks for select using (true);
drop policy if exists "admin write blocks" on public.blocks;
create policy "admin write blocks" on public.blocks for all using (public.is_admin()) with check (public.is_admin());

alter table public.products enable row level security;
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (active or public.is_admin());
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all using (public.is_admin()) with check (public.is_admin());

alter table public.orders enable row level security;
drop policy if exists "anyone can order" on public.orders;
create policy "anyone can order" on public.orders for insert with check (status = 'new');
drop policy if exists "admin reads orders" on public.orders;
create policy "admin reads orders" on public.orders for select using (public.is_admin());
drop policy if exists "admin updates orders" on public.orders;
create policy "admin updates orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes orders" on public.orders;
create policy "admin deletes orders" on public.orders for delete using (public.is_admin());

alter table public.messages enable row level security;
drop policy if exists "anyone can send" on public.messages;
create policy "anyone can send" on public.messages for insert with check (is_read = false);
drop policy if exists "admin reads messages" on public.messages;
create policy "admin reads messages" on public.messages for select using (public.is_admin());
drop policy if exists "admin updates messages" on public.messages;
create policy "admin updates messages" on public.messages for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes messages" on public.messages;
create policy "admin deletes messages" on public.messages for delete using (public.is_admin());

-- ============================================================
--  مكان رفع الصور
-- ============================================================
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ============================================================
--  المحتوى الأولي (بيتحط مرة واحدة بس — مش بيمسح تعديلاتك)
-- ============================================================
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$naxos$q$, $q$ناكسوس$q$, $q$Naxos$q$, $q$فخامة إيطالية .. مزيج من الدخان والعسل والفواكه الراقية$q$, $q$Italian luxury — a blend of smoke, honey and fine fruits$q$, $q$فخامة إيطالية .. مزيج من الدخان والعسل والفواكه الراقية.

عطر رجالي فاخر ومنعش بتركيز عالي وثبات يدوم طويلًا — لكل المناسبات نهارًا ومساءً، بجودة عالية ولمسة نسيان. الحجم 50 مل.$q$, $q$Italian luxury — a blend of smoke, honey and fine fruits.

A men’s scent, luxurious and fresh, with high concentration and long-lasting wear — for every occasion, day and night. High quality with the Nesyan touch. 50 ml.$q$, $q$men$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$لافندر، برغموت، ليمون، عسل$q$, $q$Lavender, Bergamot, Lemon, Honey$q$, $q$أوراق التبغ، القرفة، الياسمين، الكشمير$q$, $q$Tobacco, Cinnamon, Jasmine, Cashmeran$q$, $q$الفانيليا، حبوب التونكا، العنبر، خشب الصندل$q$, $q$Vanilla, Tonka Bean, Amber, Sandalwood$q$, $q$/products/naxos-bottle.webp$q$, $q$/products/naxos-box.webp$q$, $q$/products/naxos-duo.webp
/media/posters/naxos.webp$q$, null, 0, 0, true, false, true, true, true, false, true, 1) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$paradigme$q$, $q$بارادايم$q$, $q$Paradigme$q$, $q$أناقة عصرية .. توازن بين الحميمية والتوابل والدفء الخشبي$q$, $q$Modern elegance — intimacy, spice and woody warmth in balance$q$, $q$أناقة عصرية .. توازن بين الحميمية والتوابل والدفء الخشبي.

عطر رجالي فاخر ومنعش بتركيز عالي وثبات يدوم طويلًا — لكل المناسبات نهارًا ومساءً، بجودة عالية ولمسة نسيان. الحجم 50 مل.$q$, $q$Modern elegance — intimacy, spice and woody warmth in balance.

A men’s scent, luxurious and fresh, with high concentration and long-lasting wear — for every occasion, day and night. High quality with the Nesyan touch. 50 ml.$q$, $q$men$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$برغموت، الفلفل الوردي، الجريب فروت، لافندر$q$, $q$Bergamot, Pink Pepper, Grapefruit, Lavender$q$, $q$لافندر، جيرانيوم، مريمية، ياسمين$q$, $q$Lavender, Geranium, Sage, Jasmine$q$, $q$خشب الأرز، عنبر، مسك، فانيليا$q$, $q$Cedarwood, Amber, Musk, Vanilla$q$, $q$/products/paradigme-bottle.webp$q$, $q$/products/paradigme-box.webp$q$, $q$/products/paradigme-duo.webp
/media/posters/paradigme.webp$q$, null, 0, 0, true, false, true, true, true, false, true, 2) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$40-knots$q$, $q$فورتي نوتس$q$, $q$40 Knots$q$, $q$رحلة بحرية ممتعة .. حيث يلتقي البحر بالحرية$q$, $q$A joyful sea voyage — where the sea meets freedom$q$, $q$رحلة بحرية ممتعة .. حيث يلتقي البحر بالحرية.

عطر رجالي فاخر ومنعش بتركيز عالي وثبات يدوم طويلًا — لكل المناسبات نهارًا ومساءً، بجودة عالية ولمسة نسيان. الحجم 50 مل.$q$, $q$A joyful sea voyage — where the sea meets freedom.

A men’s scent, luxurious and fresh, with high concentration and long-lasting wear — for every occasion, day and night. High quality with the Nesyan touch. 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$نوتات بحرية، حمضيات، أوراق خضراء، برغموت$q$, $q$Marine Notes, Citrus, Green Notes, Bergamot$q$, $q$لافندر، أروماتك عطرية، هيل، البنفسج$q$, $q$Lavender, Aromatic Notes, Cardamom, Violet$q$, $q$خشب الأرز، عنبر، مسك، فانيليا$q$, $q$Cedarwood, Amber, Musk, Vanilla$q$, $q$/products/40-knots-bottle.webp$q$, $q$/products/40-knots-box.webp$q$, $q$/products/40-knots-duo.webp
/media/posters/40-knots.webp$q$, null, 0, 0, true, false, true, true, true, false, true, 3) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$arabians-tonka$q$, $q$أرابيانز تونكا$q$, $q$Arabians Tonka$q$, $q$دفء شرقي غني .. جوهر تونكا يلامس الحواس ويترك أثرًا لا يُنسى$q$, $q$Rich oriental warmth — a tonka essence that leaves an unforgettable trail$q$, $q$دفء شرقي غني .. جوهر تونكا يلامس الحواس ويترك أثرًا لا يُنسى.

عطر رجالي فاخر ومنعش بتركيز عالي وثبات يدوم طويلًا — لكل المناسبات نهارًا ومساءً، بجودة عالية ولمسة نسيان. الحجم 50 مل.$q$, $q$Rich oriental warmth — a tonka essence that leaves an unforgettable trail.

A men’s scent, luxurious and fresh, with high concentration and long-lasting wear — for every occasion, day and night. High quality with the Nesyan touch. 50 ml.$q$, $q$men$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$زعفران، هيل، برغموت$q$, $q$Saffron, Cardamom, Bergamot$q$, $q$ورد، خشب الأرز، فول التونكا$q$, $q$Rose, Cedarwood, Tonka Bean$q$, $q$عنبر، مسك، فانيليا$q$, $q$Amber, Musk, Vanilla$q$, $q$/products/arabians-tonka-bottle.webp$q$, $q$/products/arabians-tonka-box.webp$q$, $q$/products/arabians-tonka-duo.webp
/media/posters/arabians-tonka.webp$q$, null, 0, 0, true, false, true, true, true, false, true, 4) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$versace-eros$q$, $q$فيرساتشي إيروس$q$, $q$Versace Eros$q$, $q$منعش · حلو · جريء$q$, $q$Fresh · Sweet · Bold$q$, $q$عطر رجالي مستوحى من Versace Eros — منعش، حلو، جريء.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Versace Eros — fresh, sweet, bold.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/versace-eros-bottle.webp$q$, $q$/products/versace-eros-box.webp$q$, $q$/products/versace-eros-duo.webp$q$, null, 0, 0, false, true, false, false, true, true, true, 5) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$erba-pura$q$, $q$إربا بورا$q$, $q$Erba Pura$q$, $q$فاكهي · استوائي · فاخر$q$, $q$Fruity · Tropical · Luxurious$q$, $q$عطر رجالي مستوحى من Erba Pura — فاكهي، استوائي، فاخر.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Erba Pura — fruity, tropical, luxurious.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/erba-pura-bottle.webp$q$, $q$/products/erba-pura-box.webp$q$, $q$/products/erba-pura-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 6) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$issey-miyake$q$, $q$إيسي مياكي$q$, $q$Issey Miyake$q$, $q$منعش · أخضر · مائي$q$, $q$Fresh · Green · Aquatic$q$, $q$عطر رجالي مستوحى من Issey Miyake — منعش، أخضر، مائي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Issey Miyake — fresh, green, aquatic.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/issey-miyake-bottle.webp$q$, $q$/products/issey-miyake-box.webp$q$, $q$/products/issey-miyake-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 7) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$acqua-di-gio$q$, $q$أكوا دي جيو$q$, $q$Acqua di Giò$q$, $q$منعش · مائي · كلاسيكي$q$, $q$Fresh · Aquatic · Classic$q$, $q$عطر رجالي مستوحى من Acqua di Giò — منعش، مائي، كلاسيكي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Acqua di Giò — fresh, aquatic, classic.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/acqua-di-gio-bottle.webp$q$, $q$/products/acqua-di-gio-box.webp$q$, $q$/products/acqua-di-gio-duo.webp$q$, null, 0, 0, false, false, false, true, true, true, true, 8) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$invictus$q$, $q$إنفيكتوس$q$, $q$Invictus$q$, $q$منعش · بحري · رياضي$q$, $q$Fresh · Marine · Sporty$q$, $q$عطر رجالي مستوحى من Invictus — منعش، بحري، رياضي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Invictus — fresh, marine, sporty.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/invictus-bottle.webp$q$, $q$/products/invictus-box.webp$q$, $q$/products/invictus-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 9) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$imperial-valley$q$, $q$إمبريال فالي$q$, $q$Imperial Valley$q$, $q$أروماتك · فواكهي · منعش$q$, $q$Aromatic · Fruity · Fresh$q$, $q$عطر رجالي مستوحى من Imperial Valley — أروماتك، فواكهي، منعش.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Imperial Valley — aromatic, fruity, fresh.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/imperial-valley-bottle.webp$q$, $q$/products/imperial-valley-box.webp$q$, $q$/products/imperial-valley-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 10) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$hibiscus-mahajad$q$, $q$هيبيسكوس مهجاد$q$, $q$Hibiscus Mahajád$q$, $q$فاكهي · زهري · مميز$q$, $q$Fruity · Floral · Distinctive$q$, $q$عطر رجالي مستوحى من Hibiscus Mahajád — فاكهي، زهري، مميز.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Hibiscus Mahajád — fruity, floral, distinctive.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$summer$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/hibiscus-mahajad-bottle.webp$q$, $q$/products/hibiscus-mahajad-box.webp$q$, $q$/products/hibiscus-mahajad-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 11) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$creed-aventus$q$, $q$كريد أفينتوس$q$, $q$Creed Aventus$q$, $q$فاكهي · خشبي · راقي$q$, $q$Fruity · Woody · Refined$q$, $q$عطر رجالي مستوحى من Creed Aventus — فاكهي، خشبي، راقي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Creed Aventus — fruity, woody, refined.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/creed-aventus-bottle.webp$q$, $q$/products/creed-aventus-box.webp$q$, $q$/products/creed-aventus-duo.webp$q$, null, 0, 0, false, true, false, true, true, true, true, 12) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$born-in-roma$q$, $q$فالنتينو أومو بورن إن روما$q$, $q$Valentino Uomo Born in Roma$q$, $q$أروماتك · عصري · أنيق$q$, $q$Aromatic · Modern · Elegant$q$, $q$عطر رجالي مستوحى من Valentino Uomo Born in Roma — أروماتك، عصري، أنيق.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Valentino Uomo Born in Roma — aromatic, modern, elegant.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/born-in-roma-bottle.webp$q$, $q$/products/born-in-roma-box.webp$q$, $q$/products/born-in-roma-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 13) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$stronger-with-you-intensely$q$, $q$سترونجر ويذ يو إنتنسلي$q$, $q$Stronger With You Intensely$q$, $q$شرقي · فانيلا · دافئ$q$, $q$Oriental · Vanilla · Warm$q$, $q$عطر رجالي مستوحى من Stronger With You Intensely — شرقي، فانيلا، دافئ.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Stronger With You Intensely — oriental, vanilla, warm.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/stronger-with-you-intensely-bottle.webp$q$, $q$/products/stronger-with-you-intensely-box.webp$q$, $q$/products/stronger-with-you-intensely-duo.webp$q$, null, 0, 0, false, true, false, false, true, true, true, 14) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$one-million$q$, $q$وان مليون$q$, $q$1 Million$q$, $q$توابل · حلو · فخم$q$, $q$Spicy · Sweet · Lavish$q$, $q$عطر للجنسين مستوحى من 1 Million — توابل، حلو، فخم.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by 1 Million — spicy, sweet, lavish.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/one-million-bottle.webp$q$, $q$/products/one-million-box.webp$q$, $q$/products/one-million-duo.webp$q$, null, 0, 0, false, true, false, false, true, true, true, 15) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$ultramale$q$, $q$ألترامال$q$, $q$Ultramale$q$, $q$شرقي · حلو · جريء$q$, $q$Oriental · Sweet · Bold$q$, $q$عطر رجالي مستوحى من Ultramale — شرقي، حلو، جريء.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A men’s scent inspired by Ultramale — oriental, sweet, bold.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$men$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/ultramale-bottle.webp$q$, $q$/products/ultramale-box.webp$q$, $q$/products/ultramale-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 16) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$asad$q$, $q$أسد$q$, $q$Asad$q$, $q$شرقي · دافئ · جذاب$q$, $q$Oriental · Warm · Magnetic$q$, $q$عطر للجنسين مستوحى من Asad — شرقي، دافئ، جذاب.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Asad — oriental, warm, magnetic.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/asad-bottle.webp$q$, $q$/products/asad-box.webp$q$, $q$/products/asad-duo.webp$q$, null, 0, 0, false, true, false, false, true, true, true, 17) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$rose-vanille$q$, $q$روز فانيلا$q$, $q$Rose Vanille$q$, $q$زهري · فانيلا · رومانسي$q$, $q$Floral · Vanilla · Romantic$q$, $q$عطر حريمي مستوحى من Rose Vanille — زهري، فانيلا، رومانسي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A women’s scent inspired by Rose Vanille — floral, vanilla, romantic.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$women$q$, $q$allseason$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/rose-vanille-bottle.webp$q$, $q$/products/rose-vanille-box.webp$q$, $q$/products/rose-vanille-duo.webp$q$, null, 0, 0, false, false, false, true, true, true, true, 18) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$oud-madawi$q$, $q$عود مداوي$q$, $q$Oud Madawi$q$, $q$عودي · خشبي · فاخر$q$, $q$Oud · Woody · Luxurious$q$, $q$عطر للجنسين مستوحى من Oud Madawi — عودي، خشبي، فاخر.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Oud Madawi — oud, woody, luxurious.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/oud-madawi-bottle.webp$q$, $q$/products/oud-madawi-box.webp$q$, $q$/products/oud-madawi-duo.webp$q$, null, 0, 0, false, true, false, true, true, true, true, 19) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$oud-isfahan$q$, $q$عود أصفهان$q$, $q$Oud Isfahan$q$, $q$عودي · دافئ · شرقي$q$, $q$Oud · Warm · Oriental$q$, $q$عطر للجنسين مستوحى من Oud Isfahan — عودي، دافئ، شرقي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Oud Isfahan — oud, warm, oriental.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/oud-isfahan-bottle.webp$q$, $q$/products/oud-isfahan-box.webp$q$, $q$/products/oud-isfahan-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 20) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$oud-bouquet$q$, $q$عود بوكيه$q$, $q$Oud Bouquet$q$, $q$عودي · زهري · راقي$q$, $q$Oud · Floral · Refined$q$, $q$عطر للجنسين مستوحى من Oud Bouquet — عودي، زهري، راقي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Oud Bouquet — oud, floral, refined.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/oud-bouquet-bottle.webp$q$, $q$/products/oud-bouquet-box.webp$q$, $q$/products/oud-bouquet-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 21) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$black-orchid$q$, $q$بلاك أوركيد$q$, $q$Black Orchid$q$, $q$شرقي · شوكولاتة · غامض$q$, $q$Oriental · Chocolate · Mysterious$q$, $q$عطر للجنسين مستوحى من Black Orchid — شرقي، شوكولاتة، غامض.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Black Orchid — oriental, chocolate, mysterious.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/black-orchid-bottle.webp$q$, $q$/products/black-orchid-box.webp$q$, $q$/products/black-orchid-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 22) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$aventus-absolu$q$, $q$كريد أفينتوس أبسولو$q$, $q$Creed Aventus Absolu$q$, $q$فاكهي · مدخّن · فاخر$q$, $q$Fruity · Smoky · Luxurious$q$, $q$عطر للجنسين مستوحى من Creed Aventus Absolu — فاكهي، مدخّن، فاخر.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Creed Aventus Absolu — fruity, smoky, luxurious.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/aventus-absolu-bottle.webp$q$, $q$/products/aventus-absolu-box.webp$q$, $q$/products/aventus-absolu-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 23) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$khamrah-qahwa$q$, $q$خمرة قهوة$q$, $q$Khamrah Qahwa$q$, $q$قهوة · فانيلا · دافئ$q$, $q$Coffee · Vanilla · Warm$q$, $q$عطر للجنسين مستوحى من Khamrah Qahwa — قهوة، فانيلا، دافئ.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Khamrah Qahwa — coffee, vanilla, warm.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/khamrah-qahwa-bottle.webp$q$, $q$/products/khamrah-qahwa-box.webp$q$, $q$/products/khamrah-qahwa-duo.webp$q$, null, 0, 0, false, true, false, true, true, true, true, 24) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$oud-al-wisam$q$, $q$عود الوسام$q$, $q$Oud Al Wisam$q$, $q$عودي · خشبي · شرقي$q$, $q$Oud · Woody · Oriental$q$, $q$عطر للجنسين مستوحى من Oud Al Wisam — عودي، خشبي، شرقي.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A unisex scent inspired by Oud Al Wisam — oud, woody, oriental.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$unisex$q$, $q$winter$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/oud-al-wisam-bottle.webp$q$, $q$/products/oud-al-wisam-box.webp$q$, $q$/products/oud-al-wisam-duo.webp$q$, null, 0, 0, false, false, true, false, true, true, true, 25) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$white-oud$q$, $q$وايت عود$q$, $q$White Oud$q$, $q$أبيض · مسكي · فاخر$q$, $q$White · Musky · Luxurious$q$, $q$عطر حريمي مستوحى من White Oud — أبيض، مسكي، فاخر.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A women’s scent inspired by White Oud — white, musky, luxurious.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$women$q$, $q$night$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/white-oud-bottle.webp$q$, $q$/products/white-oud-box.webp$q$, $q$/products/white-oud-duo.webp$q$, null, 0, 0, false, false, true, false, true, true, true, 26) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$born-in-roma-intense$q$, $q$بورن إن روما إنتنس (حريمي)$q$, $q$Born in Roma Intense (W)$q$, $q$زهري · فانيلا · أنيق$q$, $q$Floral · Vanilla · Elegant$q$, $q$عطر حريمي مستوحى من Born in Roma Intense (W) — زهري، فانيلا، أنيق.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A women’s scent inspired by Born in Roma Intense (W) — floral, vanilla, elegant.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$women$q$, $q$night$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/born-in-roma-intense-bottle.webp$q$, $q$/products/born-in-roma-intense-box.webp$q$, $q$/products/born-in-roma-intense-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 27) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$khamrah-waha$q$, $q$خمرة واحة$q$, $q$Khamrah Waha$q$, $q$شهي · فانيلا · دافئ$q$, $q$Delicious · Vanilla · Warm$q$, $q$عطر حريمي مستوحى من Khamrah Waha — شهي، فانيلا، دافئ.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A women’s scent inspired by Khamrah Waha — delicious, vanilla, warm.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$women$q$, $q$night$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/khamrah-waha-bottle.webp$q$, $q$/products/khamrah-waha-box.webp$q$, $q$/products/khamrah-waha-duo.webp$q$, null, 0, 0, false, false, false, false, true, true, true, 28) on conflict (slug) do nothing;
insert into public.products (slug, name_ar, name_en, tagline_ar, tagline_en, description_ar, description_en, gender, family, concentration, sizes, notes_top_ar, notes_top_en, notes_heart_ar, notes_heart_en, notes_base_ar, notes_base_en, image_url, box_url, gallery, year, longevity, sillage, is_new, is_bestseller, is_exclusive, featured, in_stock, inspired, active, sort_order) values ($q$scandal$q$, $q$سكاندال$q$, $q$Scandal$q$, $q$زهري · حلو · جذاب$q$, $q$Floral · Sweet · Magnetic$q$, $q$عطر حريمي مستوحى من Scandal — زهري، حلو، جذاب.

تركيز عالي، ثبات يدوم طويلًا وفوحان مميز. الحجم المتاح 50 مل للاستخدام الخاص.$q$, $q$A women’s scent inspired by Scandal — floral, sweet, magnetic.

High concentration, long-lasting wear and strong projection. Available in 50 ml.$q$, $q$women$q$, $q$night$q$, $q$$q$, $q$50 مل | 0$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$$q$, $q$/products/scandal-bottle.webp$q$, $q$/products/scandal-box.webp$q$, $q$/products/scandal-duo.webp$q$, null, 0, 0, false, true, false, true, true, true, true, 29) on conflict (slug) do nothing;

insert into public.blocks (key, data) values ('home', $q${"sections":"hero\ntagline\ncategories\nnovelties\neditorial\ntiles\nbanner\narrivals\ndiscovery\nsplits\ntryme\ndarktiles"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('announce', $q${"items_ar":"عطر يبقى في الذاكرة .. لحظات لا تُنسى برائحة تدوم\nتركيز عالي · ثبات طويل · فوحان مميز\nاطلب الآن على واتساب 01105224649","items_en":"A scent that stays in memory — unforgettable moments\nHigh concentration · Long lasting · Strong projection\nOrder now on WhatsApp 01105224649"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('hero', $q${"images":"/media/hero-1.webp\n/media/hero-2.webp\n/media/hero-3.webp","slides_ar":"أرابيانز تونكا | دفء شرقي غني .. يترك أثرًا لا يُنسى\nناكسوس | فخامة إيطالية .. الدخان والعسل والفواكه الراقية\nفورتي نوتس | رحلة بحرية .. حيث يلتقي البحر بالحرية","slides_en":"Arabians Tonka | Rich oriental warmth — an unforgettable trail\nNaxos | Italian luxury — smoke, honey and fine fruits\n40 Knots | A sea voyage — where the sea meets freedom","links":"/p/arabians-tonka\n/p/naxos\n/p/40-knots","button_ar":"اكتشف العطر","button_en":"Discover"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('tagline', $q${"title_ar":"عطر .. لا يُنسى","title_en":"A scent .. unforgettable"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('categories', $q${"items":"حريمي | Women | /shop?gender=women | /products/rose-vanille-bottle.webp | #f3dfe0\nرجالي | Men | /shop?gender=men | /products/creed-aventus-bottle.webp | #ece4d2\nللجنسين | Unisex | /shop?gender=unisex | /products/oud-madawi-bottle.webp | #eadccb\nصيفية | Summer | /shop?family=summer | /products/acqua-di-gio-bottle.webp | #e3eef2\nلجميع الفصول | All season | /shop?family=allseason | /products/one-million-bottle.webp | #f1e6cf\nشتوية | Winter | /shop?family=winter | /products/khamrah-qahwa-bottle.webp | #e8dacb\nليلية | Night | /shop?family=night | /products/white-oud-bottle.webp | #e9e1ec"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('novelties', $q${"title_ar":"إصدارات نسيان","title_en":"Nesyan editions"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('editorial', $q${"e1_image_url":"/media/edit-1.webp","e1_title_ar":"ناكسوس","e1_title_en":"Naxos","e1_text_ar":"فخامة إيطالية .. مزيج من الدخان والعسل والفواكه الراقية.","e1_text_en":"Italian luxury — a blend of smoke, honey and fine fruits.","e1_link_ar":"اكتشف ناكسوس","e1_link_en":"Discover Naxos","e1_link":"/p/naxos","e2_image_url":"/media/edit-2.webp","e2_title_ar":"بارادايم","e2_title_en":"Paradigme","e2_text_ar":"أناقة عصرية .. توازن بين الحميمية والتوابل والدفء الخشبي.","e2_text_en":"Modern elegance — intimacy, spice and woody warmth in balance.","e2_link_ar":"اكتشف بارادايم","e2_link_en":"Discover Paradigme","e2_link":"/p/paradigme"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('tiles', $q${"items":"/media/tile-1.webp | عطور صيفية ومنعشة | Summer & Fresh | 7 عطور | 7 scents | /shop?family=summer\n/media/tile-2.webp | لجميع الفصول | All Season | 7 عطور | 7 scents | /shop?family=allseason\n/media/tile-3.webp | شتوية ودافئة | Winter & Warm | 7 عطور | 7 scents | /shop?family=winter\n/media/tile-4.webp | ليلية فاخرة | Winter & Night | 4 عطور | 4 scents | /shop?family=night\n/media/tile-5.webp | خمرة قهوة | Khamrah Qahwa | قهوة · فانيلا · دافئ | Coffee · Vanilla · Warm | /p/khamrah-qahwa\n/media/tile-6.webp | روز فانيلا | Rose Vanille | زهري · فانيلا · رومانسي | Floral · Vanilla · Romantic | /p/rose-vanille"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('banner', $q${"image_url":"/media/banner.webp","eyebrow_ar":"متوفرة الآن!","eyebrow_en":"Now available!","title_ar":"مجموعة العود الشتوية","title_en":"The Winter Oud Collection","link":"/shop?family=winter"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('arrivals', $q${"eyebrow_ar":"المجموعة المتاحة","eyebrow_en":"Available collection","title_ar":"تسوّق عطور نسيان","title_en":"Shop Nesyan perfumes"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('discovery', $q${"image_url":"/media/discovery.webp","title_ar":"مجموعة العطور المتاحة","title_en":"The available collection","text_ar":"25 عطر مستوحى + إصدارات نسيان الخاصة — الحجم المتاح 50 مل.","text_en":"25 inspired scents + Nesyan’s own editions — available in 50 ml.","products":"naxos\nparadigme\n40-knots\narabians-tonka"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('splits', $q${"s1_image_url":"/media/split-1.webp","s1_title_ar":"عطور صيفية ومنعشة","s1_title_en":"Summer & Fresh","s1_text_ar":"تسوّق المجموعة","s1_text_en":"Shop the collection","s1_link":"/shop?family=summer","s2_image_url":"/media/split-2.webp","s2_eyebrow_ar":"اكتشف المجموعة الليلية","s2_eyebrow_en":"Discover the night collection","s2_title_ar":"سكاندال","s2_title_en":"Scandal","s2_link":"/p/scandal"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('tryme', $q${"image_url":"/media/story.webp","title_ar":"اكتشف عطرك المميز","title_en":"Find your signature scent","text_ar":"مش عارف تختار؟ جاوب على 3 أسئلة بسيطة وهنرشّحلك العطور الأنسب لذوقك من مجموعة نسيان.\n\nكل عطورنا بتركيز عالي، وثبات يدوم طويلًا، وفوحان مميز.\n\nأو كلّمنا على واتساب وهنساعدك تختار عطرك.","text_en":"Not sure what to choose? Answer 3 simple questions and we will suggest the scents that suit you best from the Nesyan collection.\n\nAll our perfumes have high concentration, long-lasting wear and strong projection.\n\nOr message us on WhatsApp and we will help you choose.","button_ar":"اكتشف عطرك المميز","button_en":"Find my signature scent"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('darktiles', $q${"t1_image_url":"/media/dark-1.webp","t1_title_ar":"عطور ليلية فاخرة","t1_title_en":"Luxurious night scents","t1_text_ar":"لحظات لا تُنسى .. برائحة تدوم","t1_text_en":"Unforgettable moments — a lasting scent","t1_button_ar":"تسوّق المجموعة","t1_button_en":"Shop the collection","t1_link":"/shop?family=night","t2_image_url":"/media/dark-2.webp","t2_title_ar":"اطلب على واتساب","t2_title_en":"Order on WhatsApp","t2_text_ar":"01105224649","t2_text_en":"+20 110 522 4649","t2_button_ar":"تواصل معنا","t2_button_en":"Contact us","t2_link":"/contact"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('services', $q${"items_ar":"shield | تصنيع بعناية\ndrop | تركيبات مستوحاة أصلية\nspark | فوحان مميز\nclock | ثبات عالي يدوم طويلًا\nsample | الحجم المتاح 50 مل\nchat | اطلب بسهولة على واتساب","items_en":"shield | Carefully crafted\ndrop | Inspired scents\nspark | Strong projection\nclock | Long lasting\nsample | Available in 50 ml\nchat | Easy ordering on WhatsApp"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('about', $q${"hero_image_url":"/media/story.webp","title_ar":"عطر يبقى في الذاكرة","title_en":"A scent that stays in memory","text_ar":"نسيان .. عطر لا يُنسى. لحظات لا تُنسى برائحة تدوم.\n\nنقدّم مجموعة من العطور المستوحاة من أشهر العطور العالمية — صيفية ومنعشة، ولجميع الفصول، وشتوية ودافئة، وليلية فاخرة — بتركيز عالي وثبات يدوم طويلًا وفوحان مميز.\n\nوإلى جانبها إصدارات نسيان الخاصة: ناكسوس، بارادايم، فورتي نوتس وأرابيانز تونكا.","text_en":"Nesyan — a scent .. unforgettable. Unforgettable moments with a lasting scent.\n\nWe offer a collection inspired by the world’s most famous perfumes — summer & fresh, all season, winter & warm and winter & night — with high concentration, long-lasting wear and strong projection.\n\nAlongside them, Nesyan’s own editions: Naxos, Paradigme, 40 Knots and Arabians Tonka.","image2_url":"/media/posters/collection.webp","values_ar":"تصنيع بعناية | كل زجاجة مصنوعة بعناية\nتركيبات مستوحاة | من أشهر العطور العالمية\nثبات وفوحان | تركيز عالي يدوم طويلًا","values_en":"Carefully crafted | Every bottle made with care\nInspired scents | From the world’s most famous perfumes\nLasting & projecting | High concentration that lasts"}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('shop', $q${"shipping_fee":0,"free_shipping_over":0,"note_ar":"هنكلمك على واتساب لتأكيد الطلب ومصاريف الشحن.","note_en":"We will message you on WhatsApp to confirm your order and the shipping fee."}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('contact', $q${"phone":"01105224649","whatsapp":"201105224649","email":"","address_ar":"","address_en":"","hours_ar":"","hours_en":"","map_url":""}$q$::jsonb) on conflict (key) do nothing;
insert into public.blocks (key, data) values ('social', $q${"instagram":"https://www.instagram.com/nesyan.perfumes/","facebook":"","tiktok":"","snapchat":"","x":"","youtube":""}$q$::jsonb) on conflict (key) do nothing;

-- ============================================================
--  آخر خطوة: بعد ما تعملي يوزر من Authentication → Users، شغّلي السطر ده بإيميلك
-- ============================================================
-- insert into public.admin_users (user_id) select id from auth.users where lower(email) = lower('YOUR-EMAIL@example.com');
