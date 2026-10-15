#!/usr/bin/env node
/**
 * 取数辅助程序（重武器）：用 Playwright 开一个真浏览器，让 Cloudflare 的 JS 挑战自己跑完，
 * 再把页面里的 JSON 打到 stdout。
 *
 * 用途：curl_cffi 那档（scripts/fetch-impersonate.py）万一因为指纹策略变化失效时，
 * 这一档靠「真的执行挑战」兜底；由 workflow 在第一次同步失败后临时安装 Playwright 调用，
 * 日常不装、不跑。
 *
 * 调用：node scripts/fetch-via-browser.mjs <url> [url...]
 * 输出：每个 URL 一行 JSON（含 url/channel/body 或 error），stdout 只放结果。
 */
import { chromium } from "playwright";

const urls = process.argv.slice(2);
if (urls.length === 0) {
	console.error("usage: fetch-via-browser.mjs <url> [url...]");
	process.exit(2);
}

const browser = await chromium.launch({
	headless: true,
	args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
	userAgent:
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	locale: "zh-CN",
	timezoneId: "Asia/Shanghai",
	viewport: { width: 1280, height: 900 },
	extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8" },
});
const page = await context.newPage();

/** 打开 URL 并等页面里出现 JSON（挑战通过后浏览器会自己刷新） */
async function grab(url) {
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
	for (let i = 0; i < 20; i += 1) {
		const text = await page.evaluate(() => document.body?.innerText ?? "");
		if (text.trim().startsWith("{")) return text;
		await page.waitForTimeout(1500);
		if (i % 3 === 2) await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
	}
	const tail = await page.evaluate(() => (document.body?.innerText ?? "").slice(0, 120));
	throw new Error(`挑战未通过：${JSON.stringify(tail)}`);
}

for (const url of urls) {
	try {
		process.stdout.write(JSON.stringify({ url, body: await grab(url) }));
	} catch (error) {
		process.stdout.write(JSON.stringify({ url, error: String(error.message ?? error) }));
	}
	process.stdout.write("\n");
}

await browser.close();
