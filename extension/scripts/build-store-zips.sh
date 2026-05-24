#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
extension_dir="$(cd -- "${script_dir}/.." && pwd)"
package_source=0

usage() {
  printf 'Usage: %s [--with-source]\n' "$(basename "$0")"
  printf '\n'
  printf 'Build Chrome and Firefox store submission ZIPs in extension/dist/.\n'
  printf 'Use --with-source to also create the Firefox reviewer source archive.\n'
}

case "${1:-}" in
  "")
    ;;
  "--with-source")
    package_source=1
    ;;
  "-h"|"--help")
    usage
    exit 0
    ;;
  *)
    printf 'Unknown option: %s\n\n' "$1" >&2
    usage >&2
    exit 2
    ;;
esac

if ! command -v node >/dev/null 2>&1; then
  printf 'Error: node is required to build store ZIPs.\n' >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'Error: npm is required to run the browser builds.\n' >&2
  exit 1
fi

cd "${extension_dir}"
PACKAGE_SOURCE="${package_source}" node scripts/package-stores.mjs
