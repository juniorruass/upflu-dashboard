"use client";
import { useEffect, useRef } from "react";

const CONSTELLATIONS = [
  // Orion (simplificado)
  {
    stars: [[0.12, 0.32],[0.15, 0.29],[0.18, 0.26],[0.11, 0.24],[0.20, 0.22],[0.14, 0.20],[0.17, 0.18]],
    lines: [[0,1],[1,2],[2,4],[0,3],[3,5],[5,6],[4,6]],
  },
  // Ursa Maior (Big Dipper)
  {
    stars: [[0.68,0.10],[0.72,0.08],[0.76,0.09],[0.80,0.12],[0.78,0.17],[0.74,0.18],[0.71,0.16]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
  },
  // Cruzeiro do Sul
  {
    stars: [[0.88,0.50],[0.91,0.45],[0.94,0.50],[0.91,0.55],[0.895,0.48]],
    lines: [[0,2],[1,3]],
  },
  // Triângulo de Verão
  {
    stars: [[0.44,0.07],[0.48,0.04],[0.52,0.07]],
    lines: [[0,1],[1,2],[2,0]],
  },
  // Cassiopeia (W)
  {
    stars: [[0.28,0.06],[0.31,0.09],[0.34,0.06],[0.37,0.09],[0.40,0.06]],
    lines: [[0,1],[1,2],[2,3],[3,4]],
  },
];

interface Star {
  x: number; y: number;
  size: number; opacity: number;
  layer: number; twinkleOffset: number;
}

interface Meteor {
  x: number; y: number;
  vx: number; vy: number;
  trailLen: number;
  opacity: number;
  active: boolean;
}

const LAYERS = [
  { count: 200, parallax: 6,  minS: 0.2, maxS: 0.7  },
  { count: 90,  parallax: 14, minS: 0.5, maxS: 1.1  },
  { count: 40,  parallax: 26, minS: 0.9, maxS: 2.0  },
];

export default function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse     = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let tick = 0;
    const stars: Star[] = [];
    const meteor: Meteor = { x:0, y:0, vx:0, vy:0, trailLen:0, opacity:0, active:false };

    /* ── resize ── */
    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      buildStars();
    }

    /* ── stars ── */
    function buildStars() {
      stars.length = 0;
      LAYERS.forEach((l, li) => {
        for (let i = 0; i < l.count; i++) {
          stars.push({
            x: Math.random(), y: Math.random(),
            size: Math.random() * (l.maxS - l.minS) + l.minS,
            opacity: Math.random() * 0.55 + 0.25,
            layer: li,
            twinkleOffset: Math.random() * Math.PI * 2,
          });
        }
      });
    }

    /* ── meteor ── */
    function launchMeteor() {
      if (!canvas) return;
      meteor.x       = (0.35 + Math.random() * 0.55) * canvas.width;
      meteor.y       = Math.random() * 0.25 * canvas.height;
      const angle    = 0.7 + (Math.random() - 0.5) * 0.35;
      const speed    = 9 + Math.random() * 7;
      meteor.vx      = -Math.cos(angle) * speed;
      meteor.vy      =  Math.sin(angle) * speed;
      meteor.trailLen = 90 + Math.random() * 70;
      meteor.opacity = 1;
      meteor.active  = true;
    }

    function scheduleMeteor() {
      const ms = 4000 + Math.random() * 7000;
      setTimeout(() => { launchMeteor(); scheduleMeteor(); }, ms);
    }

    /* ── mouse ── */
    const onMouse = (e: MouseEvent) => {
      mouse.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };

    /* ── draw ── */
    function draw() {
      if (!canvas || !ctx) return;
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ox = (mouse.current.x - 0.5);
      const oy = (mouse.current.y - 0.5);

      /* stars */
      for (const s of stars) {
        const p = LAYERS[s.layer].parallax;
        const px = (s.x + ox * p / canvas.width  * 0.9) * canvas.width;
        const py = (s.y + oy * p / canvas.height * 0.9) * canvas.height;
        const tw = 0.65 + 0.35 * Math.sin(tick * 0.018 + s.twinkleOffset);
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * tw})`;
        ctx.fill();
      }

      /* constellations */
      const cp = LAYERS[0].parallax;
      for (const c of CONSTELLATIONS) {
        const pts = c.stars.map(([sx, sy]) => ({
          px: (sx + ox * cp / canvas.width  * 0.9) * canvas.width,
          py: (sy + oy * cp / canvas.height * 0.9) * canvas.height,
        }));

        /* lines */
        ctx.lineWidth = 0.5;
        for (const [a, b] of c.lines) {
          ctx.strokeStyle = "rgba(140,190,255,0.13)";
          ctx.beginPath();
          ctx.moveTo(pts[a].px, pts[a].py);
          ctx.lineTo(pts[b].px, pts[b].py);
          ctx.stroke();
        }

        /* stars */
        for (const pt of pts) {
          const tw = 0.75 + 0.25 * Math.sin(tick * 0.012 + pt.px);
          /* glow */
          const g = ctx.createRadialGradient(pt.px, pt.py, 0, pt.px, pt.py, 5);
          g.addColorStop(0, `rgba(120,180,255,${0.18 * tw})`);
          g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(pt.px, pt.py, 5, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
          /* dot */
          ctx.beginPath(); ctx.arc(pt.px, pt.py, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,225,255,${0.7 * tw})`; ctx.fill();
        }
      }

      /* meteor */
      if (meteor.active) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.opacity -= 0.014;
        if (meteor.opacity <= 0 || meteor.x < -200 || meteor.y > canvas.height + 100) {
          meteor.active = false;
        } else {
          const tx = meteor.x - meteor.vx * (meteor.trailLen / 8);
          const ty = meteor.y - meteor.vy * (meteor.trailLen / 8);
          const grad = ctx.createLinearGradient(meteor.x, meteor.y, tx, ty);
          grad.addColorStop(0,   `rgba(255,255,255,${meteor.opacity})`);
          grad.addColorStop(0.25,`rgba(180,220,255,${meteor.opacity * 0.55})`);
          grad.addColorStop(1,   "transparent");
          ctx.strokeStyle = grad;
          ctx.lineWidth   = 1.8;
          ctx.beginPath(); ctx.moveTo(meteor.x, meteor.y); ctx.lineTo(tx, ty); ctx.stroke();

          const hg = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 4);
          hg.addColorStop(0, `rgba(255,255,255,${meteor.opacity})`);
          hg.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(meteor.x, meteor.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = hg; ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("mousemove", onMouse);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    setTimeout(launchMeteor, 1800);
    scheduleMeteor();
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
