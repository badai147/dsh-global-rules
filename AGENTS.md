# AGENTS.md

Agent-facing guide to this repository. Complements [README.md](README.md) and
[CONTRIBUTING.md](CONTRIBUTING.md) — do not duplicate them.

## Project overview

`dsh-global-rules` is a DeepSeek Harness (DSH) plugin: a settings page that reads and writes the
user-global instruction file `$DSH_HOME/AGENTS.md` (default `~/.dsh/AGENTS.md`) over the host's
`/api` Fetch channel. Two halves, no shared code:

- `lib/index.js` — Host, plain Node ESM. Registers `GET/POST /api/global-rules` through
  `ctx.connection.fetch.register` (256 KiB body cap).
- `lib/client.js` — Client, hand-written `window.__ModuleLoader__` bundle. Registers the
  `settings.section` page.
- `cordis.patch.yml` — bundle patch inserting the `global-rules` layer.
- `package.json` — `dsh.bundle.patch`, `dsh.client.inject`, `files`.

## Build, test, lint

There is no toolchain, deliberately: no dependencies, no build step, no linter, and no `scripts` in
`package.json`. Do not add one. Verify by hand instead:

```sh
dsh plugin --profile web add .   # run from the repo root; relative specs resolve against the invocation dir
```

Restart `dsh web`, then open **Settings → 全局规则**.

- Host change (`lib/index.js`): restart `dsh web`.
- Client change (`lib/client.js`): reload the page — the host re-reads a bundle whose mtime or size
  changed. Restart if the old UI persists.

`node test.js` runs a zero-dependency self-check (dictionary parity plus the slot/locale
registration shape) with no package script. It is not published to npm.

Manual test checklist: CONTRIBUTING.md.

## Code style

- Match the file you edit: `lib/index.js` uses 2-space indentation, `lib/client.js` uses tabs.
- Source comments and JSDoc are English. User-facing panel strings come from the `global-rules`
  locale namespace registered through `ctx.locale.register(ns, { zh, en })` — add a key to both
  dictionaries, never a literal string in the render tree.
- Conventional Commits (`feat`, `fix`, `docs`, `ci`, `chore`), subject in Chinese or English, one
  logical change per commit. Branch off `main`.

## Non-obvious constraints

- Never import `@deepseek-ai/*` from the Host half: an external plugin cannot assume harness internals
  resolve inside the profile. Short rules are inlined — `resolveHome()` mirrors the built-in
  `resolveDshHome` (a non-blank `$DSH_HOME` wins, otherwise `~/.dsh`). Keep them in sync.
- The client bundle may `require("react")` and the shell's baseline module table only; a new
  non-baseline request also needs a `dsh.client.inject` entry.
- Host endpoints must stay under `/api` via the Connection Fetch registry — that is what places them
  inside the Host/Origin fence and browser authentication.
- npm ships only `lib/`, `cordis.patch.yml`, and the README; a new runtime file must be added to
  `files`.
- Keep both languages in sync: two READMEs, two CONTRIBUTINGs, two CHANGELOGs.

## Security and testing gotchas

- The plugin writes the real user-global rules file; point `DSH_HOME` at a scratch directory before
  testing so you do not overwrite your own rules.
- The route is authenticated: an unauthenticated `curl` returns 401/403 by design — use DevTools.
- Failure shapes: 400 for a non-JSON body or non-string `content`, 413 above 256 KiB, 500 carrying
  the OS error message when the file cannot be read or written.
- Never commit `NPM_TOKEN`; never paste private `AGENTS.md` content into an issue.

## Note

This file is DSH project-scope instructions; the plugin edits the *user-global* file instead.
