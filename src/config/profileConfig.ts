import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.webp", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "川宇不是GCross",
	bio: "Just for fun",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/404-GCross",
		},
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/284794628",
		},
		{
			name: "Kungal 论坛",
			icon: "material-symbols:forum",
			image: "/images/social/kungal.webp",
			url: "https://www.kungal.com/user/1922",
		},
	],
};
