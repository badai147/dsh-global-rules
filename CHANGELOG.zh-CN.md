# 更新日志

[English](CHANGELOG.md) | 中文

本项目的所有重要变更都记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.2.1] - 2026-09-30

### Added

- `AGENTS.md`：面向编码 agent 的仓库指南。
- `test.js`：零依赖自检脚本，校验字典平价与 slot/locale 注册形态，用 `node test.js` 运行；
  不随 npm 发布。

### Changed

- 设置面板接入 DSH 内置的 locale 服务：界面跟随当前生效的语言，不再固定渲染中文；在
  设置 → 通用 里切换语言时即时重渲染。
- 文档结构重整：`README.md` 改为英文版，中文版移至 `README.zh-CN.md`；贡献指南移至
  `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md`。

## [0.2.0] - 2026-09-26

### Changed

- **编辑的文件改为跟随 `$DSH_HOME`**，优先级与 harness 内置的指令加载器一致：非空 `DSH_HOME`
  优先，否则 `~/.dsh`。此前路径硬编码为 `~/.dsh/AGENTS.md`，因此在设置了 `DSH_HOME` 的 profile
  里，编辑的并不是真正生效的那个文件。
- 设置面板开始显示解析出的符号路径（`~/.dsh/AGENTS.md`，设置该变量时为 `$DSH_HOME/AGENTS.md`），
  此前不显示任何路径。

### Security

- 接口从 `/global-rules` 迁到 `/api/global-rules`，并改由 Connection 的精确 Fetch 注册表注册，
  因此现在会经过 Host/Origin 栅栏与浏览器鉴权；此前的裸 web-server 路由两者都没有。

### Fixed

- 浏览器会话过期或未通过鉴权时，提示「会话未通过鉴权，请刷新页面后重试」，不再只显示裸的 HTTP
  状态码。

## [0.1.1] - 2026-09-08

### Fixed

- 客户端半边在 `dsh.client.inject` 中声明了 `@deepseek-ai/dsh-client-runtime`。该包在 harness 中
  已不存在，可能导致客户端半边无法加载；现已移除该声明。

## [0.1.0] - 2026-08-15

### Added

- 首个版本：Web 设置面板中的「全局规则」分区，用于读写用户级全局规则文件 `~/.dsh/AGENTS.md`。
- Host 半边：读写该文件的 `GET`/`POST` 接口，请求体上限 256 KiB。
- Client 半边：手写 `__ModuleLoader__` bundle，注册该设置分区。
- 文件不存在时，保存会自动创建。

[Unreleased]: https://github.com/badai147/dsh-global-rules/compare/v0.2.1...HEAD
[0.2.1]: https://www.npmjs.com/package/dsh-global-rules/v/0.2.1
[0.2.0]: https://www.npmjs.com/package/dsh-global-rules/v/0.2.0
[0.1.1]: https://www.npmjs.com/package/dsh-global-rules/v/0.1.1
[0.1.0]: https://www.npmjs.com/package/dsh-global-rules/v/0.1.0
