# Blog Section Implementation Guide

Date: 2026-05-29  
Branch: GLV

## What This Commit Adds

This work adds a blog section to the HappyBags website.

New customer-facing pages:

```text
/blog
/blog/:slug
```

New admin page:

```text
/admin/blog
```

New Supabase setup file:

```text
supabase/blog-section-setup.sql
```

## Files Changed

```text
src/App.jsx
src/components/blog/BlogCard.jsx
src/components/layout/Navbar.jsx
src/components/layout/Footer.jsx
src/pages/BlogPage.jsx
src/pages/BlogPostPage.jsx
src/pages/admin/AdminBlog.jsx
src/pages/admin/AdminDashboard.jsx
src/pages/admin/AdminLayout.jsx
public/sitemap.xml
supabase/blog-section-setup.sql
docs/blog-section-implementation-guide.md
```

## What Was Added In Simple English

The website now has a blog listing page where customers can read packaging guides and bag buying tips.

Each blog post has its own page.

Admins can create, edit, publish, unpublish, delete, and manage blog posts from the admin dashboard.

Admins can upload blog cover images to Supabase Storage.

The blog pages use the existing SEO component, so blog pages can have proper titles, descriptions, canonical URLs, Open Graph images, Twitter cards, and BlogPosting structured data.

The sitemap now includes:

```text
https://happybags.co.ke/blog
```

## Supabase Changes Required Before Going Live

Before testing the blog on Vercel production, open Supabase and run this SQL file:

```text
supabase/blog-section-setup.sql
```

It creates:

```text
blog_categories
blog_posts
blog-images storage bucket
RLS policies for public readers
RLS policies for admins
indexes for blog queries
updated_at triggers
```

The public can only read blog posts where:

```text
status = published
published_at is empty or already in the past
```

Admins and super admins can manage blog posts and blog categories.

## How To Pull This Work

Use the GLV branch.

```bash
git checkout GLV
git pull origin GLV
npm install
npm run build
```

If the build passes, run the Supabase SQL setup before merging to main.

## How To Test Locally

Start the local app:

```bash
npm run dev
```

Check these pages:

```text
http://localhost:5173/blog
http://localhost:5173/admin/blog
```

Create a test blog category in the admin blog page.

Create a draft blog post.

Upload a cover image.

Publish the post.

Check that the post appears on:

```text
/blog
/blog/post-slug
```

Then test that drafts do not appear publicly.

## SEO Checks

For `/blog`, inspect the page head and confirm:

```text
title exists
meta description exists
canonical points to /blog
robots is index, follow
Blog JSON-LD exists
```

For `/blog/:slug`, inspect the page head and confirm:

```text
title uses the SEO title or post title
description uses the SEO description or excerpt
canonical uses the post URL unless custom canonical is set
og:type is article
og:image uses the social image or cover image
BlogPosting JSON-LD exists
```

If a post has `noindex` checked in admin, confirm the robots tag becomes:

```text
noindex, follow
```

## How To Push To Live

Only do this after:

```text
Supabase SQL has been run
npm run build passes
/blog works
/admin/blog works
one published test post works
```

Then merge GLV into main:

```bash
git checkout main
git pull origin main
git merge --no-ff GLV -m "Merge blog section implementation"
git push origin main
```

Vercel should deploy the `main` branch automatically.

## How To Roll Back If Something Breaks

Because this work should be merged into main with a merge commit, rollback should be done by reverting the merge commit.

Do not reset main.

Use:

```bash
git log --oneline
git revert -m 1 MERGE_COMMIT_HASH
git push origin main
```

If Supabase tables need to stay, leave them in place. Removing the frontend merge is enough to hide the blog section from the live site.

## Notes For The Developer

The blog content field is rendered as plain text with line breaks preserved. Do not paste unsafe HTML into the content field.

If rich text or Markdown is needed later, add a safe renderer and sanitizer first.

This is still a React single-page app, so Google can render the blog metadata, but some social media bots may only read the static `index.html` metadata. Full server-side rendering or pre-rendering can be considered later for perfect post-specific social previews.
