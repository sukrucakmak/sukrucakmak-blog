---
title: Git Commands Every Developer Should Know
description: "Most daily Git work runs on about 20 commands — here they are in order of use, with examples."
date: 2026-10-09
tags: [git, guide]
translation: /blog/git-commands-every-developer-should-know
---

## Introduction

Most of your daily Git work is done with roughly 20 commands; this post collects them in order of use, with examples. Whether you're just starting out or have been using Git for years, bookmark this page for a quick reminder of the difference between `reset` and `revert`, or how to recover a lost commit.

The examples use `main` as the default branch and `origin` as the remote name.

## 1. Setup and configuration

When you first install Git, you only need to introduce yourself once; this information is written into every commit.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --list          # show all settings
```

To start a new project or download an existing repository:

```bash
git init                                   # turn the current folder into a repo
git clone https://github.com/user/project.git
git clone <url> new-folder-name            # clone into a different folder
```

## 2. Everyday workflow

Changes move through three stages: working directory → staging area (`add`) → repository history (`commit`).

```bash
git status                 # what changed, what's staged
git status -s              # short format

git add File.java          # stage a single file
git add .                  # stage all changes
git add -p                 # stage changes interactively, chunk by chunk

git commit -m "Add login validation"
git commit -am "Message"   # add + commit tracked files
git commit --amend         # fix the last commit (before pushing!)
```

Use `diff` to see what changed and `log` to review history:

```bash
git diff                   # unstaged changes
git diff --staged          # changes about to be committed
git log --oneline --graph --all   # readable branch history
git log -p File.java       # history of a single file
git show <commit>          # details of one commit
git blame File.java        # who changed which line
```

## 3. Branching

Opening a separate branch for every feature or bug fix is the easiest way to keep `main` clean.

```bash
git branch                 # local branches
git branch -a              # including remote branches
git switch -c feature/login     # create and switch to a new branch
git switch main                 # switch branches
git checkout -b feature/login   # older syntax, same job
git branch -d feature/login     # delete a merged branch
git branch -D feature/login     # force delete
```

There are two ways to combine branches:

```bash
git switch main
git merge feature/login    # merge with a merge commit
git switch feature/login
git rebase main            # replay commits on top of main
git rebase -i HEAD~3       # edit/squash the last 3 commits
```

| Command | What it does | When to use |
| --- | --- | --- |
| `merge` | Preserves history, adds a merge commit | On shared branches |
| `rebase` | Makes history linear | On local branches not yet pushed |

Golden rule: never rebase a pushed branch that others also use.

If a conflict occurs, fix the files, run `git add`, then continue with `git merge --continue` or `git rebase --continue`; use `--abort` to give up.

## 4. Working with remotes

`fetch` only downloads; `pull` downloads and merges. When in doubt, `fetch` first and see what's coming in.

```bash
git remote -v                          # linked remotes
git remote add origin <url>            # add a remote

git fetch origin                       # download changes, don't merge
git pull                               # fetch + merge
git pull --rebase                      # fetch + rebase (cleaner history)

git push                               # push the current branch
git push -u origin feature/login       # first push, set upstream
git push --force-with-lease            # safe force-push after a rebase
git push origin --delete feature/login # delete a remote branch
```

Always use `--force-with-lease` instead of `--force`: it stops the push if someone else has pushed since you last looked.

## 5. Undoing mistakes

The right command depends on what you want to undo:

| Situation | Command |
| --- | --- |
| Discard unsaved changes in a file | `git restore File.java` |
| Unstage a file | `git restore --staged File.java` |
| Undo the last commit, keep the changes | `git reset --soft HEAD~1` |
| Delete the last commit and its changes | `git reset --hard HEAD~1` |
| Safely undo a pushed commit | `git revert <commit>` |

`reset` rewrites history, while `revert` adds a new commit that undoes the change; always use `revert` on shared branches.

Use `stash` to set aside unfinished work:

```bash
git stash                      # stash your changes
git stash push -m "half-done login"   # stash with a name
git stash list                 # list stashes
git stash pop                  # apply and drop the latest stash
git stash apply stash@{1}      # apply a specific stash
```

Your last resort is `reflog`: even commits "lost" after `reset --hard` show up here.

```bash
git reflog                     # everywhere HEAD has been
git reset --hard HEAD@{2}      # go back to that point
```

## 6. Time-saving tips

Define aliases for commands you type often:

```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.lg "log --oneline --graph --all"
# Now: git st, git lg
```

A few small habits make a big difference:

- Add a `.gitignore` file in the project's first commit (`target/`, `*.class`, `.idea/`, etc.).
- Write commit messages in the imperative mood and keep them short: "Add login validation".
- Use `git bisect` to binary-search for the commit that introduced a bug.
- Move a specific commit to another branch with `git cherry-pick <commit>`.
- Tag releases with `git tag -a v1.0 -m "First release"` and `git push --tags`.

## Conclusion

You'll memorize most of these commands in your first week; the lifesavers like `reflog` and `revert` are what you'll come back to this page for when you need them. The best practice is to open a throwaway repo and learn `reset`, `rebase`, and `stash` by breaking things there.
