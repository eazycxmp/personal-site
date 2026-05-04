# espencampbell.com

GTM consulting site. Next.js 15, Tailwind v4, Framer Motion, MDX. Deploys to Vercel.

## Quickstart

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Project layout

```
app/
  layout.tsx                      Root layout with Inter + Fraunces fonts
  globals.css                     Design tokens, gradient utilities
  page.tsx                        Home page (hero → tools → checker → index → quotes → who → work → CTA)
  not-found.tsx                   404
  work/
    page.tsx                      Work index
    homelight/page.tsx            HomeLight case study (two phases)
    heimdall-power/page.tsx       Heimdall Power case study
    gowins-tile/page.tsx          Gowins Tile case study with Jack's quote
  stack/page.tsx                  Stack placeholder
  play/page.tsx                   Play page (hosts the deliverability tool)
  studio/page.tsx                 Studio placeholder (toggle target)
  api/
    check-deliverability/route.ts Real DNS lookup API for SPF / DKIM / DMARC / MX

components/
  nav.tsx                         Top nav with GTM↔Studio toggle, mobile menu
  footer.tsx                      Shared footer
  buttons.tsx                     ButtonPrimary / ButtonSecondary
  deliverability-checker.tsx      Interactive checker UI
  case-study-parts.tsx            Shared case study primitives

lib/
  site-config.ts                  Cal link, social links, nav config
  case-studies.ts                 Single source of truth for case study metadata
```

## Before you deploy — swap these

1. **Cal.com link.** `lib/site-config.ts` → `calLink`. Currently set to `cal.com/espencampbell/audit`. Replace with your real booking URL.
2. **Social links.** `lib/site-config.ts` → `socials`. GitHub, LinkedIn, email.
3. **Hero portrait.** `app/page.tsx` — currently a CSS gradient placeholder. Replace with a real photo (`<Image src="/hero.jpg" ... />`). Drop the file in `/public`.
4. **Jack's quote.** `app/work/gowins-tile/page.tsx` — confirm with Jack that the wording is approved. The current version is the one we drafted together.
5. **Open Graph images.** Add `/public/og-image.png` (1200×630) and reference it in `app/layout.tsx` metadata.
6. **Domain in `metadataBase`.** Already set to `https://espencampbell.com` — change if deploying to a different domain.

## Deliverability checker — how it works

`POST /api/check-deliverability` with `{ "domain": "example.com" }` runs four real DNS lookups in parallel:

- TXT on root → SPF detection
- TXT on `_dmarc.{domain}` → DMARC policy
- TXT on `{selector}._domainkey.{domain}` for 9 common selectors → DKIM detection
- MX on root → mail receiving

Returns a 0-100 score (25 points per check, weighted by quality), a band (good/mid/bad), and per-check notes.

This is a runtime-only Node.js API route. Vercel handles it on serverless functions out of the box.

## Deploy to Vercel

```bash
# from repo root
npx vercel
```

Or push to a GitHub repo and connect it in the Vercel dashboard. No env vars needed for v1.

## Adding a fourth case study

1. Add an entry to `lib/case-studies.ts` (don't forget to update `next` chain on the existing studies).
2. Create `app/work/{slug}/page.tsx` — copy any of the existing three as a template.
3. The home page and work index pick it up automatically from `caseStudies`.

## Roadmap (next sessions)

- Real Stack page (currently placeholder). The current `/stack/page.tsx` mirrors the Stack page from the personal site mockup but trimmed to GTM tools only.
- Real Play page demos (currently just hosts the deliverability tool).
- Studio side build-out (the GTM↔Studio toggle currently goes to a placeholder).
- Real hero photo + OG images.
- Captured email follow-ups from the deliverability tool ("Email me my full audit").
