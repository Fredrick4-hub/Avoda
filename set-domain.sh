#!/usr/bin/env bash
# =============================================================================
# Swap the placeholder domain for the real one, everywhere at once.
#
#   ./set-domain.sh https://avodahcontractors.com
#   ./set-domain.sh https://www.avodahcontractors.com
#
# Touches: canonical tags, og:url, og:image, twitter:image, JSON-LD @id and
# urls, sitemap.xml, robots.txt and .htaccess.
#
# Run it once when the domain is confirmed, then re-check a page's <head>.
# =============================================================================
set -euo pipefail

NEW="${1:-}"
OLD="https://avodahcontractors.com"

if [[ -z "$NEW" ]]; then
  echo "usage: ./set-domain.sh https://yourdomain.com" >&2
  exit 1
fi
if [[ "$NEW" != https://* ]]; then
  echo "error: domain must start with https:// (got: $NEW)" >&2
  exit 1
fi
NEW="${NEW%/}"   # strip any trailing slash

if [[ "$NEW" == "$OLD" ]]; then
  echo "Nothing to do — the site already uses $OLD"
  exit 0
fi

cd "$(dirname "$0")"
FILES=( *.html sitemap.xml robots.txt .htaccess )

echo "Rewriting $OLD  ->  $NEW"
COUNT=0
for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || continue
  n=$(grep -c "$OLD" "$f" 2>/dev/null || true)
  if [[ "${n:-0}" -gt 0 ]]; then
    # macOS and GNU sed disagree about -i, so write through a temp file
    sed "s|${OLD}|${NEW}|g" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    printf '  %-24s %s\n' "$f" "$n"
    COUNT=$((COUNT + n))
  fi
done

# Keep the bare-host rule in .htaccess consistent with the new choice
if [[ -f .htaccess ]]; then
  HOST="${NEW#https://}"
  if [[ "$HOST" == www.* ]]; then
    echo
    echo "NOTE: you chose a www canonical. Open .htaccess and swap the"
    echo "      'Force non-www' block for the 'Force www' block below it."
  fi
fi

echo
echo "Done — $COUNT references updated."
echo "Next: grep -rn '$OLD' . --include='*.html'   (should return nothing)"
