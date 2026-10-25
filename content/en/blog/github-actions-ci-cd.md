---
title: CI/CD with GitHub Actions — Build, Test and Deploy to Your Server
description: "A step-by-step GitHub Actions workflow that builds and tests on every push and deploys to your own server over SSH when changes land on main."
date: 2026-10-29
tags: [github, ci-cd, devops, guide]
translation: /blog/github-actions-ci-cd
---

## Introduction

GitHub Actions is a CI/CD system defined by `.github/workflows/*.yml` files in the repo and run on GitHub's own infrastructure. It's free for public repos, and private repos get a monthly quota of free minutes.

In this post we'll set up this flow:

1. On every push and pull request: install dependencies, build, run tests.
2. On merge to `main`: copy the output to our own server over SSH and restart the app.

This blog is deployed exactly this way.

## 1. Core concepts

| Concept | Meaning |
| --- | --- |
| Workflow | A YAML file under `.github/workflows/` |
| Event (`on`) | What triggers the workflow: `push`, `pull_request`, `schedule`, `workflow_dispatch` |
| Job | A group of steps run in order on one runner; jobs run in parallel by default |
| Step | A single command (`run`) or a ready-made action (`uses`) |
| Runner | The machine running the job: `ubuntu-latest`, `windows-latest`, `macos-latest` or self-hosted |
| Secret | A value stored in repo settings and masked in logs |

## 2. CI: build and test

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

The same skeleton for a Java/Maven project:

```yaml
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven

      - run: ./mvnw -B verify
```

The `cache` parameter keeps dependencies (npm, Maven, Gradle) between runs and cuts build time considerably.

## 3. Testing on several versions with a matrix

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
```

This runs the same job on three Node versions in parallel.

## 4. Secrets

Values like the server address or an SSH key never go into the repo; add them under **Settings → Secrets and variables → Actions** or with the `gh` CLI:

```bash
gh secret set DEPLOY_HOST --body "203.0.113.10"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_SSH_KEY < ~/.ssh/deploy_key
gh secret list
```

Inside a workflow they're used as `${{ secrets.DEPLOY_HOST }}`. Secrets are masked as `***` in logs and aren't passed to PRs from forks.

Generate a dedicated key pair for deployment and add the public key to the deploy user's `~/.ssh/authorized_keys` on the server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@203.0.113.10
```

## 5. CD: deploying to a server over SSH

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm test
      - run: npm run build

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts

      - name: Upload
        run: |
          rsync -az --delete dist/ \
            "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:/var/www/app/"

      - name: Restart
        run: |
          ssh "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}" \
            "cd /var/www/app && npm ci --omit=dev && pm2 reload app"
```

Key points:

- **`concurrency`** keeps deployments from overlapping when two merges land back to back.
- **`environment: production`** lets you add approval rules (required reviewers) and environment-specific secrets on GitHub.
- **`rsync --delete`** also removes files on the server that are no longer in the build output.
- **`workflow_dispatch`** adds a button to run the workflow manually from the Actions tab.

## 6. Scheduled runs

`schedule` runs a workflow periodically from a cron expression. Times are in **UTC**:

```yaml
on:
  schedule:
    - cron: '0 3 * * *'     # every day at 03:00 UTC
```

Handy for nightly tests, dependency scans, or scheduled content publishing like on this blog. Keep in mind it may start a few minutes late at busy times.

## 7. Job dependencies and artifacts

To build once and hand the output to a deploy job:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      # ... rsync steps
```

## 8. Managing workflows with the gh CLI

```bash
gh workflow list
gh workflow run deploy.yml            # trigger workflow_dispatch
gh run list --workflow=deploy.yml
gh run watch                          # follow a running run live
gh run view --log-failed              # logs of failed steps
gh run rerun --failed
```

## 9. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Permission denied (publickey)` | The private key in the secret is missing/broken, or the public key isn't in `authorized_keys` |
| `Host key verification failed` | The `ssh-keyscan` step is missing or targets the wrong host |
| A secret comes through empty | Secrets aren't passed to PRs from forks; names are case-sensitive |
| The cache never hits | The lock file (`package-lock.json`) must be committed |
| A scheduled workflow doesn't run | Only the file on the default branch counts; it's auto-disabled in repos with no activity for 60 days |

## Conclusion

A few dozen lines of YAML give you a flow where every change is tested and goes live the moment it's merged to `main`. A single `ci.yml` is enough to start; add deployment, matrices and scheduled jobs as the need arises. Never committing secrets and using a separate, limited SSH key for deployment are the two rules to follow from day one.
