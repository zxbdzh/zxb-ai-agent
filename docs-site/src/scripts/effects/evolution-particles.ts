/**
 * 演进记录章节签名动效：粒子聚合消散。
 * 粒子从画布四边向标题区聚合，抵达后发光消散、再度重生——呼应“提交汇入编年史”。
 * 任何异常静默退出，保证文档可读性优先。
 */

import { mountScene, type Scene } from './engine';

const HUE = 265;
const SAT = 82;

interface Particle {
	x: number;
	y: number;
	px: number;
	py: number;
	vx: number;
	vy: number;
	r: number;
	life: number;
	converged: boolean;
}

let particles: Particle[] = [];

function spawn(w: number, h: number): Particle {
	// 从画布四边随机入场
	const edge = Math.floor(Math.random() * 4);
	const t = Math.random();
	const x = edge === 0 ? t * w : edge === 1 ? w + 8 : edge === 2 ? t * w : -8;
	const y = edge === 0 ? -8 : edge === 1 ? t * h : edge === 2 ? h + 8 : t * h;
	return {
		x,
		y,
		px: x,
		py: y,
		vx: 0,
		vy: 0,
		r: 1 + Math.random() * 1.6,
		life: 1,
		converged: false,
	};
}

function target(w: number, h: number): { x: number; y: number } {
	return { x: w * 0.5, y: h * 0.42 };
}

const scene: Scene = {
	particleCount: (w, h) => Math.min(200, Math.max(60, Math.round((w * h) / 9000))),
	init(w, h, count) {
		particles = Array.from({ length: count }, () => spawn(w, h));
	},
	step(ctx: CanvasRenderingContext2D, w, h, dt) {
		const { x: tx, y: ty } = target(w, h);
		for (const p of particles) {
			p.px = p.x;
			p.py = p.y;
			if (!p.converged) {
				// 弹簧式聚合并叠加轻微旋绕，避免机械直线
				const ax = (tx - p.x) * 2.4 - p.vy * 0.9;
				const ay = (ty - p.y) * 2.4 + p.vx * 0.9;
				const damp = Math.max(0, 1 - 1.1 * dt);
				p.vx = (p.vx + ax * dt) * damp;
				p.vy = (p.vy + ay * dt) * damp;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				if (Math.hypot(tx - p.x, ty - p.y) < 14) {
					p.converged = true;
					p.life = 1;
				}
			} else {
				// 抵达聚合点后发光消散
				p.life -= dt * 0.9;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				if (p.life <= 0) {
					Object.assign(p, spawn(w, h));
					continue;
				}
			}
			const alpha = p.converged ? p.life * 0.65 : 0.45;
			// 拖尾线段 + 头部亮点，构成“汇入”轨迹
			ctx.strokeStyle = `hsla(${HUE}, ${SAT}%, 74%, ${alpha})`;
			ctx.lineWidth = p.r;
			ctx.beginPath();
			ctx.moveTo(p.px, p.py);
			ctx.lineTo(p.x, p.y);
			ctx.stroke();
			ctx.fillStyle = `hsla(${HUE}, ${SAT}%, 82%, ${alpha})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2);
			ctx.fill();
		}
	},
};

export function mount(): () => void {
	try {
		return mountScene(scene);
	} catch {
		return () => {};
	}
}
