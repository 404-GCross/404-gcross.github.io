#!/usr/bin/env node
/**
 * 从 Hikarinagi 同步「状态与评分记录」到游戏页数据。
 *
 * 用法：
 *   node scripts/sync-hikarinagi.mjs            # 同步（有缓存就不重复取详情）
 *   node scripts/sync-hikarinagi.mjs --refresh  # 忽略缓存与已有封面，全部重取
 *   node scripts/sync-hikarinagi.mjs --user 45540
 *
 * 输出：
 *   shirones/config/data/games.ts         生成的数据文件（勿手改，改脚本再跑）
 *   public/images/games/<作品ID>.webp     竖版封面
 *   scripts/cache/hikarinagi.json         作品事实缓存（随仓库提交，见下）
 *
 * 数据来源与取数通道：
 * - 走 Hikarinagi 网站自身的接口（www.hikarinagi.org/api/v3/…），不需要令牌；
 *   官方另有开发者开放 API（api.hikarinagi.org/v3/…，OIDC 发令牌，见
 *   https://www.hikarinagi.org/developers/guide），但那个域名同样在 Cloudflare
 *   挑战后面，换过去也解决不了 CI 取数问题。
 * - **Hikarinagi 对数据中心 IP 一律发 Cloudflare 挑战**：GitHub runner、代理出口、
 *   连 Cloudflare Pages Functions 自己的出口都被挡（实测 403 Just a moment），
 *   住宅网络直连才通。取数因此分三档：直连 → 外部辅助程序
 *   （HIKARINAGI_FETCH_CMD，CI 里给的是 scripts/fetch-impersonate.py 这种带浏览器
 *   指纹的客户端）→ r.jina.ai 读正文（截首尾大括号还原 JSON）。
 * - 详情按作品缓存在 scripts/cache/hikarinagi.json：只有新条目或换过 rate_id 的
 *   条目才会再取详情。这样每日自动同步的正常开销只有 1 个「记录列表」请求
 *   （外加新增作品的少量请求），既快又不至于把公共 reader 当自家接口刷。
 * - 封面走 imagesp.yurari.moe（不在挑战后面，CI 可直连）。
 *
 * 署名：按 Hikarinagi 的品牌与署名要求，卡片外链指向作品在 Hikarinagi 的页面，
 * 页面另有一行「数据来自 Hikarinagi」署名（见 src/pages/games.astro）。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.hikarinagi.org";
const IMAGE_BASE = "https://imagesp.yurari.moe";
const JINA_PREFIX = "https://r.jina.ai/";
const CACHE_FILE = join(ROOT, "scripts/cache/hikarinagi.json");
const SCRATCH_DIR = join(ROOT, "node_modules/.cache/hikarinagi");
const COVER_DIR = join(ROOT, "public/images/games");
const OUT_FILE = join(ROOT, "shirones/config/data/games.ts");
const COVER_WIDTH = 600; // 卡片实际显示约 170–240px，600 宽够 2x
const COVER_HEIGHT = 900;
const UA =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121 Safari/537.36";

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

/** Cloudflare 挑战页的特征（JSON 接口不可能长这样） */
function isChallenge(status, text) {
	return status === 403 && /Just a moment|cf-challenge|challenge-platform/i.test(text);
}

/**
 * 取数通道（按顺序尝试，逐级变重）：
 *   1. 直连            —— 住宅网络可用，零依赖
 *   2. 外部辅助程序     —— HIKARINAGI_FETCH_CMD 指定，CI 里是带浏览器指纹的 curl_cffi，
 *                        失败后 workflow 会换成 Playwright 真浏览器再来一次
 *   3. r.jina.ai       —— 第三方 reader，最后的兜底
 * 注意 Hikarinagi 对数据中心 IP 一律发 Cloudflare 挑战：runner、代理出口、连
 * Cloudflare Pages Functions 自己的出口都过不去，所以 CI 必须靠 2 或 3。
 */
const HELPER_CMD = (process.env.HIKARINAGI_FETCH_CMD ?? "").trim();
let usedChannel = "";

/** 1. 直连 */
async function fetchDirect(url) {
	const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
	const body = await res.text();
	if (isChallenge(res.status, body)) throw new Error("被 Cloudflare 挑战");
	return body;
}

/** 2. 外部辅助程序：把 URL 交给它，stdout 即正文 */
async function fetchViaHelper(url) {
	if (!HELPER_CMD) throw new Error("未配置 HIKARINAGI_FETCH_CMD");
	return execFileSync("bash", ["-c", `${HELPER_CMD} "$1"`, "_", url], {
		encoding: "utf8",
		maxBuffer: 32 * 1024 * 1024,
		timeout: 240000,
	});
}

/** 3. r.jina.ai：返回的是把 JSON 包在正文里的文本，截首尾大括号还原 */
async function fetchViaReader(url) {
	const res = await fetch(JINA_PREFIX + url, { headers: { Accept: "text/plain" } });
	const wrapped = await res.text();
	const start = wrapped.indexOf("{");
	const end = wrapped.lastIndexOf("}");
	if (!res.ok || start < 0 || end <= start) {
		throw new Error(`HTTP ${res.status}`);
	}
	return wrapped.slice(start, end + 1);
}

const TIERS = [
	["直连", fetchDirect],
	["辅助程序", fetchViaHelper],
	["r.jina.ai", fetchViaReader],
];

/** 按通道顺序取一段 JSON，返回解析后的 data */
async function getJson(path) {
	const url = BASE + path;
	const failures = [];
	for (const [name, tier] of TIERS) {
		try {
			const body = JSON.parse(await tier(url));
			if (!body?.success) throw new Error(body?.error?.code ?? "接口返回失败");
			if (usedChannel !== name) {
				usedChannel = name;
				console.log(`   · 取数通道：${name}`);
			}
			return body.data;
		} catch (error) {
			failures.push(`${name}(${error.message})`);
		}
	}
	throw new Error(`${path}：所有通道都失败 —— ${failures.join(" / ")}`);
}

/** 带退避重试的取数 */
async function api(path, { retries = 2 } = {}) {
	for (let attempt = 0; ; attempt += 1) {
		try {
			const data = await getJson(path);
			await sleep(1000); // 对公共 reader 保持克制
			return data;
		} catch (error) {
			if (attempt >= retries) throw error;
			await sleep(3000 * (attempt + 1));
		}
	}
}

function readCache() {
	try {
		const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
		if (parsed && typeof parsed.works === "object") return parsed;
	} catch {
		// 没缓存或缓存损坏：当作空缓存，下面会重新取
	}
	return { works: {} };
}

function writeCache(cache) {
	mkdirSync(dirname(CACHE_FILE), { recursive: true });
	const sorted = {};
	for (const id of Object.keys(cache.works).sort((a, b) => Number(a) - Number(b))) {
		sorted[id] = cache.works[id];
	}
	writeFileSync(
		CACHE_FILE,
		`${JSON.stringify({ note: "由 scripts/sync-hikarinagi.mjs 维护的作品事实缓存，随仓库提交以便每日同步只取变化的部分。", works: sorted }, null, "\t")}\n`,
	);
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
	mkdirSync(SCRATCH_DIR, { recursive: true });
	const raw = join(SCRATCH_DIR, `cover-${id}.src`);
	const size = `${COVER_WIDTH}x${COVER_HEIGHT}`;
	try {
		execFileSync("curl", ["-sS", "--fail", "--max-time", "60", "-A", UA, "-o", raw, `${IMAGE_BASE}/${cover.src}`]);
		if ((cover.height ?? 0) > (cover.width ?? 0)) {
			execFileSync("convert", [raw, "-resize", `${size}>`, "-strip", "-quality", "82", out]);
		} else {
			const backdrop = join(SCRATCH_DIR, `cover-${id}.bg.png`);
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

/** 取一部作品的事实（详情 + 厂商），带缓存 */
async function fetchFacts(id, cache) {
	const cached = cache.works[id];
	if (!REFRESH && cached) return cached;

	const [work, producers] = await Promise.all([
		api(`/api/v3/galgames/${id}`),
		api(`/api/v3/galgames/${id}/producers`),
	]);
	const byRole = (role) =>
		(producers ?? [])
			.filter((item) => item.role === role)
			.map((item) => item.producer?.name)
			.filter(Boolean);
	const cover = pickCover(work?.covers);
	const facts = {
		title: (work?.trans_title || work?.origin_title || "").trim(),
		year: work?.release_date
			? work.release_date.slice(0, 4)
			: work?.release_date_tbd
				? "TBA"
				: "",
		platforms: (work?.platforms ?? []).map((code) => PLATFORM_MAP[code]).filter(Boolean),
		intro: condense(work?.trans_intro || work?.origin_intro || work?.en_intro),
		nsfw: Boolean(work?.nsfw) || Boolean(cover?.nsfw) || (cover?.sexual ?? 0) > 0,
		developers: byRole("DEVELOPER"),
		publishers: byRole("PUBLISHER"),
		cover: cover ? { src: cover.src, width: cover.width ?? 0, height: cover.height ?? 0 } : null,
	};
	cache.works[id] = facts;
	console.log(`   · 取详情 ${id}`);
	return facts;
}

/** 取某条记录自己的游玩时长（按 rate_id 缓存，重新评分会自动失效） */
async function fetchMinutes(id, rateId, cache) {
	const facts = cache.works[id];
	if (!REFRESH && facts?.rate_id === rateId && facts.minutes !== undefined) {
		return facts.minutes;
	}
	const own = await api(`/api/v3/galgames/${id}/rates/${rateId}`);
	const minutes = own?.time_to_finish_minutes ?? 0;
	if (facts) {
		facts.rate_id = rateId;
		facts.minutes = minutes;
	}
	console.log(`   · 取时长 ${id}`);
	return minutes;
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

	const cache = readCache();
	const games = [];
	for (const [index, rate] of rates.entries()) {
		const id = String(rate.id);
		const facts = await fetchFacts(id, cache);
		const minutes = await fetchMinutes(id, rate.rate_id, cache);
		if (facts.cover && buildCover(id, facts.cover)) console.log(`   ↓ 封面 ${id}`);
		const coverPath = existsSync(join(COVER_DIR, `${id}.webp`))
			? `/images/games/${id}.webp`
			: undefined;

		const status = STATUS_MAP[rate.status] ?? "backlog";
		const name = (facts.title || rate.title || "").trim();
		const developers = facts.developers.length > 0 ? facts.developers : facts.publishers;

		games.push({
			id,
			name,
			developer: developers.slice(0, 2).join(" / ") || "未知",
			status,
			rating: rate.rate ? rate.rate / 2 : undefined,
			hours: minutes >= 30 ? Math.round((minutes / 60) * 10) / 10 : undefined,
			platform: facts.platforms.includes("PC") ? "PC" : facts.platforms[0],
			year: facts.year,
			cover: coverPath,
			description: facts.intro || `Hikarinagi 记录：${STATUS_LABEL[rate.status] ?? rate.status}。`,
			link: `https://www.hikarinagi.org/galgames/${id}`,
			activity: rate.last_activity_at ?? "",
		});
		console.log(`   [${index + 1}/${rates.length}] ${name.slice(0, 28)} · ${status}`);
	}

	// 缓存只保留仍在列表里的作品，避免删条目后缓存无限增长
	for (const id of Object.keys(cache.works)) {
		if (!rates.some((rate) => String(rate.id) === id)) delete cache.works[id];
	}
	writeCache(cache);

	games.sort((a, b) => {
		const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
		return byStatus !== 0 ? byStatus : b.activity.localeCompare(a.activity);
	});

	writeFileSync(OUT_FILE, render(games));
	console.log(`写入 ${OUT_FILE.replace(`${ROOT}/`, "")}`);
	console.log(`  条目 ${games.length} 条，带封面 ${games.filter((game) => game.cover).length} 条`);
	console.log(`  取数通道：${usedChannel || "直连"}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
