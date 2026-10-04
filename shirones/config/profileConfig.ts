import type { ProfileConfig } from "@/types/config";
import { withUserConfig } from "@/utils/config-overlay.ts";

/** 社交链接额外允许自备图片 logo；覆盖版 organisms/Profile 会把它渲染成 <img>。 */
type ProfileLinkWithImage = ProfileConfig["links"][number] & { image?: string };

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
			// 用 KunGal 项目的本名 + 自备 logo，而不是汉化的「Kungal 论坛」+ 通用图标。
			// 图片字段不在主题类型里，靠覆盖版 organisms/Profile 渲染成 <img>。
			name: "KunGal",
			icon: "material-symbols:forum",
			image: "/images/social/kungal.webp",
			url: "https://www.kungal.com/user/1922",
		},
		{
			// 离线图标集（fa6 / material-symbols / simple-icons）里没有 CoolAPK，
			// 同样走自备 logo 图（取自 coolapk.com 官网 header 图标）。
			name: "CoolAPK",
			icon: "material-symbols:apps",
			image: "/images/social/coolapk.webp",
			url: "https://www.coolapk.com/u/24499587",
		},
	] as ProfileLinkWithImage[],
});
