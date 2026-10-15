# AGENTS.md

本文件记录本仓库的项目约定，供 AI 助手与协作者参考；通用行为准则见 [`CLAUDE.md`](./CLAUDE.md)。

## 项目概览

- 「404」个人博客，基于 Astro + [Shirone](https://github.com/LyraVoid/Shirone) 主题。
- **主题以 npm 包 `shirones` 的形式使用**（package 模式）：仓库里只有配置、内容与静态资源，
  主题源码在 `node_modules/shirones`。主题更新 = `pnpm update shirones`，不再是 `git pull upstream`。
  （仓库历史中仍保留早期 Mizuki 主题的提交，仅供追溯，不再同步。）
- 站点内容使用中文；提交信息（标题与正文）使用英文。
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
| `src/components/` | 覆盖主题组件的目录：`system/ConfigCarrier.astro`（挂载 Clarity + 站点级样式微调）、`molecules/SiteStats.astro`（关闭日记后隐藏「动态」统计行）、`organisms/Profile.astro`（让社交链接支持自备图片 logo） |
| `public/` | 静态资源：banner、设备图、项目封面、favicon、`_headers` |
| `.github/workflows/` | 三个 CI workflow |

## 站点定制时的注意事项

- **图片一律用 public 绝对路径**（如 `/images/device/xxx.webp`）。package 模式下主题只会在自己的
  包里解析相对路径，写在 `src/assets/...` 的相对路径会指到主题自带图片。
- **社交链接的图片 logo**：主题的 `profileConfig.links` 只支持 iconify 图标名，写图片需要走
  `src/components/organisms/Profile.astro` 这份覆盖（links 里额外支持可选的 `image` 字段）。
- **关闭页面**要两处同时改：对应配置里的 `enable: false`（导航自动裁剪），以及
  `astro.config.mjs` 的 `excludeRoutes`（不产出路由）。当前关闭：日记、番剧、相册、技能、时间线、
  游戏、站点罗盘、系列。
- **访问统计**是 Microsoft Clarity（`yqdo4s8yn8`），通过覆盖 `src/components/system/ConfigCarrier.astro`
  注入：尊重 DNT，首次交互或 10 秒后才加载。主题自带的 umami 配置保持关闭。
- **站点级样式微调**也挂在 `ConfigCarrier.astro`（它只渲染一次）：目前三条 —— ① 让「关于」下拉按内容撑宽、
  避免长条目折行；② 把 `--banner-stage-height` 拉到 `100vh`，但**只在首页生效**
  （`:root:root:has(body[data-current-page="home"])`）。主题只有 `banner` / `none` 两种背景，
  没有 Mizuki 的 `fullscreen`/`overlay`；`body` 的 `data-current-page` 由主题在 Swup 导航时同步，
  所以站内切到其他页面会自动回到主题默认的 65vh 横幅。
  ③ 设备卡片隐藏 `.device-card__specs`（规格行）与 `.device-card__description`（简评），
  只留图片、名称/品牌/年份/状态和「查看详情」。这两块**内容仍保留在 `shirones/config/data/devices.ts`**：
  `DeviceItem` 里 `specs` / `description` 是必填字段，删了过不了 `astro check`，而且设备页的搜索
  会拿它们当匹配字段。改卡片只需动这条 CSS，别去删数据。
- **侧栏「运行天数」**不用主题的 `stats.days`（它以最早一篇文章的发布日为起点，且构建时写死），
  而是读 `shirones/config/siteConfig.ts` 里本地扩展的 `siteStartDate`（主题类型没有这个字段，
  消费侧断言取用），按站点时区 `timeZone` 的自然日算「第 N 天」；覆盖版
  `src/components/molecules/SiteStats.astro` 在页面加载时再算一次，不重新部署也会每天 +1。
- **缓存策略**写在 `public/_headers`：只有 Astro 产出、文件名带内容哈希的 `/_astro/*` 用
  `! Cache-Control` 改成 `immutable`；其余（HTML 与 `public/` 下的图片、横幅、favicon 等
  固定文件名资源，字体 woff2 也在 `/_astro/` 下）都是 `max-age=0, must-revalidate`，
  部署后立刻生效。**别再给固定文件名的资源加 `immutable`**：就地替换同名图片时，
  已经缓存过的浏览器一年内都不会回源（`images/device/rog-zephyrus-g14-air-2025-white.webp`
  就是为此改名的）。GitHub Pages 不支持 `_headers`，这些头只在 Cloudflare 侧生效。
- 主题没有通用 head 注入点；若升级后统计失效，优先检查 ConfigCarrier 是否被上游改名。

## 提交信息规范

标题格式：`<type>(<scope>): <English description>`

- **type**：`feat` `fix` `chore` `docs` `refactor` `perf` `style` `ci` `build` `test`
- **scope** 可省略；常用值：`nav` `banner` `layout` `config` `site` `brand` `devices` `privacy` `security` `deps` `music-player` `markdown`
- 描述用英文、动词开头、祈使语气，结尾不加句号，标题尽量简短（建议 50 字符以内）。
- 正文说明「what changed / why / how it was verified」，每行约 72 字符换行。

示例：

```
feat(brand): switch the top nav icon and favicon to the 404 badge

chore(deps): migrate from Mizuki to Shirone (shirones package mode)
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
