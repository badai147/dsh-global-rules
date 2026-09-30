# Contributing to dsh-global-rules

English | [中文](CONTRIBUTING.zh-CN.md)

Thanks for taking the time to contribute. This document covers how to report a problem,
how to set up a development environment, and the conventions a pull request is expected to follow.

## Ways to contribute

- **Bug report** — open an issue with the reproduction steps below.
- **Feature request** — open an issue and describe the use case first; a small panel edit and a
  new architecture are very different proposals.
- **Pull request** — bug fixes, documentation, and small, focused features.
- **Documentation** — wording fixes in either [README.md](README.md) /
  [README.zh-CN.md](README.zh-CN.md) are welcome.

## Reporting a bug

Please include:

- `dsh --version`, your OS, and the plugin version (`package.json` / the npm page)
- What you did, what you expected, and what happened
- The notice text shown in the settings panel, plus any console error from browser DevTools
- Whether `$DSH_HOME` is set, and whether the target `AGENTS.md` exists and is writable

The plugin edits the real user-global instruction file, so never paste the file's private
content into an issue — a minimal excerpt is enough.

## Development setup

Prerequisites: `dsh` with the `web` profile, `pnpm` (used by `dsh plugin`), and Git.

```sh
git clone https://github.com/badai147/dsh-global-rules.git
cd dsh-global-rules
dsh plugin --profile web add .
```

There is nothing to install or build: the package has no dependencies and no build step
(`package.json` declares no `scripts`). Run `dsh plugin --profile web add .` **from the
repository root** — a relative path spec is resolved against the directory you invoke it in.
An absolute path works from anywhere.

Restart `dsh web`, then open **Settings → Global rules**.

To unhook the local checkout afterwards:

```sh
dsh plugin --profile web remove dsh-global-rules
```

## Development loop

| You changed | What makes it take effect |
| --- | --- |
| `lib/index.js` (Host) | Restart `dsh web` — the host half is loaded at profile startup |
| `lib/client.js` (Client bundle) | Reload the page; the host re-reads the bundle when its timestamp or size changes. If the old UI still shows, restart `dsh web` |

Debugging notes:

- The route lives under `/api`, inside the browser-authentication gate, so an unauthenticated
  `curl` gets 401/403 by design. Inspect requests in the DevTools Network tab instead.
- `GET /api/global-rules` answers `{ exists, content, path }`; `POST` takes `{ content }`.
  Failure shapes: 400 for a non-JSON body or a non-string `content`, 413 above 256 KiB,
  500 with the OS error message when the file cannot be read or written.
- Test the path-resolution branches with and without `DSH_HOME` set before claiming they work.

## Project conventions

These keep the plugin installable and reviewable; a pull request that breaks one needs a reason.

- **Zero build, zero dependencies.** Do not add a build step, a bundler, a TypeScript source tree,
  or a runtime dependency. `lib/client.js` is a hand-written `__ModuleLoader__` bundle.
- **Host is plain Node ESM.** An external plugin cannot assume harness-internal packages
  (`@deepseek-ai/*`) resolve inside the profile, so short rules are inlined — `resolveHome()` in
  `lib/index.js` deliberately mirrors the built-in `resolveDshHome` (non-blank `$DSH_HOME` wins,
  otherwise `~/.dsh`). Keep them in sync rather than importing.
- **Client externals.** The bundle may `require("react")` and the shell's baseline module table;
  any new non-baseline request must also be declared in `dsh.client.inject` in `package.json`.
- **Stay on `/api`.** New host endpoints must go through `ctx.connection.fetch.register` under
  `/api` so the Host/Origin fence and browser authentication apply. Do not open a separate route.
- **Published files.** npm ships only `lib/` and `cordis.patch.yml` (`files` in `package.json`).
  A new runtime file must be added there, or it will be missing after install.
- **Style.** Match the file you are editing: `lib/index.js` uses 2-space indentation, `lib/client.js`
  uses tabs. Source comments and JSDoc are in English. User-facing panel strings live in the
  `global-rules` locale namespace (`DICTS` in `lib/client.js`) and are registered through
  `ctx.locale` with both `zh` and `en` — add a key to both dictionaries, never a literal string in
  the render tree.

## Manual test checklist

There is no test runner; `node test.js` self-checks dictionary parity and the slot/locale
registration shape. A pull request should state which of these it ran:

1. With `$DSH_HOME` unset, the panel shows `~/.dsh/AGENTS.md`; with `$DSH_HOME` set, it shows
   `$DSH_HOME/AGENTS.md`.
2. With the file missing, the panel says it does not exist yet, and saving creates it.
3. After saving, a **new session** follows the new rules on its first step.
4. In the session that saved, the rules are noticed after the next filesystem tool call.
5. A body above 256 KiB is rejected with 413 and the file is left unchanged.
6. An unwritable file surfaces the OS error text in the panel instead of failing silently.

## Commit messages

Conventional Commits prefixes are used in this repository, with a Chinese or English subject:

```
fix: 按 $DSH_HOME 解析全局规则文件，并把接口迁入 /api 信任栅栏
docs: npm-first install instructions
ci: add npm publish workflow on version tags
```

Common types: `feat`, `fix`, `docs`, `ci`, `chore`, `refactor`. Keep one logical change per commit.

## Pull requests

- Branch off `main` and keep the change surgical: no drive-by refactors or reformatting.
- Say what the change does, why, and what it deliberately does **not** do.
- Note the manual checks you ran (see the checklist above).
- Update both READMEs when behavior or installation changes.

## Release (maintainers)

1. Bump `version` in `package.json` and commit it.
2. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. [.github/workflows/publish.yml](.github/workflows/publish.yml) publishes to npm on the tag,
   authenticating with the `NPM_TOKEN` repository secret.
