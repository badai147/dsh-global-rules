# 贡献指南

[English](CONTRIBUTING.md) | 中文

感谢你愿意为本项目出一份力。本文说明如何反馈问题、如何搭建开发环境，以及提交 PR 时需要遵守的约定。

## 参与方式

- **Bug 反馈** —— 按下面的模板提 Issue。
- **功能建议** —— 先提 Issue 讲清楚使用场景；改一处面板文案和改一套架构是完全不同的提案。
- **Pull Request** —— 修 Bug、改文档、做小而聚焦的功能。
- **文档** —— 欢迎修正 [README.zh-CN.md](README.zh-CN.md) / [README.md](README.md) 的措辞。

## 反馈 Bug

请附上：

- `dsh --version`、操作系统、插件版本（看 `package.json` 或 npm 页面）
- 你的操作、期望结果、实际结果
- 设置面板里的提示文案，以及浏览器 DevTools 控制台中的报错
- 是否设置了 `$DSH_HOME`，目标 `AGENTS.md` 是否存在、是否可写

本插件改的是真正生效的用户级规则文件，请勿把文件里的私人内容整段贴进 Issue，给最小片段即可。

## 开发环境

前置条件：已安装 `dsh`（含 `web` profile）、`pnpm`（`dsh plugin` 内部使用）、Git。

```sh
git clone https://github.com/badai147/dsh-global-rules.git
cd dsh-global-rules
dsh plugin --profile web add .
```

无需安装依赖，也无需构建：本包没有依赖，也没有构建步骤（`package.json` 里没有 `scripts`）。
`dsh plugin --profile web add .` 请在**仓库根目录**执行——相对路径会按你执行命令的目录解析；
用绝对路径则在任何目录都可以。

重启 `dsh web`，然后打开 **设置 → 全局规则**。

调试结束后解除本地挂载：

```sh
dsh plugin --profile web remove dsh-global-rules
```

## 开发循环

| 改动的文件 | 生效方式 |
| --- | --- |
| `lib/index.js`（Host） | 重启 `dsh web`——Host 端在 profile 启动时加载 |
| `lib/client.js`（Client bundle） | 刷新页面；Host 在文件时间戳或大小变化时会重新读取 bundle。界面没更新就重启 `dsh web` |

调试提示：

- 接口挂在 `/api` 下，位于浏览器鉴权栅栏之内，因此未登录的 `curl` 按设计返回 401/403；
  请改用 DevTools 的 Network 面板查看请求。
- `GET /api/global-rules` 返回 `{ exists, content, path }`；`POST` 接收 `{ content }`。
  失败形态：请求体非 JSON、或 `content` 不是字符串时返回 400；超过 256 KiB 返回 413；
  读写文件失败时返回 500，并带上操作系统错误信息。
- 声称路径解析改动可用之前，请分别验证设置与未设置 `DSH_HOME` 两条分支。

## 项目约定

这些约定保证插件可安装、可评审，破坏其中任何一条都需要给出理由。

- **零构建、零依赖。** 不要引入构建步骤、打包器、TypeScript 源码树或运行时依赖；
  `lib/client.js` 是手写的 `__ModuleLoader__` bundle。
- **Host 端为纯 Node ESM。** 外部插件不能假设 harness 内部包（`@deepseek-ai/*`）在 profile 里可解析，
  所以短规则一律内联——`lib/index.js` 的 `resolveHome()` 刻意对齐内置的 `resolveDshHome`
  （非空 `$DSH_HOME` 优先，否则 `~/.dsh`）。请保持两者同步，而不是改成 import。
- **Client 端外部模块。** bundle 可以 `require("react")` 以及 shell 的基线模块表；
  新增非基线请求时，必须同时在 `package.json` 的 `dsh.client.inject` 中声明。
- **接口留在 `/api` 下。** 新增 Host 接口必须走 `ctx.connection.fetch.register` 并挂在 `/api` 下，
  这样才能套用 Host/Origin 栅栏与浏览器鉴权；不要另开路由。
- **发布文件清单。** npm 只发布 `lib/` 与 `cordis.patch.yml`（见 `package.json` 的 `files`）；
  新增运行时会用到的文件必须加进该清单，否则安装后会缺失。
- **风格。** 与所在文件保持一致：`lib/index.js` 用两个空格缩进，`lib/client.js` 用制表符。
  源码注释与 JSDoc 用英文；用户可见的面板文案放在 `global-rules` locale 命名空间里
  （`lib/client.js` 的 `DICTS`），经 `ctx.locale` 注册且 `zh`、`en` 都要有——新增文案请同时补两本
  字典，不要在渲染逻辑里写死字符串。

## 手工测试清单

本包没有测试运行器；`node test.js` 可自检字典平价与 slot/locale 注册形态。因此 PR 请说明你跑过下列哪几项：

1. 未设置 `$DSH_HOME` 时面板显示 `~/.dsh/AGENTS.md`；设置后显示 `$DSH_HOME/AGENTS.md`。
2. 文件不存在时面板提示尚不存在，保存后文件被创建。
3. 保存后，**新会话**在首个步骤即按新规则执行。
4. 在保存它的那个会话里，下一次文件工具调用后规则被感知到。
5. 超过 256 KiB 的请求体被 413 拒绝，且原文件未被改动。
6. 文件不可写时，面板显示操作系统错误信息，而不是静默失败。

## 提交信息

本仓库使用 Conventional Commits 前缀，描述可用中文或英文：

```
fix: 按 $DSH_HOME 解析全局规则文件，并把接口迁入 /api 信任栅栏
docs: npm-first install instructions
ci: add npm publish workflow on version tags
```

常用类型：`feat`、`fix`、`docs`、`ci`、`chore`、`refactor`。一次提交只做一件事。

## Pull Request

- 从 `main` 切分支，改动保持外科手术式：不要顺手重构或重排格式。
- 说明改了什么、为什么改，以及本次**不做**什么。
- 写清你做过的手工验证（见上面的清单）。
- 行为或安装方式变化时，两份 README 一并更新。

## 发版（维护者）

1. 修改 `package.json` 的 `version` 并提交。
2. 打标签并推送：`git tag vX.Y.Z && git push origin vX.Y.Z`。
3. [.github/workflows/publish.yml](.github/workflows/publish.yml) 在 tag 上发布到 npm，
   使用仓库密钥 `NPM_TOKEN` 鉴权。
