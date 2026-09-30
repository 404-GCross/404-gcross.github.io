# 404

川宇不是GCross 的个人博客，基于 [Astro](https://astro.build) 与 [Mizuki](https://github.com/LyraVoid/Mizuki) 主题构建。

- 主站（canonical）：<https://gcross.pages.dev>
- 镜像：<https://404-gcross.github.io>

## 本地开发

```bash
pnpm install
pnpm dev        # 本地预览 http://localhost:4321
pnpm build      # 构建到 dist/
```

## 配置位置

| 内容 | 文件 |
| --- | --- |
| 站点信息 / 功能开关 / 横幅 | `src/config/siteConfig.ts` |
| 个人资料 / 社交链接 | `src/config/profileConfig.ts` |
| 导航栏 | `src/config/navBarConfig.ts` |
| 音乐播放器 | `src/config/musicConfig.ts` |
| 评论 | `src/config/commentConfig.ts` |
| 看板娘 | `src/config/pioConfig.ts` |
| 日记 / 友链 / 项目 / 设备数据 | `src/data/*.ts` |
| 文章 | `src/content/posts/` |
| 关于页 | `src/content/spec/about.md` |

## 部署

- **Cloudflare Pages**：连接本仓库，构建命令 `pnpm run build`，输出目录 `dist`，环境变量 `NODE_VERSION=22`、`PNPM_VERSION=11.5.3`、`ENABLE_CONTENT_SYNC=false`。
- **GitHub Pages**：推送 `main` 分支后由 `.github/workflows/deploy.yml` 自动构建部署。

## 许可

主题 [Mizuki](https://github.com/LyraVoid/Mizuki) 使用 Apache-2.0 许可，详见 [LICENSE](./LICENSE)。
