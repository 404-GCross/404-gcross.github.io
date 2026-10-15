import type { I18nConfig } from "@/types/i18nConfig.ts";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * i18n 覆盖：按语言代码分组，只写需要改的键，其余沿用主题文案。
 *
 * gamesBanner / gamesViewDetails 是游戏页特有的一条——卡片外链指向作品在
 * Hikarinagi 的页面（数据来源署名要求），所以按钮文案不能是主题默认的
 * 「商店页面」。页面底部另有一行显式署名，见 src/pages/games.astro。
 */
export const i18nConfig: I18nConfig = withUserConfig("i18n", {
	zh_CN: {
		gamesBanner: "我在 Hikarinagi 记录的 Galgame 履历——状态、年份与作品简介。",
		gamesViewDetails: "Hikarinagi 页面",
	},
});
