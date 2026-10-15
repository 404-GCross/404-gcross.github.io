import type { GamesConfig } from "@/types/gamesConfig";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * 游戏展示页行为与展示配置。
 *
 * 遵循「配置管行为，数据管内容」原则：
 * - enable：页面总开关；false 时导航入口同步隐藏，访问 /games/ 跳转 404；
 * - categories：游戏分类清单（数组顺序即页面顶部 Chips 顺序；
 *   没有任何条目的分类会自动隐藏，因此可放心保留暂时用不到的分类）；
 * - disabledIds：可选被禁用的游戏 ID 列表。
 *
 * 注：游戏清单数据在 `shirones/config/data/games.ts`，**由脚本生成**
 * （scripts/sync-hikarinagi.mjs，同步 Hikarinagi 的状态与评分记录），
 * 不要手改；调整同步规则请改脚本后重跑。
 */
export const gamesConfig: GamesConfig = withUserConfig("games", {
	enable: true,
	title: "$t:games",
	description: "$t:gamesBanner",
	categories: [
		{
			key: "galgame",
			label: "Galgame",
			icon: "material-symbols:menu-book-rounded",
			description: "视觉小说 / Galgame",
		},
	],
	// disabledIds: [],
});
