import { defineConfig } from "astro/config";
import shirones from "shirones";

// Site-level settings (site URL, base, title, theme colour, fonts, …) live in
// `shirones/config/` so they stay typed and version-controlled with your
// content. This file only wires the theme in.
export default defineConfig({
	integrations: [
		shirones({
			// 本站未维护的功能页直接不产出路由（配置里对应 enable 也已关闭）。
			excludeRoutes: [
				"/moments",
				"/anime",
				"/albums",
				"/albums/[id]",
				"/skills",
				"/timeline",
				"/games",
				"/compass",
				"/series",
				"/series/[slug]",
			],
			// Override individual components by mirroring the theme's structure in
			// `src/components/`, or point at them explicitly:
			// components: { "atoms/blog/PostCard": "./src/components/PostCard.astro" },
		}),
	],
});
