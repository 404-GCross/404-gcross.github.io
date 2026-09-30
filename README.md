# 404

「404」——川宇不是GCross 的个人博客。

站点使用 [Astro](https://astro.build/) 构建，主题为 [Shirone](https://github.com/LyraVoid/Shirone)，
以 npm 包 `shirones` 的方式引入（package 模式）：仓库里只放配置、内容与静态资源。

- 主站（canonical）：<https://gcross.pages.dev>
- 镜像：<https://404-gcross.github.io>

## 常用命令

```bash
pnpm install   # 安装依赖
pnpm dev       # 本地开发，http://localhost:4321
pnpm build     # 构建到 dist/（含 Pagefind 全文索引）
pnpm check     # astro check 类型检查
pnpm preview   # 预览构建产物
```

## 内容与配置在哪

| 路径 | 用途 |
| --- | --- |
| `shirones/content/posts/` | 文章 |
| `shirones/content/spec/about.md` | 关于页 |
| `shirones/config/` | 站点配置（标题、导航、侧栏、主题色、音乐……） |
| `shirones/config/data/` | 设备、项目、友链等数据 |
| `public/` | banner、设备图、项目封面、favicon 等静态资源 |
| `src/pages/privacy.astro` | 隐私说明页 |
| `src/components/` | 覆盖主题组件（目前用于挂载 Clarity 统计） |

## 部署

推送到 `main` 会触发三个 workflow：

1. `Lint`——`astro check` + 构建；
2. `Deploy to Cloudflare Pages`——构建后用 wrangler 发布到 `gcross` 项目；
3. `Deploy to GitHub Pages`——构建产物发布到镜像站。

## 更新主题

```bash
pnpm update shirones
```

主题更新只涉及 `node_modules`；`shirones/config/` 与 `src/components/` 下的文件属于本站，
不会被覆盖，升级后请留意上游是否有配置项变更。
