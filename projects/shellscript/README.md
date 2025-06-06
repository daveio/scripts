# Shellscript

This is a collection of small shellscripts which you should be quiet or I will replace you with.

## `clone_repos.sh`

Pipe a file with a list of GitHub repos, of format:

```plaintext
some-username/some-repo
another-username/another-repo
```

For each `username/reponame`, the script will:

- Clone the repo to `$cwd/reponame`
- Run `git fetch --all --prune --tags --prune-tags --recurse-submodules=yes`
- Run `git pull --all --prune --rebase`
