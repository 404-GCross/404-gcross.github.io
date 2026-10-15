/**
 * 临时探测路由（用完即删）：验证 Cloudflare Pages Functions 的出口能否访问
 * Hikarinagi——runner 与代理出口都会被 Cloudflare 挑战拦住，若 Functions 能过，
 * 每日同步就让 workflow 通过本站的函数取数据。
 *
 * 只看结果，不缓存：GET /api/hikari-probe
 */
export async function onRequestGet() {
	const url = "https://www.hikarinagi.org/api/v3/user/45540/statistics";
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121 Safari/537.36",
			},
		});
		const body = await res.text();
		return Response.json({
			upstream_status: res.status,
			content_type: res.headers.get("content-type"),
			cf_ray: res.headers.get("cf-ray"),
			body_head: body.slice(0, 300),
		});
	} catch (error) {
		return Response.json(
			{ error: String(error) },
			{ status: 502 },
		);
	}
}
