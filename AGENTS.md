# AGENTS.md

本文件记录本仓库的项目约定，供 AI 助手与协作者参考；通用行为准则见 [`CLAUDE.md`](./CLAUDE.md)。

## 项目概览

- 「404」个人博客，基于 Astro + [Shirone](https://github.com/LyraVoid/Shirone) 主题。
- **主题以 npm 包 `shirones` 的形式使用**（package 模式）：仓库里只有配置、内容与静态资源，
  主题源码在 `node_modules/shirones`。主题更新 = `pnpm update shirones`，不再是 `git pull upstream`。
  （仓库历史中仍保留早期 Mizuki 主题的提交，仅供追溯，不再同步。）
- 站点与提交描述统一使用中文。
- 主站（canonical）：<https://gcross.pages.dev>；GitHub Pages 仅为镜像，安全响应头只在 Cloudflare 侧生效。
- 推送到 `main` 会自动触发 3 个 workflow：`Lint` / `Deploy to Cloudflare Pages` / `Deploy to GitHub Pages`，三者全绿才算完成。

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `astro.config.mjs` | 唯一的 Astro 配置，挂载 `shirones()` 并声明 `excludeRoutes` |
| `shirones/config/*.ts` | 站点配置（站点身份、导航、侧栏、设备、项目、音乐、评论……） |
| `shirones/config/data/*.ts` | 纯内容数据（设备、项目、友链、音乐） |
| `shirones/content/posts/` | 文章 |
| `shirones/content/moments/` | 日记目录（本站已关闭日记，仅留占位） |
| `shirones/content/spec/about.md` | 「关于」页内容 |
| `src/pages/privacy.astro` | 站点自有的「隐私说明」页（主题没有此页） |
| `src/components/` | 覆盖主题组件的目录：`system/ConfigCarrier.astro`（挂载 Clarity）、`molecules/SiteStats.astro`（关闭日记后隐藏「动态」统计行） |
| `public/` | 静态资源：banner、设备图、项目封面、favicon、`_headers` |
| `.github/workflows/` | 三个 CI workflow |

## 站点定制时的注意事项

- **图片一律用 public 绝对路径**（如 `/images/device/xxx.webp`）。package 模式下主题只会在自己的
  包里解析相对路径，写在 `src/assets/...` 的相对路径会指到主题自带图片。
- **关闭页面**要两处同时改：对应配置里的 `enable: false`（导航自动裁剪），以及
  `astro.config.mjs` 的 `excludeRoutes`（不产出路由）。当前关闭：日记、番剧、相册、技能、时间线、
  游戏、站点罗盘、系列。
- **访问统计**是 Microsoft Clarity（`yqdo4s8yn8`），通过覆盖 `src/components/system/ConfigCarrier.astro`
  注入：尊重 DNT，首次交互或 10 秒后才加载。主题自带的 umami 配置保持关闭。
- 主题没有通用 head 注入点；若升级后统计失效，优先检查 ConfigCarrier 是否被上游改名。

## 提交信息规范

标题格式：`<type>(<scope>): <中文描述>`

- **type**：`feat` `fix` `chore` `docs` `refactor` `perf` `style` `ci` `build` `test`
- **scope** 可省略；常用值：`nav` `banner` `layout` `config` `site` `brand` `devices` `privacy` `security` `deps` `music-player` `markdown`
- 描述用中文、动词开头，结尾不加句号，标题尽量简短（建议 50 字符以内）。
- 正文说明「改了什么 / 为什么 / 如何验证」，每行约 72 字符换行。

示例：

```
feat(brand): 顶栏图标与 favicon 换成 404 徽章

chore(deps): 从 Mizuki 迁移到 Shirone（shirones 包模式）
```

一次提交只做一件事，不要混入无关的格式化或重构。

## 提交身份（重要）

提交者邮箱必须是绑定在 GitHub 账号上的地址，否则 GitHub 无法把提交关联到账号：

```bash
git config user.name  "GCross"
git config user.email "176783842+404-GCross@users.noreply.github.com"
```

## 常用命令

| 用途 | 命令 |
| --- | --- |
| 安装依赖 | `corepack pnpm install` |
| 本地开发 | `corepack pnpm run dev`（http://localhost:4321） |
| 构建到 `dist/`（含 Pagefind 索引） | `corepack pnpm run build` |
| 类型检查 | `corepack pnpm run check`（`astro check`） |
| 本地预览构建产物 | `corepack pnpm run preview` |

> 新增/删除内容目录后若出现 `glob-loader` 空集合警告，属于正常提示；`shirones/content/moments`、
> `series` 与 `snippets` 都只是占位，本站未使用日记与系列功能。
