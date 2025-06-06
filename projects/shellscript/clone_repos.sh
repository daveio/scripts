#!/usr/bin/env bash

function process_repo {
  repo=${1}
  repo_dir=$(basename "${repo}")

  if [[ -d ${repo_dir} ]]; then
    echo "Updating ${repo}"
    (
      cd "${repo_dir}" || return
      git fetch --all --prune --tags --prune-tags --recurse-submodules=yes && git pull --all --prune --rebase
    )
  else
    echo "Cloning ${repo}"
    git clone "https://github.com/${repo}.git"
    (
      cd "${repo_dir}" || return
      git fetch --all --prune --tags --prune-tags --recurse-submodules=yes && git pull --all --prune --rebase
    )
  fi
}

export -f process_repo

xargs -P 16 -I{} bash -c "process_repo {}"
