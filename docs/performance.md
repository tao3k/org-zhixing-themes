# Org Zhixing WASM Performance Notes

The current browser architecture keeps Org parsing in Rust and uses TypeScript
only for orchestration and rendering.

## Current Bottlenecks

- Cold start must fetch, compile, and instantiate `orgize_bg.wasm`.
- The old first paint requested the full `snapshot` projection, which also ran
  metadata, outline, attachments, source block, column view, and lint
  projections before Blog/Records/Agenda could render.
- The initial demo showed raw Org in the left column, which made the page feel
  like an editor instead of a blog reader.
- `npm run dev` used to rebuild WASM on every server start, which made local
  feedback feel like runtime latency.
- The first Vite config allowed `..` and `../..` from inside `.data/org-zhixing`,
  which exposed both `.data` and the whole parent `orgize` checkout to the dev
  server. Sampling high CPU showed the process spending time in filesystem
  `stat`/`scandir`, so the problem was watcher scope rather than Rust parsing.

## Implemented Fixes

- First paint now requests only the narrow `viewIndex` projection.
- The left column now renders the Rust HTML exporter output as the primary blog
  article surface instead of showing raw Org text.
- Lint is loaded only when Diagnostics is opened.
- Tag filtering and agenda rows are indexed once per parse instead of scanning
  the section index on every render.
- Side-view markup is cached after each parse so tab switches do not rerender
  the same card and agenda lists.
- The status line reports parse/lint/html timings so regressions are visible.
- `npm run dev` starts Vite directly; rebuild the Rust WASM package from the
  parent `orgize` checkout with `just wasm-build`.
- `viewIndex` is projected directly from semantic sections instead of building
  the full section-index records and trimming them afterward.
- `viewIndex` de-duplicates effective tags and omits empty optional fields so
  repeated `#+FILETAGS` data cannot dominate the first-paint payload.
- The WASM wrapper caches the semantic AST after the first projection for a
  source revision, so later projections do not rebuild the owned semantic tree.
- Document-level `FILETAGS` are de-duplicated during semantic prescan, which
  keeps inherited tag vectors from growing with repeated global tag keywords.
- Vite now allows only the demo root and the parent `wasm` package, excludes the
  symlinked `orgize` package from dependency pre-bundling, and uses an explicit
  watch allowlist: `src/`, root entry files, root-level public TOML config,
  `public/blog/*.org`, and the built `wasm/dist` artifact surface. Generated
  directories such as `.git`, `target`, `.devenv`, `dist`, and `node_modules`
  are ignored.

## Local Measurement

Run:

```sh
just perf
just perf 100 30
```

The benchmark writes `.cache/perf/org-zhixing-wasm.json` and reports cold init,
parse, update, projection JSON generation, pure JSON parse, lint, and HTML
timings.

On the local 100x demo fixture, parse p95 is still single-digit milliseconds;
the visible first-call bottleneck is semantic conversion, not the rowan parser.
The current `viewIndex` path reduces first-paint payload from the full section
index's 2.9 MB to about 0.33 MB and avoids the expensive
link/target/lifecycle indexing path for the first screen. The same 100x fixture
currently measures `parseViewIndexNew` at p50 16.4 ms / p95 17.5 ms,
cached `viewIndexJson` at p50 0.89 ms / p95 1.12 ms, and pure
`viewIndexJsonParse` at p50 0.69 ms / p95 1.07 ms.

## Next Performance Milestones

- Add a browser-level smoke benchmark for worker round-trip and first-paint
  timing after the WASM-level numbers are stable.
- Keep using worker isolation, then add request cancellation for very large
  documents and rapid navigation.
- Split DTO payloads further when a view only needs title, tags, planning, and
  source ranges.
- Consider a compact binary transport only after JSON payload size becomes the
  measured bottleneck.
