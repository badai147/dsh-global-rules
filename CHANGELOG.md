# Changelog

English | [中文](CHANGELOG.zh-CN.md)

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-09-30

### Added

- `AGENTS.md`: repository guidance for coding agents.
- `test.js`: a zero-dependency self-check for dictionary parity and the slot/locale registration
  shape, run with `node test.js`. It is not published to npm.

### Changed

- The settings panel is localized through DSH's built-in locale service: it follows the active
  interface language instead of always rendering Chinese, and re-renders live when the language
  changes in Settings → General.
- Documentation restructured: `README.md` is now the English README with a Chinese counterpart in
  `README.zh-CN.md`; contribution guidance moved to `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md`.

## [0.2.0] - 2026-09-26

### Changed

- **The edited file now follows `$DSH_HOME`**, with the same precedence as the harness's built-in
  instruction loader: a non-blank `DSH_HOME` wins, otherwise `~/.dsh`. The path used to be hardcoded
  to `~/.dsh/AGENTS.md`, so a profile launched with `DSH_HOME` set edited a file that was not the
  one in effect.
- The settings panel now shows the resolved symbolic path (`~/.dsh/AGENTS.md`, or
  `$DSH_HOME/AGENTS.md` when the variable is set) instead of no path at all.

### Security

- The API moved from `/global-rules` to `/api/global-rules` and is now registered through
  Connection's exact Fetch registry, so the Host/Origin fence and browser authentication apply. The
  previous plain web-server route had neither.

### Fixed

- An expired or unauthenticated browser session now reports
  「会话未通过鉴权，请刷新页面后重试」 instead of a bare HTTP status code.

## [0.1.1] - 2026-09-08

### Fixed

- The client half declared `@deepseek-ai/dsh-client-runtime` in `dsh.client.inject`. That package no
  longer exists in the harness, which could keep the client half from loading; the declaration is
  removed.

## [0.1.0] - 2026-08-15

### Added

- Initial release: a 「全局规则」 (Global rules) section in the web settings panel that reads and
  writes the user-global instruction file `~/.dsh/AGENTS.md`.
- Host half: `GET`/`POST` endpoints that read and write the file, with a 256 KiB request-body cap.
- Client half: a hand-written `__ModuleLoader__` bundle registering the settings section.
- Saving creates the file when it does not exist yet.

[Unreleased]: https://github.com/badai147/dsh-global-rules/compare/v0.2.1...HEAD
[0.2.1]: https://www.npmjs.com/package/dsh-global-rules/v/0.2.1
[0.2.0]: https://www.npmjs.com/package/dsh-global-rules/v/0.2.0
[0.1.1]: https://www.npmjs.com/package/dsh-global-rules/v/0.1.1
[0.1.0]: https://www.npmjs.com/package/dsh-global-rules/v/0.1.0
