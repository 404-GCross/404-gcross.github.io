/**
 * 项目页数据源（纯内容）。
 * 页面展示与筛选规则由 shirones/config/projectsConfig.ts 控制。
 */
import type { ProjectItem } from "@/types/projectsConfig";

export const projectsData: ProjectItem[] = [
	{
		key: "sena-repo",
		title: "Sena-Repo",
		summary:
			"自托管、跨平台的视觉小说库管理器，支持一键安装游戏并向 Steam 注入补丁。",
		category: "desktop",
		phase: "building",
		technologies: ["Flutter", "Dart", "Python", "Docker"],
		icon: "material-symbols:menu-book-outline-rounded",
		cover: "/assets/projects/sena-repo.webp",
		coverAlt: "Sena-Repo 界面预览",
		featured: true,
		website: "https://sena-repo.github.io",
		repository: "https://github.com/404-GCross/Sena-Repo",
		year: "2026",
	},
	{
		key: "droidspaces-gki",
		title: "Droidspaces GKI 本地编译",
		summary:
			"本地一键编译适用于 Droidspaces 的 GKI 内核，支持镜像加速，无需直连 GitHub。",
		category: "tooling",
		phase: "building",
		technologies: ["Shell", "C", "Makefile", "KernelSU"],
		icon: "material-symbols:terminal-rounded",
		cover: "/assets/projects/droidspaces-gki.webp",
		coverAlt: "Droidspaces GKI 本地编译脚本预览",
		repository: "https://github.com/404-GCross/Droidspaces_GKI_Buildin_Local",
		year: "2026",
	},
];

/** 获取所有项目数据列表 */
export function getProjectsList(): ProjectItem[] {
	return projectsData;
}
