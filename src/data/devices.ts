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
				"平时用得最多的手机。背面那块小屏看通知、看时间挺方便，一天一充也够用。",
			link: "https://www.mi.com/prod/xiaomi-17-pro",
		},
		{
			name: "红米 K90 Pro Max",
			image: "/images/device/redmi-k90-pro-max.webp",
			specs: "6.9″ 2K · 7560mAh",
			description:
				"屏幕大，主要拿来追剧和打游戏。外放声音够大，续航也踏实，就是有点沉。",
			link: "https://www.mi.com/prod/redmi-k90-pro-max",
		},
	],
	平板: [
		{
			name: "小米平板 8 Pro",
			image: "/images/device/xiaomi-pad-8-pro.webp",
			specs: "11.2″ 3.2K · 9200mAh",
			description:
				"看剧、记笔记、随手写点东西。接上键盘能凑合改点稿子，重活还是留给电脑。",
			link: "https://www.mi.com/prod/xiaomi-pad-8-pro",
		},
	],
	掌机: [
		{
			name: "ROG ALLY",
			image: "/images/device/rog-ally.webp",
			specs: "Ryzen Z1 Extreme · 7″ FHD",
			description:
				"图的就是躺床上能开一局。3A 跑得动，库里那些 Windows 游戏也基本都能玩。",
			link: "https://rog.asus.com.cn/gaming-handhelds/rog-ally/rog-ally-2023/",
		},
	],
	笔记本: [
		{
			name: "ROG 幻14 Air 2025",
			image: "/images/device/rog-zephyrus-g14-air-2025.webp",
			specs: "锐龙 AI 9 HX 370 · 2.8K OLED",
			description:
				"出门写代码、回家开黑都是它。屏幕看着舒服，重量也带得动，不用来回换机器。",
			link: "https://rog.asus.com.cn/laptops/rog-zephyrus/rog-zephyrus-g14-2025/",
		},
	],
};
