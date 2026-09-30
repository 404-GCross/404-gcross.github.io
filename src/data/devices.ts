// 设备数据配置文件

export interface Device {
	name: string;
	image?: string;
	specs: string;
	description: string;
	link?: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = Record<string, Device[]> & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	手机: [
		{
			name: "小米 17 Pro",
			image: "/images/device/xiaomi-17-pro.webp",
			specs: "骁龙 8 Elite Gen 5 · 6300mAh",
			description:
				"日常主力机。妙享背屏不用翻面就能看通知、自拍，徕卡三摄加 6300mAh，一天一充很安心。",
			link: "https://www.mi.com/prod/xiaomi-17-pro",
		},
		{
			name: "红米 K90 Pro Max",
			image: "/images/device/redmi-k90-pro-max.webp",
			specs: "6.9″ 2K · 7560mAh",
			description:
				"大屏加满血性能，打游戏看片都爽。Bose 2.1 三扬声器外放很猛，7560mAh 续航踏实。",
			link: "https://www.mi.com/prod/redmi-k90-pro-max",
		},
	],
	平板: [
		{
			name: "小米平板 8 Pro",
			image: "/images/device/xiaomi-pad-8-pro.webp",
			specs: "11.2″ 3.2K · 9200mAh",
			description:
				"看剧、记笔记、随手写点东西都靠它。3.2K 144Hz 屏幕细腻顺滑，配上键盘就是轻办公本。",
			link: "https://www.mi.com/prod/xiaomi-pad-8-pro",
		},
	],
	掌机: [
		{
			name: "ROG ALLY",
			image: "/images/device/rog-ally.webp",
			specs: "Ryzen Z1 Extreme · 7″ FHD",
			description:
				"随时随地打游戏的快乐。Z1 Extreme 跑 3A 够用，Windows 兼容性拉满，躺床上也能开一局。",
			link: "https://rog.asus.com.cn/gaming-handhelds/rog-ally/rog-ally-2023/",
		},
	],
	笔记本: [
		{
			name: "ROG 幻14 Air 2025",
			image: "/images/device/rog-zephyrus-g14-air-2025.webp",
			specs: "锐龙 AI 9 HX 370 · 2.8K OLED",
			description:
				"轻薄独显本，便携和性能我都要。2.8K OLED 素质极好，出门写代码、回家开黑不用换机器。",
			link: "https://rog.asus.com.cn/laptops/rog-zephyrus/rog-zephyrus-g14-2025/",
		},
	],
};
