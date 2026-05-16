# Org Zhixing

Org Zhixing is a small browser demo that displays user-facing Org content
through the `orgize` WebAssembly worker. It does not parse Org in TypeScript;
Rust remains the parser and semantic projection owner.

The demo is configured by `public/org-zhixing.toml`. Its default source lives in
`public/blog/org-zhixing-demo.org`; TypeScript fetches that static Org asset and
sends it to the `orgize` worker. The visible surface uses the Rust-rendered HTML
as the main article column, with structured side views:

- Blog: headline records tagged `blog`.
- Records: ordinary user records, properties, links, and attachment evidence.
- Agenda: a modern, explainable planning workspace built from the Rust-owned
  `agendaView` projection. TypeScript groups parser-produced cards by attention
  signals such as blockers, timed focus, deadlines, waiting state, and completion
  history without re-parsing Org syntax.

## Local Development

From this repository inside the `orgize` checkout:

```sh
cd ../..
direnv exec . just wasm-build
cd .data/org-zhixing
npm install
direnv exec . just dev
```

The parent `orgize` checkout owns the Rust/WASM toolchain and builds
`wasm/dist/orgize.js` plus `wasm/dist/orgize_bg.wasm` through its root Justfile.
`org-zhixing` consumes that package through `orgize = "file:../../wasm"` and
only owns TypeScript/Vite development.

## Host Boundary

The long-term product host can be TanStack Start. The demo keeps Vite only as a
local/example adapter because TanStack Start itself is Vite-powered underneath,
and because the current package still needs a small static smoke surface.

The reusable browser layer is `mountOrgZhixingApp(root, { createWorker })`.
`src/viteWorker.ts` is the only place that imports the Vite-specific
`orgize/worker?worker` module. The parser client, TOML config, source loading,
view model, and renderer stay host-agnostic so a TanStack Start route can mount
the same app with its own worker factory.

## Configuration

User-facing configuration is TOML, but it is intentionally smaller and cleaner
than Hugo's full site configuration model:

```toml
[site]
title = "Org Zhixing"
locale = "zh-CN"

[content]
root = "blog"
default_source = "demo"

[[content.sources]]
id = "demo"
title = "Org Zhixing Demo"
file = "org-zhixing-demo.org"

[ui]
default_view = "agenda"
show_timings = true

[[ui.views]]
id = "blog"
label = "Blog"
weight = 10

[behavior]
lazy_lint = true

[agenda]
start = "2026-05-15"
days = 7
limit = 32
mode = "focus"
```

The browser accepts `?config=other.toml`, `?source=note.org`,
`?view=agenda`, `?agenda=pressure`, `?agenda=flow`, and `?perf=0` overrides.
Config files must be root-level public TOML files, and content sources stay
under `public/blog/*.org`.

## Harness

`typescript-lang-project-harness` is pinned as a GitHub dev dependency and runs
through:

```sh
npm run harness
just harness
```

`just check` includes typecheck, the TypeScript harness, and the production
frontend build. Run `direnv exec . just wasm-build` from the parent `orgize`
checkout when the Rust WASM package needs rebuilding.

## Performance Shape

The first paint asks the worker for the compact `viewIndex` projection, then
renders the main article through the Rust HTML exporter. The richer `agendaView`
projection is requested when the Agenda tab is active, so the browser gets sort
receipts and blocker evidence without expanding the first-paint payload. Lint
remains lazy until Diagnostics is opened, and the status line reports
parse/agenda/lint/html timings. Derived tag indexes are built once per parse so
tab rendering does not repeatedly scan the section index. Run `just perf` for
the local WASM microbenchmark, and see `docs/performance.md` for the current
bottleneck map and next milestones.
