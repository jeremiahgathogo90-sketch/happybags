-- HappyBags Blog Section Supabase Setup
-- Run this in the Supabase SQL editor before publishing blog content.

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  author_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.blog_categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  og_image text,
  canonical_url text,
  noindex boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_categories_active_sort_idx
  on public.blog_categories (is_active, sort_order, name);

create index if not exists blog_posts_public_idx
  on public.blog_posts (status, published_at desc, created_at desc);

create index if not exists blog_posts_category_idx
  on public.blog_posts (category_id);

create index if not exists blog_posts_featured_idx
  on public.blog_posts (is_featured)
  where is_featured = true;

create or replace function public.happybags_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
      and coalesce(profiles.is_active, true) = true
  );
$$;

grant execute on function public.happybags_is_admin() to anon, authenticated;

create or replace function public.set_blog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_categories_updated_at on public.blog_categories;
create trigger set_blog_categories_updated_at
before update on public.blog_categories
for each row
execute function public.set_blog_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.set_blog_updated_at();

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

drop policy if exists "Public can read active blog categories" on public.blog_categories;
create policy "Public can read active blog categories"
on public.blog_categories
for select
using (is_active = true);

drop policy if exists "Admins can manage blog categories" on public.blog_categories;
create policy "Admins can manage blog categories"
on public.blog_categories
for all
using (public.happybags_is_admin())
with check (public.happybags_is_admin());

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
on public.blog_posts
for select
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts"
on public.blog_posts
for all
using (public.happybags_is_admin())
with check (public.happybags_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read blog images" on storage.objects;
create policy "Public can read blog images"
on storage.objects
for select
using (bucket_id = 'blog-images');

drop policy if exists "Admins can upload blog images" on storage.objects;
create policy "Admins can upload blog images"
on storage.objects
for insert
with check (bucket_id = 'blog-images' and public.happybags_is_admin());

drop policy if exists "Admins can update blog images" on storage.objects;
create policy "Admins can update blog images"
on storage.objects
for update
using (bucket_id = 'blog-images' and public.happybags_is_admin())
with check (bucket_id = 'blog-images' and public.happybags_is_admin());

drop policy if exists "Admins can delete blog images" on storage.objects;
create policy "Admins can delete blog images"
on storage.objects
for delete
using (bucket_id = 'blog-images' and public.happybags_is_admin());
