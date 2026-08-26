import { useEffect, useRef, type ReactNode } from "react";
import type { OrgWorldTreeNode } from "./orgWorldTree";

type TerrainAnchor = {
  current: boolean;
  id: string;
  x: number;
  y: number;
};

const maxTerrainSources = 72;

/**
 * A bounded, deterministic terrain projection: it reflects the whole indexed
 * corpus without turning a large library into thousands of animated elements.
 */
export const orgWorldTerrainAnchors = (
  nodes: readonly OrgWorldTreeNode[],
  activeSourceFile: string | null,
): readonly TerrainAnchor[] =>
  nodes
    .filter((node) => node.kind === "source")
    .slice(0, maxTerrainSources)
    .map((node, index, sources) => {
      const seed = hash(node.id);
      const angle = ((seed % 360) * Math.PI) / 180;
      const ring = 0.22 + ((seed >>> 9) % 53) / 100;
      const sourceCount = Math.max(sources.length, 1);
      const distribution = (index / sourceCount) * Math.PI * 2;
      const current = node.sourceFile === activeSourceFile;
      return {
        id: node.id,
        current,
        x: 0.5 + Math.cos(angle + distribution * 0.28) * ring,
        y: 0.5 + Math.sin(angle + distribution * 0.28) * ring * 0.72,
      };
    });

export function OrgWorldTerrain({
  activeSourceFile,
  nodes,
}: {
  activeSourceFile: string | null;
  nodes: readonly OrgWorldTreeNode[];
}): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const anchors = orgWorldTerrainAnchors(nodes, activeSourceFile);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const resize = (): void => {
      const bounds = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };
    const colors = (): { normal: string; salient: string; surface: string } => {
      const styles = window.getComputedStyle(canvas);
      return {
        normal: styles.getPropertyValue("--face-normal").trim() || "#596579",
        salient: styles.getPropertyValue("--face-salient").trim() || "#4e7bc7",
        surface: styles.getPropertyValue("--surface-canvas").trim() || "#ffffff",
      };
    };
    const draw = (time: number): void => {
      const { normal, salient, surface } = colors();
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = "source-over";

      const scaled = anchors.map((anchor) => ({
        ...anchor,
        x: anchor.x * width,
        y: anchor.y * height,
      }));
      const current = scaled.find((anchor) => anchor.current) ?? scaled[0];
      if (current) {
        for (const anchor of scaled) {
          if (anchor.id === current.id) continue;
          context.beginPath();
          context.moveTo(current.x, current.y);
          context.lineTo(anchor.x, anchor.y);
          context.strokeStyle = normal;
          context.globalAlpha = 0.1;
          context.lineWidth = 1;
          context.stroke();

          if (!motion.matches) {
            const progress = (((time / 6200 + (hash(anchor.id) % 100) / 100) % 1) + 1) % 1;
            const x = current.x + (anchor.x - current.x) * progress;
            const y = current.y + (anchor.y - current.y) * progress;
            context.beginPath();
            context.arc(x, y, 1.75, 0, Math.PI * 2);
            context.fillStyle = salient;
            context.globalAlpha = 0.56;
            context.fill();
          }
        }
      }

      for (const anchor of scaled) {
        const pulse = motion.matches ? 0 : Math.sin(time / 900 + hash(anchor.id) / 83) * 1.5;
        const seed = hash(anchor.id);
        for (const contour of [24, 42, 66]) {
          context.beginPath();
          for (let vertex = 0; vertex <= 8; vertex += 1) {
            const angle = (vertex / 8) * Math.PI * 2;
            const variance = ((seed >>> (vertex % 16)) & 7) - 3;
            const radius = contour + variance + (anchor.current ? 8 : 0);
            const x = anchor.x + Math.cos(angle) * radius;
            const y = anchor.y + Math.sin(angle) * radius * 0.62;
            if (vertex === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = anchor.current ? salient : normal;
          context.globalAlpha = anchor.current ? 0.14 : 0.055;
          context.lineWidth = 1;
          context.stroke();
        }
        context.beginPath();
        context.arc(anchor.x, anchor.y, (anchor.current ? 11 : 6) + pulse, 0, Math.PI * 2);
        context.strokeStyle = anchor.current ? salient : normal;
        context.globalAlpha = anchor.current ? 0.48 : 0.22;
        context.lineWidth = anchor.current ? 1.4 : 1;
        context.stroke();

        context.beginPath();
        context.arc(anchor.x, anchor.y, anchor.current ? 3.5 : 2, 0, Math.PI * 2);
        context.fillStyle = anchor.current ? salient : surface;
        context.globalAlpha = anchor.current ? 0.95 : 0.74;
        context.fill();
      }
      context.restore();
      if (!motion.matches) frame = window.requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    draw(0);
    const redraw = (): void => {
      window.cancelAnimationFrame(frame);
      draw(0);
    };
    motion.addEventListener("change", redraw);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", redraw);
      window.cancelAnimationFrame(frame);
    };
  }, [activeSourceFile, nodes]);

  return <canvas ref={canvasRef} className="org-world-tree-terrain" aria-hidden="true" />;
}

const hash = (value: string): number => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};
