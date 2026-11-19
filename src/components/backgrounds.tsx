"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";

// ReactBits WebGL/canvas backgrounds are client-only and heavy — load lazily.
const Aurora = dynamic(() => import("@/components/reactbits/Aurora"), {
  ssr: false,
});
const Particles = dynamic(() => import("@/components/reactbits/Particles"), {
  ssr: false,
});
const DotGrid = dynamic(() => import("@/components/reactbits/DotGrid"), {
  ssr: false,
});

const BRAND_STOPS = ["#2F66E8", "#4D86F7", "#8B5CF6"];

/**
 * Detects WebGL support once on mount. Guards the WebGL-based ReactBits
 * backgrounds so they never throw on GPU-less environments (headless
 * browsers, blocked GPUs) — the CSS fallbacks carry the visuals instead.
 */
function useHasWebGL() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

/** Full-bleed aurora gradient wash — the signature hero background. */
export function AuroraBackground({
  className,
  opacity = 0.55,
}: {
  className?: string;
  opacity?: number;
}) {
  const hasWebGL = useHasWebGL();
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden mask-fade-b",
        className,
      )}
      style={{ opacity }}
    >
      {/* CSS fallback gradient — always present, hidden behind WebGL when available */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(77,134,247,0.35),transparent_70%),radial-gradient(40%_40%_at_80%_10%,rgba(139,92,246,0.25),transparent_70%)]" />
      {hasWebGL && (
        <Aurora colorStops={BRAND_STOPS} amplitude={1.1} blend={0.6} speed={0.7} />
      )}
    </div>
  );
}

/** Floating particle field. */
export function ParticleBackground({
  className,
  count = 160,
}: {
  className?: string;
  count?: number;
}) {
  const hasWebGL = useHasWebGL();
  if (!hasWebGL) return null;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
    >
      <Particles
        particleColors={["#4D86F7", "#8B5CF6", "#ffffff"]}
        particleCount={count}
        particleSpread={12}
        speed={0.08}
        particleBaseSize={70}
        moveParticlesOnHover
        alphaParticles
        disableRotation={false}
      />
    </div>
  );
}

/** Interactive dot grid that reacts to the cursor. */
export function DotGridBackground({ className }: { className?: string }) {
  const hasWebGL = useHasWebGL();
  if (!hasWebGL) return <GridGlow className={className} />;
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 -z-10", className)}
    >
      <DotGrid
        dotSize={2.5}
        gap={26}
        baseColor="#1b2740"
        activeColor="#4D86F7"
        proximity={110}
        shockRadius={220}
        shockStrength={4}
      />
    </div>
  );
}

/** Pure-CSS animated grid + radial glow. SSR-safe, near-zero cost. */
export function GridGlow({
  className,
  glow = true,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 grid-bg mask-fade-b",
        className,
      )}
    >
      {glow && (
        <>
          <div className="absolute left-1/2 top-0 size-[520px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
          <div className="absolute right-[10%] top-1/3 size-[380px] rounded-full bg-violet-500/15 blur-[120px]" />
        </>
      )}
    </div>
  );
}

/** Mouse-follow spotlight overlay — wrap any section. Lightweight, no WebGL. */
export function Spotlight({
  children,
  className,
  size = 480,
  color = "77, 134, 247",
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, active: false });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 transition-opacity duration-300"
        style={{
          opacity: pos.active ? 1 : 0,
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, rgba(${color}, 0.12), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
