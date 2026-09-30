/**
 * astro-icon 的 `./components` 子路径导出只写了一条字符串（components/index.ts），
 * 没有 `types` 条件；pnpm 又把它放在 .pnpm 里而不是本项目根 node_modules，
 * 于是 astro check 解析不到这个模块。
 *
 * 覆盖版 src/components/organisms/Profile.astro 用了 `astro-icon/components`
 * （静态 SSR 图标必须走它，@iconify/svelte 在无 hydration 时会渲染空白），
 * 这里补一份最小声明让 astro check 通过；构建本身一直正常。
 */
declare module "astro-icon/components" {
	// biome-ignore lint/suspicious/noExplicitAny: 只为让 tsc 认识这个组件，类型由 astro-icon 自己保证
	const Icon: any;
	export { Icon };
}
