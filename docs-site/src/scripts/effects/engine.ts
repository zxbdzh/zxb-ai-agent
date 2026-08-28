/**
 * 章节首页 Canvas 效果引擎。
 *
 * 性能护栏（对齐 docs/design/chapter-theming/degradation.md 的预算）：
 * - DPR 上限 2，帧率上限 30fps
 * - 离开视口 / 标签页隐藏即停止绘制（rAF 仍挂起但不做任何计算）
 * - 粒子数量由各效果按画布面积自适应
 * - 仅使用 clearRect + 简单图形，无 shadowBlur/filter 等昂贵操作
 */

export interface Scene {
	/** 画布尺寸变化时返回合适的粒子/元素数量 */
	particleCount?(width: number, height: number): number;
	/** 画布尺寸变化时重置场景状态 */
	init?(width: number, height: number, count: number): void;
	/** 推进一帧（dt 单位为秒），在传入的 ctx 上绘制 */
	step(ctx: CanvasRenderingContext2D, width: number, height: number, dt: number): void;
}

const MAX_DPR = 2;
const TARGET_FPS = 30;

export function mountScene(scene: Scene): () => void {
	const root = document.documentElement;
	if (Number(root.dataset.motion ?? '1') < 3) return () => {};
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	const main = document.querySelector('main');
	if (!main) return () => {};

	const canvas = document.createElement('canvas');
	canvas.id = 'chapter-canvas';
	canvas.setAttribute('aria-hidden', 'true');
	main.prepend(canvas);
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		canvas.remove();
		return () => {};
	}

	const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
	let width = 0;
	let height = 0;
	let raf = 0;
	let running = false;
	let inViewport = true;
	let last = 0;

	const resize = (): void => {
		width = main.clientWidth;
		height = canvas.clientHeight;
		if (width === 0 || height === 0) return;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const count = scene.particleCount?.(width, height) ?? 0;
		scene.init?.(width, height, count);
	};

	const ro = new ResizeObserver(resize);
	ro.observe(main);

	const io = new IntersectionObserver((entries) => {
		inViewport = entries[0]?.isIntersecting ?? true;
	});
	io.observe(canvas);

	const frame = (t: number): void => {
		if (!running) return;
		raf = requestAnimationFrame(frame);
		if (!inViewport || document.hidden) {
			last = t;
			return;
		}
		const elapsed = t - last;
		if (elapsed < 1000 / TARGET_FPS - 1) return;
		last = t;
		ctx.clearRect(0, 0, width, height);
		scene.step(ctx, width, height, Math.min(elapsed, 200) / 1000);
	};

	resize();
	running = true;
	raf = requestAnimationFrame(frame);

	return () => {
		running = false;
		cancelAnimationFrame(raf);
		ro.disconnect();
		io.disconnect();
		canvas.remove();
	};
}
