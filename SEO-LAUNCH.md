# Technical SEO — what changed, and what's left

Working notes for the Avodah build. Companion to the client-facing plan.

---

## 1. Set the domain before launch — do this first

Everything absolute (canonical tags, `og:url`, `og:image`, JSON-LD, sitemap,
robots, `.htaccess`) currently points at the **placeholder**
`https://avodahcontractors.com`. One command swaps it everywhere:

```bash
./set-domain.sh https://avodahcontractors.com
# or
./set-domain.sh https://www.avodahcontractors.com
```

Verify afterwards:

```bash
grep -rn "avodahcontractors.com" *.html sitemap.xml robots.txt .htaccess \
  | grep -v "sales@"     # should return nothing but the real domain
```

If you pick **www**, also swap the redirect block in `.htaccess` (the script
prints a reminder). Canonical host and redirect must agree, or Google sees two
competing copies of every page.

---

## 2. Done

### Speed
| | before | after |
|---|---|---|
| Hero video | 7.6 MB mp4 + 8.8 MB webm, 29s @ 1080p | **921 KB** mp4, 8s @ 720p |
| Hero poster | 144 KB | 49 KB, and it is now frame 0 of the loop (no jump) |
| Photo library | 43.4 MB | **23.1 MB** (99 files, −47%) |
| Logo PNG | 151 KB @ 900px | 103 KB @ 600px |
| **Homepage initial payload** | **~9 MB** | **1.05 MB** |

**Photo compression:** every JPEG capped at 1800px on the long edge and
re-encoded at `-q:v 5`. Checked against the original at 1:1 pixels before
committing to the setting — shingle texture and water detail both hold, and the
rendered pages are indistinguishable. Originals are backed up in the session
scratchpad (`images-original/`), not in git.

All 101 `width`/`height` attributes were re-synced to the new pixel dimensions
afterwards, and the logo's dimensions were updated in the homepage JSON-LD too.

The two homepage path photos (`custom1.jpg`, `commercial1.jpg`, 818 KB together)
were switched to `loading="lazy"`. They sit a full 92vh below the fold, so they
were blocking the initial load for no reason. They were deliberately **not**
shrunk below 1800px: each fills half the viewport width, so 1800px is about
right for a retina display.

`images/og/*` were left alone — they are already built to spec at 1200×630.

> **WebP was not done.** The plan mentions "a lighter modern format", but this
> machine has no WebP encoder (no `cwebp`, and ffmpeg is built without
> `libwebp`). `brew install webp` would enable roughly another 25–30% on top of
> the above. It needs every `src` and `data-full` reference rewritten, so it is
> a deliberate second pass rather than something to slip in.

The video sits behind a dark scrim, so 720p is indistinguishable from 1080p
here — the length and bitrate were the real cost, not the format. The webm was
dropped: it was *larger* than the h264 and never got used anyway, because the
`<source>` order put mp4 first.

Originals are **not** in git history — back them up if you want them:
they were copied to the session scratchpad only.

- Poster is preloaded with `fetchpriority="high"`, above the render-blocking CSS.
- Video is `preload="metadata"` so it never competes with first paint.

### Layout shift (CLS)
- **101 `<img>` tags** now carry real intrinsic `width`/`height`, read from the
  files themselves. Previously zero did.
- The base rule `img { max-width: 100% }` had **no `height: auto`**. Adding
  dimensions without that would have squashed every image on narrow screens —
  `height: auto` was added alongside. All the per-component overrides are
  class-based, so they still win. Verified visually.

### Search foundations
- `robots.txt`, `sitemap.xml` (7 URLs, lastmod, priority).
- `<link rel="canonical">` on all 7 pages.
- `<meta name="robots" content="…max-image-preview:large…">` — lets Google show
  large image thumbnails, which matters a lot for a photo-led trade site.
- Titles cut from up to **92 chars to 52–59** (Google truncates ~60).
  Descriptions from up to **230 to 140–161**.
- Homepage links changed from `index.html` to `./`, so no internal link points
  at a non-canonical URL.

### Structured data — 11 JSON-LD blocks, all validated
- **`GeneralContractor` + `HomeAndConstructionBusiness`** on the homepage:
  full NAP, service area (Wayne, Holmes, Ashland, Medina, Stark), price range,
  and an offer catalogue of all 11 build types. This is what feeds the Google
  Maps / local business panel.
- `WebSite`, `BreadcrumbList` on all inner pages, `Service` + offer catalogue on
  Custom and Commercial, `ContactPage` on Contact.
- The existing `FAQPage` on Our Process was kept as-is.

> **`geo` coordinates were deliberately omitted.** Google resolves the postal
> address reliably; a guessed lat/long is worse than none. Add real coordinates
> from the Google Business Profile if you want them.

### Link previews
- Open Graph + Twitter Card on every page.
- **7 share images generated at 1200×630** in `images/og/`, cropped from the
  existing photography, each with its own alt text.

### Icons
Built from `images/avodah-favicon.png`, flattened onto white so the dark-red
mark stays legible in dark browser tabs and on iOS (which renders alpha black):
- `favicon.ico` (16/32/48, real multi-resolution ICO)
- `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`
- `site.webmanifest`

### Heading structure — was broken on 5 of 7 pages
| page | was | now |
|---|---|---|
| index | h1 → **h3** (skipped h2) | the two path cards are h2 |
| custom | h1 → **h3** ×7 | the seven build types are h2 |
| commercial | h1 → **h3** ×4 | the four build types are h2 |
| process | h2 → **h4** ×3 | h3 |
| start-a-project | h2 → **h4** ×3 | h3 |

All retags are **pixel-identical** — every affected selector already declared an
explicit `font-size`, and a `.card h3, .next-step h3` rule preserves the old h4
treatment. Verified by screenshot.

Also fixed: the Custom `<h1>` read **"What is acustom build?"** to Google and to
screen readers, because `What is a<br>custom build?` has no space around the
`<br>`. Now "What is a custom build?".

### Accessibility
- **Two contrast failures fixed** (the two the plan mentions), both in the
  pricing comparison on Our Process:
  - `.compare-heads .head-a` — 3.23:1 → **4.64:1**
  - `.compare-a .compare-tag` — 2.54:1 → **4.64:1**

  Every other small-text pair was measured and passes; the values chosen are the
  lightest that clear 4.5:1, so the column stays visually recessed.
- **Lightbox focus trap** — Tab previously walked onto the page behind the modal.
  Escape / arrows / focus restore were already correct.
- **Mobile menu** — now closes on Escape (returning focus to the button), on
  outside click, and when focus leaves it. Previously none of those.
- **Hero video now honours `prefers-reduced-motion`.** The code comment claimed
  it did; nothing implemented it. CSS `animation: none` does not stop a
  `<video>`. (WCAG 2.2.2)

All lightbox and gallery triggers were already real `<button>`s — that part of
the build was done properly.

### Infrastructure
- `404.html`, on-brand, root-relative paths so it works at any URL depth,
  `noindex, follow`.
- `.htaccess` — HTTPS + non-www canonical redirects, `/index.html` → `/`,
  compression, caching, security headers, `ErrorDocument`.
- `netlify.toml` — equivalent, if you host there instead.
  > Caching is deliberately split: images/video/icons get 1 year immutable,
  > but **`styles.css` and `script.js` get 1 hour** because they are not
  > content-hashed. A long TTL there would strand returning visitors on an old
  > build after any edit.
- `.gitignore`; removed `.DS_Store` and 15 leftover placeholder SVGs.

### Verified
- All 7 pages + 404 + robots + sitemap + favicon + manifest return 200.
- **100 internal link targets — zero broken.**
- **Zero horizontal overflow at 390px** on all 8 pages (measured, not eyeballed).
- All 11 JSON-LD blocks parse.
- `script.js` passes `node --check`.

---

## 3. Still to do — needs something from the client

1. **Domain.** Blocks §1. Everything else is ready.
2. **Opening hours** → add `openingHoursSpecification` to the homepage JSON-LD.
   Omitted rather than guessed.
3. **Analytics IDs.** GA4 / GTM / Meta Pixel placeholders are still commented
   out in each `<head>`, with copy-ready snippets in `index.html`. Drop in the
   real IDs and uncomment. Search Console verification after the domain is live.
4. **Forms are not connected.** Both still hit the `alert()` placeholder in
   `script.js`. They need a real endpoint plus spam protection before launch —
   this is the one item that loses actual enquiries if it ships as-is.
5. **Google Business Profile access** — the Contact map currently points at a
   search query, not the real listing.
6. **Heading font.** `Copperplate` is macOS-only. On Windows and Android,
   headings fall back to Poppins — the body font — so most visitors see headings
   that look like body text. A hosted alternative needs picking.
7. **Privacy policy + terms.** Forms collect data and the Pixel will run.

## 4. Recommended, not done

- **WebP conversion** — see the note under Speed. Needs `brew install webp`,
  then a rewrite of every image reference. Worth ~25–30% more.
- **Self-host Poppins.** The Google Fonts stylesheet is render-blocking from a
  third party. Worth doing at the same time as the heading-font decision, since
  the font stack is changing anyway.
- **Unused photography** — 12 of 24 `images/collage/gallery-*.jpg`, plus
  `process-adapt.jpg` and `process/process-window1-bg.jpg` (superseded by `-v2`),
  are not referenced anywhere. **Left in place deliberately** — they are client
  assets and may be wanted for the project-type pages. ~5 MB of repo weight,
  zero cost to visitors.
- **Review schema was not added.** Google ignores self-serving review markup on
  `LocalBusiness`, and there is only one review on the site. Reviews on the
  Google Business Profile are what actually move local rankings.
- **Clean URLs** (`/custom` rather than `/custom.html`) were deliberately not
  enabled. It would mean either duplicate URLs or a redirect on every internal
  link, for no ranking benefit. Canonicals are consistent as-is.
