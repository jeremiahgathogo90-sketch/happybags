# SEO Safety Measures

This document explains how the SEO work was pushed and how to roll it back safely if anything breaks.

## What Was Done

The SEO work was first committed to the `GLV` branch.

SEO commit:

```bash
51641e3 Improve SEO metadata and crawl rules
```

After the build passed, `GLV` was merged into `main` using a merge commit.

Main merge commit:

```bash
445c41f Merge GLV SEO improvements
```

The merge was not squashed. This makes the SEO rollout easier to undo.

## Backup Branch

Before merging into `main`, a backup branch was created from the old `main`.

Backup branch:

```bash
backup/main-before-seo-20260511
```

Remote backup branch:

```bash
origin/backup/main-before-seo-20260511
```

This branch points to the version of `main` before the SEO changes were merged.

## Safe Rollback Method

If the SEO changes break the live website, use `git revert` on the merge commit.

Run:

```bash
git switch main
git pull --ff-only origin main
git revert -m 1 445c41f
git push origin main
```

This creates a new commit that undoes the SEO merge.

This is safer than deleting commits or force-pushing because it keeps the Git history intact.

## Backup Restore Option

If a full comparison is needed, compare current `main` with the backup branch:

```bash
git diff origin/backup/main-before-seo-20260511..origin/main
```

To inspect the old version locally:

```bash
git switch backup/main-before-seo-20260511
```

Do not force-push the backup branch over `main` unless the team has agreed to it.

## Verification Used Before Merge

Before pushing the SEO merge to `main`, the production build was checked:

```bash
npm.cmd run build
```

The build passed.

There was one existing warning about JavaScript chunks larger than 500 kB. This warning did not block the build.

## Normal Forward Fix

If the issue is small, prefer a forward fix instead of rollback:

```bash
git switch GLV
git pull --ff-only origin GLV
```

Make the fix on `GLV`, test it, push `GLV`, then merge it into `main`.

## Rule For Future SEO Changes

Use this flow:

```bash
git switch GLV
git pull --ff-only origin GLV
# make SEO changes
npm.cmd run build
git add <only the intended SEO files>
git commit -m "Describe the SEO change"
git push origin GLV
git switch main
git pull --ff-only origin main
git merge --no-ff GLV -m "Merge GLV SEO update"
git push origin main
```

Avoid `git add .` unless every changed file has been reviewed.
