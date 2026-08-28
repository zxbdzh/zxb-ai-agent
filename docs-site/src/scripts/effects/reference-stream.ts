/**
 * 参考资料章节签名动效：数据流。
 * 冷靛色的短划沿纵向匀速下落、带渐隐尾迹，背景衬以极淡的横向网格线——
 * 精确、克制的机械感。任何异常静默退出，保证文档可读性优先。
 */

import { mountScene, type Scene } from './engine';

const HUE = 215;
const SAT = 64;
const COLUMN_GAP = 42;
const DASH_GAP = 9;

interface Column {
	x: number;
	y: number;
	speed: number;
	trail: number;
}

let columns: Column[] = [];

function spawnColumn(w: number): Column {
	return {
		x: Math.random() * w,
		y: -Math.random() * 160 - 20,
		speed: 40 + Math.random() * 70,
		trail: 6 + Math.floor(Math.random() * 8),
	};
}

const scene: Scene = {
	init(w, _h, _count) {
		const count = Math.max(6, Math.floor(w / COLUMN_GAP));
		columns = Array.from({ length: count }, () => spawnColumn(w));
	},
	step(ctx: CanvasRenderingContext2D, w, h, dt) {
		// 极淡网格线：分隔“数据轨道”
		ctx.strokeStyle = `hsla(${HUE}, ${SAT}%, 60%, 0.07)`;
		ctx.lineWidth = 1;
		for (const fy of [0.28, 0.55, 0.82]) {
			ctx.beginPath();
			ctx.moveTo(0, h * fy);
			ctx.lineTo(w, h * fy);
			ctx.stroke();
		}

		for (const col of columns) {
			col.y += col.speed * dt;
			if (col.y - col.trail * DASH_GAP > h) {
				Object.assign(col, spawnColumn(w));
				continue;
			}
			for (let i = 0; i < col.trail; i++) {
				const y = col.y - i * DASH_GAP;
				if (y < -DASH_GAP) continue;
				const alpha = (1 - i / col.trail) * 0.5;
				ctx.fillStyle = `hsla(${HUE}, ${SAT}%, ${i === 0 ? 78 : 64}%, ${alpha})`;
				ctx.fillRect(col.x, y, 2, i === 0 ? 6 : 4);
			}
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
