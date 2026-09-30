import type { ProfileConfig } from "@/types/config";
import { withUserConfig } from "@/utils/config-overlay.ts";

/**
 * 博主资料：头像 / 名称 / 简介 / 社交链接（侧栏 Profile 卡片、页脚、RSS 作者等消费）。
 * 类型见 src/types/config.ts。
 *
 * 注：package 模式下相对路径只会在主题包内查找，因此这里统一使用
 * 以 "/" 开头的 public 路径。
 */
export const profileConfig: ProfileConfig = withUserConfig("profile", {
	avatar: "/images/avatar.webp",
	name: "川宇不是GCross",
	bio: "Just for fun",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/404-GCross",
		},
		{
			name: "Bilibili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/284794628",
		},
		{
			name: "Kungal 论坛",
			icon: "material-symbols:forum",
			url: "https://www.kungal.com/user/1922",
		},
	],
});
