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
			image: "",
			specs: "手机",
			description: "日常主力机。",
			link: "https://www.mi.com/",
		},
		{
			name: "红米 K90 Pro Max",
			image: "",
			specs: "手机",
			description: "大屏高性能，玩游戏用。",
			link: "https://www.mi.com/",
		},
	],
	平板: [
		{
			name: "小米平板 8 Pro",
			image: "",
			specs: "平板",
			description: "看剧、记笔记、随手写点东西。",
			link: "https://www.mi.com/",
		},
	],
	掌机: [
		{
			name: "ROG ALLY",
			image: "",
			specs: "掌机",
			description: "随时随地打游戏。",
			link: "https://rog.asus.com.cn/",
		},
	],
	笔记本: [
		{
			name: "ROG 幻14 Air 2025",
			image: "",
			specs: "笔记本",
			description: "轻薄的独显本，便携与性能兼得。",
			link: "https://rog.asus.com.cn/",
		},
	],
};
