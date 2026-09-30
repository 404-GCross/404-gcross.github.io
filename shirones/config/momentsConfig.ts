import type { MomentsConfig } from "@/types/momentsConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

export const momentsConfig: MomentsConfig = withUserConfig("moments", {
	// 本站不使用日记：关闭后导航隐藏、访问 /moments/ 返回 404，
	// astro.config.mjs 的 excludeRoutes 里也移除了该路由。
	enable: false,
	title: "$t:moments",
	description: "$t:momentsBanner",
});
