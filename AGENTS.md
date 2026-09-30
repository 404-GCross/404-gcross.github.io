# AGENTS.md

本文件记录本仓库的项目约定，供 AI 助手与协作者参考；通用行为准则见 [`CLAUDE.md`](./CLAUDE.md)。

## 项目概览

- 「404」个人博客，基于 Astro + [Mizuki](https://github.com/LyraVoid/Mizuki) 主题，保留上游历史以便 `git pull upstream`。
- 站点与提交描述统一使用中文。
- 主站（canonical）：<https://gcross.pages.dev>；GitHub Pages 仅为镜像，安全响应头只在 Cloudflare 侧生效。
- 推送到 `main` 会自动触发 3 个 workflow：`Lint` / `Deploy to Cloudflare Pages` / `Deploy to GitHub Pages`，三者全绿才算完成。

## 提交信息规范

标题格式：`<type>(<scope>): <中文描述>`

- **type**：`feat` `fix` `chore` `docs` `refactor` `perf` `style` `ci` `build` `test`
- **scope** 可省略；常用值：`nav` `banner` `layout` `config` `site` `brand` `social` `devices` `privacy` `security` `deps` `pio` `music-player` `markdown` `i18n`
- 描述用中文、动词开头，结尾不加句号，标题尽量简短（建议 50 字符以内）。
- 正文说明「改了什么 / 为什么 / 如何验证」，每行约 72 字符换行。

示例：

```
feat(brand): 顶栏图标与 favicon 换成 404 徽章

fix(security): 关闭主题写死的第三方 GTM 并补充安全响应头

chore(deps): 升级依赖，pnpm audit 从 69 个漏洞降到 0
```

一次提交只做一件事，不要混入无关的格式化或重构。

## 提交身份（重要）

提交者邮箱必须是绑定在 GitHub 账号上的地址，否则 GitHub 无法把提交关联到账号，页面上会显示灰色默认头像且不链接到个人主页：

```bash
git config user.name  "GCross"
git config user.email "176783842+404-GCross@users.noreply.github.com"
```

不要使用 `404@example.com` 之类的占位身份。若发现历史提交身份写错，只能重写历史后强推 `main` 修复。

## 常用命令

| 用途 | 命令 |
| --- | --- |
| 安装依赖 | `corepack pnpm install` |
| 本地开发 | `corepack pnpm run dev` |
| 构建（含 pagefind 索引与字体检查） | `corepack pnpm run build` |
| 代码检查 | `corepack pnpm run lint`（biome，会直接改写 `./src`） |
| 类型检查 | `corepack pnpm run type-check` |
| 单元测试 | `corepack pnpm run test` |

> 改动 rehype 插件或 Markdown 渲染后，需先 `rm -rf .astro node_modules/.astro` 再构建，否则 Astro 会复用缓存产物。
