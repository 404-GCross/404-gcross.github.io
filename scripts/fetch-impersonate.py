#!/usr/bin/env python3
"""
取数辅助程序：用 curl_cffi 以「真实浏览器 TLS/HTTP2 指纹」请求一个 URL，把正文打到 stdout。

用途：GitHub runner 这类数据中心 IP 会被 Hikarinagi 的 Cloudflare 挑战拦住，普通请求
（包括 Node 的 fetch、裸 curl）都拿不到 JSON；带 Chrome/Safari 指纹的客户端能直接过。

调用：python3 scripts/fetch-impersonate.py <url>
依赖：pip install curl_cffi（CI 里由 workflow 安装）
实测（2026-10）：impersonate="chrome" 与 "safari184" 通过，固定的旧版本如
"chrome131"、"chrome124" 会被挑战——所以这里用会跟随最新版的别名，并在失败时换一个。
"""
import sys

from curl_cffi import requests

# 依次尝试；别名（chrome / safari）会跟随 curl_cffi 内置的最新版本
PROFILES = ("chrome", "safari184", "safari")


def main() -> int:
	if len(sys.argv) < 2:
		print("usage: fetch-impersonate.py <url>", file=sys.stderr)
		return 2

	url = sys.argv[1]
	last = None
	for profile in PROFILES:
		try:
			response = requests.get(url, impersonate=profile, timeout=60)
		except Exception as error:  # noqa: BLE001 —— 任何失败都换下一个指纹
			last = f"{profile}: {type(error).__name__}: {error}"
			continue
		if response.status_code == 200 and response.text.lstrip().startswith("{"):
			sys.stdout.write(response.text)
			return 0
		last = f"{profile}: HTTP {response.status_code}"

	print(f"fetch-impersonate 全部指纹失败（{last}）", file=sys.stderr)
	return 1


if __name__ == "__main__":
	raise SystemExit(main())
