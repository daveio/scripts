#!/usr/bin/env zsh
#
# SOURCE THIS FILE, DON'T EXECUTE IT.
#   source /path/to/ghc.sh
#
# ARGS:
#   $1: [GitHub username]/[GitHub repo]
#    - or -
#   #1: [GitHub repo owned by $GHC_ME]
# EXAMPLES:
#   ghc daveio/scripts
#   ghc myrepo
#
# TODO: allow regex whitelisting for git or https methods
#
# SETTINGS

export GHC_ME="daveio" # your GitHub username
export GHC_ROOT="${HOME}/src/github.com" # no trailing slash
export GHC_ME_PROTO="ssh" # use git to clone my repos
export GHC_OTHER_PROTO="https" # use https to clone other repos

# CODE

function ghc() {
  ghc_startdir=$(pwd)
  if [[ ${1} =~ "/" ]]; then
    echo "username/repo form"
    ghc_user="$(echo ${1} | cut -d / -f 1)"
    ghc_repo="$(echo ${1} | cut -d / -f 2)"
  else
    # repo only form
    ghc_user="${GHC_ME}"
    ghc_repo="${1}"
  fi
  cd "${GHC_ROOT}"
  [[ -d ${ghc_user} ]] || mkdir ${ghc_user}
  cd "${ghc_user}"
  if [[ -d ${ghc_repo} ]]; then
    echo "Clone target already exists! Sending you there without cloning anything."
    ghc_chdir="${GHC_ROOT}/${ghc_user}/${ghc_repo}"
  else
    if [[ ${ghc_user} == ${GHC_ME} ]]; then
      ghc_proto="${GHC_ME_PROTO}"
    else
      ghc_proto="${GHC_OTHER_PROTO}"
    fi
    case ${ghc_proto} in
    ssh)
      ghc_cmd="git clone --recursive git@github.com:${ghc_user}/${ghc_repo}.git ${ghc_repo}"
      ;;
    https)
      ghc_cmd="git clone --recursive https://github.com/${ghc_user}/${ghc_repo}.git ${ghc_repo}"
      ;;
    *)
      echo "Invalid git method! Choose either 'https' or 'ssh' in the environment variables."
      ghc_cmd=""
      ;;
    esac
    ${ghc_cmd}
    if [[ -d ${ghc_repo} ]]; then
      ghc_chdir="${GHC_ROOT}/${ghc_user}/${ghc_repo}"
    else
      ghc_chdir="${ghc_startdir}"
    fi
  fi
  cd ${ghc_chdir}
}
