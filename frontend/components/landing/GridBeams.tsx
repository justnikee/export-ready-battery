"use client";

import { useEffect, useRef } from "react";

const GRID = 96;

interface Beam {
    axis: "h" | "v";
    gridIndex: number;
    pos: number;
    speed: number;
    dir: 1 | -1;
    tailFraction: number;
    opacity: number;
    delay: number;
}

function makeBeams(w: number, h: number): Beam[] {
    const hLines = Math.floor(h / GRID);
    const vLines = Math.floor(w / GRID);
    const beams: Beam[] = [];

    // Fewer beams, prefer edges and avoid clustering in the middle
    const count = 8;
    for (let i = 0; i < count; i++) {
        const axis = Math.random() > 0.5 ? "h" : "v";
        const maxIdx = axis === "h" ? hLines : vLines;
        // Bias toward outer grid lines (avoid dense center)
        const useEdge = Math.random() > 0.4;
        const gridIndex = useEdge
            ? (Math.random() > 0.5 ? maxIdx - 1 : 1)
            : 1 + Math.floor(Math.random() * Math.max(1, maxIdx - 1));

        beams.push({
            axis,
            gridIndex: Math.max(1, Math.min(gridIndex, maxIdx)),
            pos: Math.random(),
            speed: 0.00004 + Math.random() * 0.00008, // slower = more elegant
            dir: Math.random() > 0.5 ? 1 : -1,
            tailFraction: 0.08 + Math.random() * 0.10, // longer tails = smoother
            opacity: 0.45 + Math.random() * 0.35,      // softer max opacity
            delay: Math.random() * 5000,
        });
    }
    return beams;
}

export function GridBeams() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf: number;
        let w = 0, h = 0;
        let beams: Beam[] = [];
        let startTime = 0;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            w = canvas.width = parent.offsetWidth;
            h = canvas.height = parent.offsetHeight;
            beams = makeBeams(w, h);
        };

        const draw = (ts: number) => {
            if (!startTime) startTime = ts;
            const elapsed = ts - startTime;

            ctx.clearRect(0, 0, w, h);

            for (const b of beams) {
                if (elapsed < b.delay) continue;

                b.pos += b.speed * b.dir;
                if (b.pos > 1 + b.tailFraction) b.pos = -b.tailFraction;
                if (b.pos < -b.tailFraction) b.pos = 1 + b.tailFraction;

                const alpha = b.opacity;

                if (b.axis === "h") {
                    const lineY = b.gridIndex * GRID;
                    if (lineY > h) continue;

                    const headX = b.pos * w;
                    const tailX = (b.pos - b.tailFraction * b.dir) * w;

                    const grad = ctx.createLinearGradient(tailX, lineY, headX, lineY);
                    grad.addColorStop(0, `rgba(14,163,113,0)`);
                    grad.addColorStop(0.6, `rgba(14,163,113,${alpha * 0.35})`);
                    grad.addColorStop(1, `rgba(14,163,113,${alpha})`);

                    ctx.beginPath();
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = grad;
                    ctx.moveTo(tailX, lineY);
                    ctx.lineTo(headX, lineY);
                    ctx.stroke();

                    // Tight head glow
                    const r = ctx.createRadialGradient(headX, lineY, 0, headX, lineY, 8);
                    r.addColorStop(0, `rgba(14,163,113,${alpha})`);
                    r.addColorStop(0.5, `rgba(14,163,113,${alpha * 0.25})`);
                    r.addColorStop(1, `rgba(14,163,113,0)`);
                    ctx.beginPath();
                    ctx.fillStyle = r;
                    ctx.arc(headX, lineY, 8, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    const lineX = b.gridIndex * GRID;
                    if (lineX > w) continue;

                    const headY = b.pos * h;
                    const tailY = (b.pos - b.tailFraction * b.dir) * h;

                    const grad = ctx.createLinearGradient(lineX, tailY, lineX, headY);
                    grad.addColorStop(0, `rgba(14,163,113,0)`);
                    grad.addColorStop(0.6, `rgba(14,163,113,${alpha * 0.35})`);
                    grad.addColorStop(1, `rgba(14,163,113,${alpha})`);

                    ctx.beginPath();
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = grad;
                    ctx.moveTo(lineX, tailY);
                    ctx.lineTo(lineX, headY);
                    ctx.stroke();

                    const r = ctx.createRadialGradient(lineX, headY, 0, lineX, headY, 8);
                    r.addColorStop(0, `rgba(14,163,113,${alpha})`);
                    r.addColorStop(0.5, `rgba(14,163,113,${alpha * 0.25})`);
                    r.addColorStop(1, `rgba(14,163,113,0)`);
                    ctx.beginPath();
                    ctx.fillStyle = r;
                    ctx.arc(lineX, headY, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            raf = requestAnimationFrame(draw);
        };

        resize();
        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) ro.observe(canvas.parentElement);

        raf = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 2,
            }}
        />
    );
}
