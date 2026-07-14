export const orgSearchStyleSheet = String.raw`
.org-search-overlay {
  position: fixed; z-index: 200; inset: 0;
  background: rgb(10 10 18 / 72%); backdrop-filter: blur(6px);
}
.org-search-palette {
  position: fixed; z-index: 201; top: 50%; left: 50%;
  display: grid; width: min(720px, calc(100vw - 32px));
  max-height: min(76vh, 760px); padding: 22px; overflow: hidden;
  color: var(--face-normal); background: var(--surface-paper);
  border: 1px solid var(--surface-border, var(--docs-border, rgb(127 127 127 / 28%)));
  border-radius: 16px; box-shadow: 0 24px 80px rgb(0 0 0 / 48%);
  transform: translate(-50%, -50%);
}
.org-search-palette h2, .org-search-palette p { margin: 0; }
.org-search-palette > h2 { padding-right: 40px; font-size: 1.25rem; }
.org-search-palette > p { margin-top: 6px; color: var(--face-faded); font-size: .82rem; }
.org-search-input {
  display: grid; grid-template-columns: auto 1fr auto; gap: 10px;
  align-items: center; margin-top: 18px; padding: 11px 13px;
  color: var(--face-salient); background: var(--surface-canvas);
  border: 1px solid var(--surface-border, var(--docs-border, rgb(127 127 127 / 28%)));
  border-radius: 10px;
}
.org-search-input input {
  min-width: 0; color: var(--face-normal); font: inherit;
  background: transparent; border: 0; outline: 0;
}
.org-search-input input::placeholder, .org-search-input kbd, .org-search-status {
  color: var(--face-faded);
}
.org-search-input kbd, .org-search-status { font: .68rem var(--font-mono); }
.org-search-status { min-height: 1.2em; padding: 10px 2px 7px; }
.org-search-results {
  display: grid; gap: 6px; margin: 0; padding: 0 4px 0 0;
  overflow: auto; list-style: none;
}
.org-search-results button {
  appearance: none; display: grid; grid-template-columns: auto 1fr;
  gap: 3px 10px; width: 100%; padding: 12px 13px;
  color: var(--face-normal); text-align: left; background: transparent;
  border: 1px solid transparent; border-radius: 10px; cursor: pointer;
}
.org-search-results button:hover, .org-search-results button[data-active="true"] {
  background: color-mix(in srgb, var(--surface-paper) 82%, var(--face-salient) 18%);
  border-color: var(--surface-border, var(--docs-border, rgb(127 127 127 / 28%)));
}
.org-search-result-kind {
  align-self: center; color: var(--face-salient);
  font: .62rem var(--font-mono); text-transform: uppercase;
}
.org-search-results strong, .org-search-results small {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.org-search-results small, .org-search-results p, .org-search-result-fields { grid-column: 2; }
.org-search-results small { color: var(--face-faded); font: .65rem var(--font-mono); }
.org-search-results p {
  display: -webkit-box; overflow: hidden; color: var(--face-muted);
  font-size: .75rem; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
}
.org-search-result-fields { display: flex; gap: 6px; }
.org-search-result-fields i {
  padding: 2px 6px; color: var(--face-structural);
  font: normal .6rem var(--font-mono); background: var(--surface-canvas); border-radius: 999px;
}
.org-search-palette footer {
  display: flex; gap: 18px; padding: 11px 2px 0;
  color: var(--face-faded); font: .62rem var(--font-mono);
}
.org-search-close {
  appearance: none; position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; color: var(--face-faded); background: transparent;
  border: 1px solid var(--surface-border, var(--docs-border, rgb(127 127 127 / 28%)));
  border-radius: 8px; cursor: pointer;
}
@media (max-width: 640px) {
  .org-search-palette {
    top: 10px; width: calc(100vw - 20px); max-height: calc(100dvh - 20px);
    padding: 16px; transform: translateX(-50%);
  }
  .org-search-palette footer { display: none; }
}
`;
