// Project data configuration file
// Used to manage data for the project display page

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	visitUrl?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	showImage?: boolean;
}

// 项目数据
// 添加示例：
// {
// 	id: "my-project",
// 	title: "我的项目",
// 	description: "项目简介",
// 	image: "/assets/projects/my-project.webp",
// 	category: "web",
// 	techStack: ["Astro", "TypeScript"],
// 	status: "in-progress",
// 	sourceCode: "https://github.com/404-GCross/my-project",
// 	startDate: "2026-09-30",
// 	featured: true,
// 	tags: ["Web"],
// },
export const projectsData: Project[] = [
	{
		id: "sena-repo",
		title: "Sena-Repo",
		description:
			"自托管、跨平台的视觉小说库管理器，支持一键安装游戏并向 Steam 注入补丁。",
		image: "/assets/projects/sena-repo.webp",
		category: "desktop",
		techStack: ["Flutter", "Dart", "Python", "Docker"],
		status: "in-progress",
		visitUrl: "https://sena-repo.github.io",
		sourceCode: "https://github.com/404-GCross/Sena-Repo",
		startDate: "2026-06-05",
		featured: true,
		tags: ["视觉小说", "AGPL-3.0"],
	},
	{
		id: "droidspaces-gki",
		title: "Droidspaces GKI 本地编译",
		description:
			"本地一键编译适用于 Droidspaces 的 GKI 内核，支持镜像加速，无需直连 GitHub。",
		image: "/assets/projects/droidspaces-gki.webp",
		category: "other",
		techStack: ["Shell", "C", "Makefile", "KernelSU"],
		status: "in-progress",
		sourceCode: "https://github.com/404-GCross/Droidspaces_GKI_Buildin_Local",
		startDate: "2026-05-23",
		tags: ["内核编译", "GPL-2.0"],
	},
];

// Get project statistics
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter((p) => p.status === "completed").length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// Get projects by category
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// Get featured projects
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// Get all tech stacks
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => {
			techSet.add(tech);
		});
	});
	return Array.from(techSet).sort();
};
