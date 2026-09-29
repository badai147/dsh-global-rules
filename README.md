# dsh-global-rules

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

English | [中文](README.zh-CN.md)

Edit your user-global rules file `$DSH_HOME/AGENTS.md` (default `~/.dsh/AGENTS.md`) from the DeepSeek Harness web settings panel.

![Global rules settings page](globalrule.png)

## Features

- A new **Global rules** settings tab (labelled 「全局规则」): opening it loads the current content of the global rules file and shows the path it resolved to
- Path resolution matches the harness: a non-blank `$DSH_HOME` wins, otherwise `~/.dsh` (the same rule the built-in `dsh-agent-instructions` follows, so you always edit the file that is actually in effect)
- Edit and save with immediate effect: **new sessions** use the new rules on their first step; the current session picks them up after its next file operation (handled by DSH's built-in `dsh-agent-instructions` change detection)
- Saving creates the file when it does not exist yet
- Zero build: the client half is a hand-written `__ModuleLoader__` bundle, the host half is plain Node ESM

## Requirements

- DeepSeek Harness (`dsh`) with the `web` profile
- No extra runtime dependency: the plugin ships only `lib/` and `cordis.patch.yml`

## Install

```sh
dsh plugin --profile web add dsh-global-rules
```

Installing from the GitHub source (alternative):

```sh
dsh plugin --profile web add github:badai147/dsh-global-rules
```

Restart `dsh web`, then open **Settings → Global rules**.

## Usage

1. Open Settings → Global rules
2. Edit the rules (Markdown, the same syntax as `AGENTS.md`)
3. Click **Save**

After saving:

- New sessions read the new content on their first step, so it applies immediately
- The current session: after the next filesystem tool call, DSH detects the change and injects
  "Updated instructions from: ~/.dsh/AGENTS.md", and the model follows the new rules

## How it works

- **Host** (`lib/index.js`): registers the exact Fetch route `GET/POST /api/global-rules` through `ctx.connection.fetch.register` (read the file / write the file, 256 KiB limit). It rides Connection's `/api` channel, so it lands inside the Host/Origin fence and browser authentication with no hand-rolled same-origin check
- **Client** (`lib/client.js`): a hand-written `window.__ModuleLoader__.load` bundle that registers the **Global rules** page under `settings.section`
- **Effect mechanism**: DSH's built-in `dsh-agent-instructions` plugin covers dynamic detection for the `user-global` scope, so this plugin needs no hot-reload of its own

## Project structure

```
dsh-global-rules/
├── cordis.patch.yml      # bundle patch: inserts the global-rules layer
├── lib/
│   ├── index.js          # Host: exact /api Fetch route (Node ESM)
│   └── client.js         # Client: settings panel UI (__ModuleLoader__ bundle)
├── .github/workflows/
│   └── publish.yml       # npm publish on version tags
└── package.json
```

## Changelog

Release notes live in [CHANGELOG.md](CHANGELOG.md) ([中文](CHANGELOG.zh-CN.md)).

## Contributing

Bug reports, feature requests, and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md)
([中文](CONTRIBUTING.zh-CN.md)) for the development setup, project conventions, and commit rules.

## License

[MIT](LICENSE)
