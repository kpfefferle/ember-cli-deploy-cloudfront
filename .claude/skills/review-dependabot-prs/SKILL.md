---
name: review-dependabot-prs
description: Use when the user asks to review, process, or merge open Dependabot PRs (e.g. "review the dependabot PRs", "merge the open dependency bumps"). Walks each PR through CI check, review, rebase-if-stale, and squash-merge.
---

# Review Dependabot PRs

Process every open Dependabot PR in the repo: verify CI, review the bump, rebase onto the latest `main` if stale, and squash-merge. Handle them one at a time — each merge can stale the remaining PRs.

## Steps

1. **List open Dependabot PRs.** Search `is:pr is:open author:app/dependabot` and order them oldest-first (lowest number first). Process them sequentially — merging one stales the rest.
2. **For each PR, in order:**
   1. **Check CI.** Look up the PR's check runs (e.g. `gh pr checks`). The single `Run Tests` check (lint + mocha in one job) must have succeeded. If it failed, read the failed job's log and diagnose why. If the cause is something reasonably fixable on our end (e.g. our config relying on an export shape or API the new version changed), commit the fix to the PR branch itself so CI verifies it against the new version, and wait for the re-run. If it's not fixable on our end (a genuine upstream regression), skip this PR, continue with the remaining ones, and surface the failure — with a link to the failed job — in the final summary.
   2. **Review the bump.** Read the diff and the changelog/release-notes embedded in the PR body. Focus on:
      - Whether it's patch / minor / major.
      - Any "breaking" notes — and whether they apply to *this* package. It's a plain Node library (an ember-cli-deploy plugin wrapping the AWS CloudFront SDK) with no browser or bundler surface, so browser-only and bundler-specific changes don't affect it. Do watch for runtime deps (especially `@aws-sdk/*`) dropping support for a Node line still allowed by `engines` (`>= 20.19`) — CI only tests Node 20, so it won't catch that.
      - Lockfile churn beyond the bump itself (e.g. `libc:` lines disappearing) is usually cosmetic from a pnpm regeneration — note it but don't block on it.
   3. **Confirm up-to-date with `main`.** Compare the commit the PR is based on to the current tip of `main`. If they differ, the branch is stale — post a `@dependabot rebase` comment and wait. Dependabot also auto-rebases some PRs on its own when their base falls behind; if you see "Dependabot is rebasing this PR" in the body, you don't need to comment.
   4. **Wait for the rebase.** Poll until the head SHA changes, then wait for the new CI run to complete (`Run Tests` green). Don't merge until CI is green on the rebased commit.
   5. **Approve and squash-merge.** Approve with a one-paragraph review summarizing the bump and why the breaking-change notes (if any) don't apply. Squash-merge (e.g. `gh pr merge --squash`) — the repo's history is squash-merged.
3. **After all PRs are processed,** report which merged and which (if any) need follow-up.

## Notes

- Always squash-merge — matches the existing repo history.
- Don't run `pnpm install` / `pnpm test` locally as part of the review — CI already does this on the rebased commit, and that's what gates the merge.
- If a bump fails CI, diagnose before giving up: failures caused by our own config lagging the new version are fair game to fix on the PR branch. Never try to patch the upstream package itself — if the regression is upstream, skip the PR and report it.
- Don't post `@dependabot rebase` on a PR after pushing manual commits to its branch — the rebase would discard them.
- If two PRs touch the same lockfile section and the second one needs a rebase, Dependabot handles it — never resolve lockfile conflicts by hand.
