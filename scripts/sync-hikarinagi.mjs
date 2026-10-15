#!/usr/bin/env node
/**
 * 从 Hikarinagi 同步「状态与评分记录」到游戏页数据。
 *
 * 用法：
 *   node scripts/sync-hikarinagi.mjs            # 同步（已有封面跳过下载）
 *   node scripts/sync-hikarinagi.mjs --refresh  # 忽略缓存与已有封面，全部重取
 *   node scripts/sync-hikarinagi.mjs --user 45540
 *
 * 输出：
 *   shirones/config/data/games.ts        生成的数据文件（勿手改，改脚本再跑）
 *   public/images/games/<作品ID>.webp    竖版封面
 *
 * 数据来源与取舍：
 * - 走的是 Hikarinagi 网站自身的接口（www.hikarinagi.org/api/v3/…），不需要令牌。
 *   官方另有开发者开放 API（api.hikarinagi.org/v3/…，OIDC 发令牌，见
 *   https://www.hikarinagi.org/developers/guide），更稳但需注册应用并走一次
 *   授权码流程；若站内接口哪天变了，改用开放 API 的 /v3/user/me/rates 与
 *   /v3/galgames/{id} 即可，字段基本对应（RateWorkDto / GalgameDto）。
 * - 按 Hikarinagi 的品牌与署名要求：卡片外链指向作品在 Hikarinagi 的页面，
 *   页面另有一行「数据来自 Hikarinagi」署名（见 src/pages/games.astro）。
 * - 站点前有 Cloudflare 挑战（按 IP 信誉判定）：本机直连可过，被标记的代理出口
 *   会被拦。Node 的 fetch 默认不读 http_proxy 环境变量，正好走直连。
 * - 接口限速未知：固定 1 秒 1 个请求 + 退避重试；成功响应缓存在
 *   node_modules/.cache/hikarinagi 下，重跑不重复请求。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.hikarinagi.org";
const IMAGE_BASE = "https://imagesp.yurari.moe";
const CACHE_DIR = join(ROOT, "node_modules/.cache/hikarinagi");
const COVER_DIR = join(ROOT, "public/images/games");
const OUT_FILE = join(ROOT, "shirones/config/data/games.ts");
const COVER_WIDTH = 600; // 卡片实际显示约 170–240px，600 宽够 2x
const COVER_HEIGHT = 900;

const args = process.argv.slice(2);
const REFRESH = args.includes("--refresh");
const USER_ID = (() => {
	const i = args.indexOf("--user");
	return i >= 0 ? args[i + 1] : "45540";
})();

/** Hikarinagi 状态 → 主题 GameStatus */
const STATUS_MAP = {
	GOING: "playing",
	COMPLETED: "completed",
	ON_HOLD: "backlog",
	PLAN: "wishlist",
	DROPPED: "backlog", // 主题没有「弃坑」，并入 backlog
};
const STATUS_ORDER = { playing: 0, completed: 1, backlog: 2, wishlist: 3 };
const STATUS_LABEL = {
	GOING: "在玩",
	COMPLETED: "已通关",
	ON_HOLD: "搁置",
	PLAN: "想玩",
	DROPPED: "已弃坑",
};
/** Hikarinagi 平台码 → 展示名 */
const PLATFORM_MAP = {
	win: "PC",
	lin: "Linux",
	swi: "Switch",
	ps4: "PS4",
	ps3: "PS3",
	psv: "PS Vita",
	psp: "PSP",
	xb3: "Xbox 360",
	and: "Android",
	mob: "Android",
	ios: "iOS",
	web: "Web",
	vnd: "VNDS",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(path, { retries = 3 } = {}) {
	const cacheFile = join(CACHE_DIR, path.replace(/[^a-z0-9]+/gi, "_") + ".json");
	if (!REFRESH && existsSync(cacheFile)) {
		try {
			return JSON.parse(readFileSync(cacheFile, "utf8"));
		} catch {
			// 缓存损坏则重新请求
		}
	}
	for (let attempt = 0; attempt <= retries; attempt += 1) {
		try {
			const res = await fetch(BASE + path, {
				headers: {
					Accept: "application/json",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121 Safari/537.36",
				},
			});
			const body = await res.json();
			if (!body?.success) throw new Error(body?.error?.code ?? `HTTP ${res.status}`);
			mkdirSync(CACHE_DIR, { recursive: true });
			writeFileSync(cacheFile, JSON.stringify(body.data));
			await sleep(1000);
			return body.data;
		} catch (error) {
			if (attempt === retries) throw new Error(`${path}: ${error.message}`);
			await sleep(3000 * (attempt + 1));
		}
	}
	return undefined;
}

/** 折叠空白；超长简介在句子边界截断 */
function condense(text, limit = 220) {
	const flat = (text ?? "").replace(/\s+/g, " ").trim();
	if (flat.length <= limit) return flat;
	const cut = flat.slice(0, limit);
	const stop = Math.max(
		cut.lastIndexOf("。"),
		cut.lastIndexOf("！"),
		cut.lastIndexOf("？"),
		cut.lastIndexOf("…"),
	);
	return `${stop > limit * 0.5 ? cut.slice(0, stop + 1) : cut}…`;
}

/** 竖版优先，其次面积最大 */
function pickCover(covers) {
	const list = (covers ?? []).map((cover) => cover.media).filter(Boolean);
	if (list.length === 0) return null;
	const area = (cover) => (cover.width ?? 0) * (cover.height ?? 0);
	const portrait = list.filter((cover) => (cover.height ?? 0) > (cover.width ?? 0));
	return (portrait.length > 0 ? portrait : list).sort((a, b) => area(b) - area(a))[0];
}

/**
 * 下载封面并转成竖版 WebP：
 * - 竖版原图直接缩放；
 * - 只有横版图时，用模糊放大的自身当底、原图居中叠上去，
 *   避免直接裁成竖版把作品 logo 和角色裁掉。
 */
function buildCover(id, cover) {
	const out = join(COVER_DIR, `${id}.webp`);
	if (!REFRESH && existsSync(out)) return false;
	mkdirSync(COVER_DIR, { recursive: true });
	mkdirSync(CACHE_DIR, { recursive: true });
	const raw = join(CACHE_DIR, `cover-${id}.src`);
	const size = `${COVER_WIDTH}x${COVER_HEIGHT}`;
	try {
		execFileSync("curl", [
			"-sS", "--fail", "--max-time", "60",
			"-A", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121 Safari/537.36",
			"-o", raw, `${IMAGE_BASE}/${cover.src}`,
		]);
		if ((cover.height ?? 0) > (cover.width ?? 0)) {
			execFileSync("convert", [raw, "-resize", `${size}>`, "-strip", "-quality", "82", out]);
		} else {
			const backdrop = join(CACHE_DIR, `cover-${id}.bg.png`);
			execFileSync("convert", [
				raw, "-resize", `${size}^`, "-gravity", "center", "-extent", size,
				"-blur", "0x26", "-modulate", "58,80", "-strip", backdrop,
			]);
			execFileSync("convert", [
				backdrop, "(", raw, "-resize", `${COVER_WIDTH}x`, ")", "-gravity", "center",
				"-composite", "-strip", "-quality", "82", out,
			]);
		}
		return true;
	} catch (error) {
		console.warn(`   ! 封面处理失败 ${id}（${cover.src}）：${error.message}`);
		return false;
	}
}

const quote = (value) => `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function render(games) {
	const head = `/**
 * 游戏展示页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/gamesConfig.ts 控制。
 *
 * ⚠️ 本文件由 scripts/sync-hikarinagi.mjs 生成，请勿手改：
 *    记录与作品信息同步自 Hikarinagi（https://www.hikarinagi.org），
 *    封面存于 public/images/games/。改动请改脚本后重跑。
 *
 * 排列顺序：在玩 → 已通关 → 搁置 → 想玩，组内按最近活动时间倒序。
 */
import type { GameItem } from "@/types/gamesConfig";

export const gamesData: GameItem[] = [
`;
	const rows = games.map((game) => {
		const lines = [
			`\t\tid: ${quote(game.id)},`,
			`\t\tname: ${quote(game.name)},`,
			`\t\tdeveloper: ${quote(game.developer)},`,
			`\t\tcategory: "galgame",`,
			`\t\tstatus: ${quote(game.status)},`,
		];
		if (game.cover) lines.push(`\t\tcover: ${quote(game.cover)},`);
		else lines.push(`\t\ticon: "material-symbols:menu-book-rounded",`);
		if (game.rating !== undefined) lines.push(`\t\trating: ${game.rating},`);
		if (game.hours !== undefined) lines.push(`\t\thours: ${game.hours},`);
		if (game.platform) lines.push(`\t\tplatform: ${quote(game.platform)},`);
		if (game.year) lines.push(`\t\tyear: ${quote(game.year)},`);
		lines.push("\t\tdescription:", `\t\t\t${quote(game.description)},`);
		lines.push(`\t\tlink: ${quote(game.link)},`);
		return `\t{\n${lines.join("\n")}\n\t},`;
	});
	return `${head}${rows.join("\n")}\n];\n`;
}

async function main() {
	console.log(`同步 Hikarinagi 用户 ${USER_ID} 的 Galgame 记录…`);
	const rates = [];
	for (let page = 1; ; page += 1) {
		const data = await api(
			`/api/v3/user/${USER_ID}/rates?work_type=GALGAME&page=${page}&page_size=100`,
		);
		rates.push(...data.items);
		if (page >= data.meta.total_pages) break;
	}
	const stats = await api(`/api/v3/user/${USER_ID}/statistics`);
	const expected = stats?.rate_status_counts?.by_work_type?.galgame?.all;
	console.log(
		`  记录 ${rates.length} 条${expected === undefined ? "" : `（站点统计 ${expected} 条）`}`,
	);

	const games = [];
	for (const [index, rate] of rates.entries()) {
		const id = rate.id;
		const [work, producers, own] = await Promise.all([
			api(`/api/v3/galgames/${id}`),
			api(`/api/v3/galgames/${id}/producers`),
			api(`/api/v3/galgames/${id}/rates/${rate.rate_id}`),
		]);

		const cover =
			pickCover(work?.covers) ??
			(rate.cover
				? { src: rate.cover.src, width: rate.cover.width, height: rate.cover.height }
				: null);
		if (cover?.src && buildCover(id, cover)) console.log(`   ↓ 封面 ${id}`);
		const coverPath = existsSync(join(COVER_DIR, `${id}.webp`))
			? `/images/games/${id}.webp`
			: undefined;

		const byRole = (role) =>
			(producers ?? [])
				.filter((item) => item.role === role)
				.map((item) => item.producer?.name)
				.filter(Boolean);
		const developers = byRole("DEVELOPER");
		const publishers = byRole("PUBLISHER");
		const platforms = (work?.platforms ?? []).map((code) => PLATFORM_MAP[code]).filter(Boolean);
		const year = work?.release_date
			? work.release_date.slice(0, 4)
			: work?.release_date_tbd
				? "TBA"
				: "";
		const minutes = own?.time_to_finish_minutes ?? 0;
		const intro = condense(work?.trans_intro || work?.origin_intro || work?.en_intro);
		const status = STATUS_MAP[rate.status] ?? "backlog";
		const name = (work?.trans_title || work?.origin_title || rate.title || "").trim();

		games.push({
			id: String(id),
			name,
			developer:
				(developers.length > 0 ? developers : publishers).slice(0, 2).join(" / ") || "未知",
			status,
			rating: rate.rate ? rate.rate / 2 : undefined,
			hours: minutes >= 30 ? Math.round((minutes / 60) * 10) / 10 : undefined,
			platform: platforms.includes("PC") ? "PC" : platforms[0],
			year,
			cover: coverPath,
			description: intro || `Hikarinagi 记录：${STATUS_LABEL[rate.status] ?? rate.status}。`,
			link: `https://www.hikarinagi.org/galgames/${id}`,
			activity: rate.last_activity_at ?? "",
		});
		console.log(`   [${index + 1}/${rates.length}] ${name.slice(0, 28)} · ${status} · ${year}`);
	}

	games.sort((a, b) => {
		const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
		return byStatus !== 0 ? byStatus : b.activity.localeCompare(a.activity);
	});

	writeFileSync(OUT_FILE, render(games));
	console.log(`写入 ${OUT_FILE.replace(`${ROOT}/`, "")}`);
	console.log(`  条目 ${games.length} 条，带封面 ${games.filter((game) => game.cover).length} 条`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
