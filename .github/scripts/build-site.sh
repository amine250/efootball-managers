#!/usr/bin/env bash
# Build an optimized copy of the site for GitHub Pages. Source files are never modified.
#
#   - Manager photos: PNG -> WebP, max 270px wide (90px CSS box at 3x pixel density)
#   - Logo: WebP copy, max 450px wide (150px max CSS width at 3x pixel density), used by the
#     header <img>. logo.png stays for og:image, since some link-preview crawlers skip WebP.
#   - JSON: whitespace removed; photo paths rewritten to the .webp files
#
# Usage: .github/scripts/build-site.sh [output-dir]   (default: _site)
# Requires: cwebp (apt: webp, brew: webp), python3
set -euo pipefail

OUT="${1:-_site}"
cd "$(dirname "$0")/../.."

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R index.html favicon.ico css js data "$OUT"/
cp logo.png "$OUT"/

# Write a WebP next to a PNG, downscaling only if wider than max_width.
to_webp() {
  local src="$1" max_width="$2" dst="${1%.png}.webp"
  local width
  width=$(python3 -c 'import struct,sys; f=open(sys.argv[1],"rb"); f.seek(16); print(struct.unpack(">I", f.read(4))[0])' "$src")
  local resize=()
  if [ "$width" -gt "$max_width" ]; then resize=(-resize "$max_width" 0); fi
  cwebp -quiet -q 85 -m 6 -sharp_yuv -alpha_q 100 -metadata none ${resize[@]+"${resize[@]}"} "$src" -o "$dst"
}

for photo in "$OUT"/data/photos/*.png; do
  to_webp "$photo" 270
  rm "$photo"
done

to_webp "$OUT/logo.png" 450
grep -q 'src="logo.png"' "$OUT/index.html" || { echo "logo.png reference not found in index.html" >&2; exit 1; }
sed -i.bak 's/src="logo.png"/src="logo.webp"/' "$OUT/index.html" && rm "$OUT/index.html.bak"

python3 - "$OUT" <<'EOF'
import json, os, sys

out = sys.argv[1]

def compact(path, transform=None):
    full = os.path.join(out, path)
    with open(full, encoding="utf-8") as f:
        data = json.load(f)
    if transform:
        data = transform(data)
    with open(full, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"), ensure_ascii=False)

def webp_photos(managers):
    missing = []
    for m in managers:
        if m["photo"].startswith("data/photos/") and m["photo"].endswith(".png"):
            m["photo"] = m["photo"][:-4] + ".webp"
        if not m["photo"].startswith(("http://", "https://")) and not os.path.isfile(os.path.join(out, m["photo"])):
            missing.append(f'{m["id"]}: {m["photo"]}')
    if missing:
        sys.exit("Photos missing from build:\n  " + "\n  ".join(missing))
    return managers

compact("data/managers.json", webp_photos)
compact("data/link-up-plays.json")
EOF

echo "Built $OUT: $(du -sh "$OUT" | cut -f1) (photos: $(du -sh "$OUT/data/photos" | cut -f1))"
