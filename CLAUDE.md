@AGENTS.md

# espencampbell.com

Next.js 15.5 App Router · React 19 · TypeScript · Tailwind v4 · Framer Motion ·
three.js / react-three-fiber · `@vercel/kv`. Import alias is `@/`.

## Layout

- `app/` routes. `app/play/<slug>/page.tsx` per game, listed in the `GAMES` array in `app/play/page.tsx`.
- `components/` shared components. Game logic lives here, not in the route file.
- `public/` static assets, including self-contained pages that are framed by a route.
- Route pages are server components: `Nav`, back-link, `<h1>`, blurb, the component, `Footer`.
  Add `"use client"` only on the component that needs it.

## Commands

```
npm run dev      # port 3100
npm run build    # always run before pushing
```

The dev server's **first request to a route compiles it and can take minutes**. A hanging
`curl` usually means "still compiling", not "broken" — poll until it returns 200 rather than
assuming failure and restarting.

## Deploying

`main` is the production branch and pushing deploys it. **Run `npm run build` before every
push to main** — a type or lint error that `next dev` tolerates will fail the deploy.

## What "done" means here

Never report work as complete on the strength of it looking right. Before saying something
works, check it against a source of truth that is independent of the code that produced it:

- **Known-correct values.** Compare output to published figures, a reference implementation,
  or hand-computed numbers. Agreement with an authority is evidence; "the screenshot looks
  fine" is not.
- **Invariants over volume.** For anything stateful, drive it many times and assert what must
  always hold (money conserved, no orphaned state, ordering respected). Bugs hide in the runs
  you did not do.
- **Measure, don't eyeball.** For layout and geometry, read `getBoundingClientRect()` /
  `getBBox()` and do the arithmetic. Screenshots are low-resolution and perspective transforms
  lie; derive angles and positions rather than guessing them.
- **Verify in the browser.** Use the preview tools on anything the dev server renders. Check
  the console and network, not just the pixels.

Report honestly. If a check was skipped, say so. If something is unverified, call it
unverified. Never present a partial result as a finished one.

## Notes

- Tell the user when work only exists locally. Writing files is not shipping; say plainly
  what is uncommitted or undeployed.
- A `<title>`-bearing standalone page in `public/` framed by a route is a legitimate pattern
  here (see `/play/blackjack`) — it keeps one source of truth instead of porting working code
  into React. Such a page should report its own height so the frame never nests a scrollbar,
  and must measure its *content*, not `document.scrollHeight`, which includes the frame's own
  viewport and feeds back into a runaway loop.
