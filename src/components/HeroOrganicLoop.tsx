/**
 * HeroOrganicLoop — the visual signature of the PureFind hero.
 *
 * Concept: a chaotic field of organic shapes (Amazon's noise) gradually
 * converges into a single focal cluster (the curated shortlist), then
 * scatters back. Mirrors what the product does, in motion.
 *
 * Pure CSS + SVG (no Three.js, no video file). The SVG goo filter merges
 * particles into one organic mass when they overlap. Motion-reduce safe —
 * degrades to the converged still frame so the metaphor still reads.
 */

type Particle = {
    fromX: string; fromY: string; fromScale: number; fromOp: number;
    toX: string;   toY: string;   toScale: number;   toOp: number;
    color: string;
    size: number;        // px diameter at scale=1
    duration: number;    // seconds
    delay: number;       // seconds
};

const PLUM = "rgba(91, 33, 182, 0.55)";
const ROSE = "rgba(225, 29, 72, 0.55)";
const AMBER = "rgba(217, 119, 6, 0.50)";
const ROSE_DEEP = "rgba(190, 18, 60, 0.50)";

const PARTICLES: Particle[] = [
    // Outer scatter → inner cluster — each particle has its own choreography
    { fromX: "-38vw", fromY: "-32vh", toX: "-2vw",  toY: "-1vh", fromScale: 0.70, toScale: 1.08, fromOp: 0.35, toOp: 0.85, color: PLUM,      size: 220, duration: 14, delay: 0.0 },
    { fromX: " 36vw", fromY: "-30vh", toX: " 4vw",  toY: " 2vh", fromScale: 0.65, toScale: 1.00, fromOp: 0.30, toOp: 0.80, color: ROSE,      size: 200, duration: 13, delay: 0.6 },
    { fromX: "-42vw", fromY: " 28vh", toX: "-3vw",  toY: " 3vh", fromScale: 0.60, toScale: 0.95, fromOp: 0.30, toOp: 0.78, color: AMBER,     size: 240, duration: 15, delay: 1.2 },
    { fromX: " 40vw", fromY: " 30vh", toX: " 2vw",  toY: " 0vh", fromScale: 0.70, toScale: 1.05, fromOp: 0.35, toOp: 0.82, color: PLUM,      size: 210, duration: 14, delay: 1.8 },
    { fromX: "-30vw", fromY: " 0vh",  toX: "-1vw",  toY: " 1vh", fromScale: 0.55, toScale: 0.90, fromOp: 0.28, toOp: 0.75, color: ROSE_DEEP, size: 180, duration: 12, delay: 0.3 },
    { fromX: " 32vw", fromY: " 0vh",  toX: " 1vw",  toY: "-1vh", fromScale: 0.55, toScale: 0.92, fromOp: 0.28, toOp: 0.78, color: ROSE,      size: 190, duration: 12, delay: 0.9 },
    { fromX: " 0vw",  fromY: "-34vh", toX: " 0vw",  toY: "-2vh", fromScale: 0.50, toScale: 0.85, fromOp: 0.25, toOp: 0.72, color: AMBER,     size: 170, duration: 13, delay: 1.5 },
    { fromX: " 0vw",  fromY: " 32vh", toX: " 0vw",  toY: " 2vh", fromScale: 0.50, toScale: 0.88, fromOp: 0.25, toOp: 0.72, color: PLUM,      size: 175, duration: 13, delay: 0.7 },
    // Smaller "noise particles" for texture
    { fromX: "-22vw", fromY: "-20vh", toX: "-3vw",  toY: " 1vh", fromScale: 0.40, toScale: 0.55, fromOp: 0.20, toOp: 0.55, color: ROSE,      size: 110, duration: 11, delay: 0.2 },
    { fromX: " 24vw", fromY: "-22vh", toX: " 3vw",  toY: "-2vh", fromScale: 0.40, toScale: 0.58, fromOp: 0.20, toOp: 0.55, color: PLUM,      size: 120, duration: 11, delay: 0.8 },
    { fromX: "-26vw", fromY: " 22vh", toX: "-2vw",  toY: " 2vh", fromScale: 0.42, toScale: 0.60, fromOp: 0.22, toOp: 0.58, color: AMBER,     size: 130, duration: 12, delay: 1.4 },
    { fromX: " 28vw", fromY: " 20vh", toX: " 2vw",  toY: "-1vh", fromScale: 0.40, toScale: 0.55, fromOp: 0.20, toOp: 0.55, color: ROSE_DEEP, size: 115, duration: 12, delay: 2.0 },
];

export function HeroOrganicLoop({ className = "" }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}
            style={{ contain: "layout paint" }}
        >
            {/* SVG goo filter — particles within proximity merge into one organic mass */}
            <svg className="absolute -z-10 w-0 h-0" aria-hidden="true">
                <defs>
                    <filter id="hero-goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="
                                1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 22 -10"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            {/* Goo-filtered particle field — the noise → cluster motion */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ filter: "url(#hero-goo)" }}
            >
                {PARTICLES.map((p, i) => (
                    <span
                        key={i}
                        className="hero-particle"
                        style={{
                            // Per-particle CSS variables consumed by `blob-converge`
                            ["--blob-x-from" as string]: p.fromX,
                            ["--blob-y-from" as string]: p.fromY,
                            ["--blob-scale-from" as string]: p.fromScale,
                            ["--blob-op-from" as string]: p.fromOp,
                            ["--blob-x-to" as string]: p.toX,
                            ["--blob-y-to" as string]: p.toY,
                            ["--blob-scale-to" as string]: p.toScale,
                            ["--blob-op-to" as string]: p.toOp,

                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            background: `radial-gradient(circle at 35% 30%, ${p.color}, ${p.color.replace(/[\d.]+\)$/, "0.15)")})`,
                            borderRadius: "50%",
                            position: "absolute",
                            animation: `blob-converge ${p.duration}s cubic-bezier(0.45, 0.05, 0.35, 0.95) ${p.delay}s infinite alternate`,
                            willChange: "transform, opacity",
                        }}
                    />
                ))}
            </div>

            {/* Subtle ambient drift behind the particles — three slow background blobs */}
            <span
                aria-hidden="true"
                className="absolute"
                style={{
                    left: "8%", top: "12%", width: "46vmin", height: "46vmin",
                    background: `radial-gradient(circle at 30% 30%, ${PLUM}, transparent 65%)`,
                    filter: "blur(60px)",
                    animation: "blob-drift-a 22s ease-in-out infinite",
                    opacity: 0.55,
                    willChange: "transform",
                }}
            />
            <span
                aria-hidden="true"
                className="absolute"
                style={{
                    right: "6%", top: "8%", width: "40vmin", height: "40vmin",
                    background: `radial-gradient(circle at 60% 40%, ${ROSE}, transparent 65%)`,
                    filter: "blur(70px)",
                    animation: "blob-drift-b 26s ease-in-out infinite",
                    opacity: 0.50,
                    willChange: "transform",
                }}
            />
            <span
                aria-hidden="true"
                className="absolute"
                style={{
                    left: "30%", bottom: "8%", width: "44vmin", height: "44vmin",
                    background: `radial-gradient(circle at 50% 50%, ${AMBER}, transparent 70%)`,
                    filter: "blur(80px)",
                    animation: "blob-drift-c 28s ease-in-out infinite",
                    opacity: 0.45,
                    willChange: "transform",
                }}
            />

            {/* Motion-reduce fallback — show only the converged still frame */}
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .hero-particle {
                        animation: none !important;
                        transform: translate3d(var(--blob-x-to), var(--blob-y-to), 0) scale(var(--blob-scale-to)) !important;
                        opacity: var(--blob-op-to) !important;
                    }
                }
            `}</style>
        </div>
    );
}
