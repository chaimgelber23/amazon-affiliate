/**
 * HeroOrganicLoop — the visual signature of the ProductFindAI hero.
 *
 * Concept: a spread field of organic shapes (Amazon's noise) sits in place and
 * gently fades in and out — a calm breathing presence rather than motion across
 * the viewport. Shapes hold positions away from the center so the headline +
 * search bar stay legible.
 *
 * Pure CSS + SVG (no Three.js, no video file). The SVG goo filter merges
 * adjacent shapes into one organic mass. Shapes are mixed: organic blobs
 * (irregular border-radius), rounded squares, capsules, and circles.
 *
 * Motion-reduce safe — degrades to a static still frame.
 */

type Shape = "circle" | "blob" | "square" | "capsule";

type Particle = {
    fromX: string; fromY: string; fromScale: number; fromOp: number;
    toX: string;   toY: string;   toScale: number;   toOp: number;
    rot: string;   color: string; size: number;
    shape: Shape;
};

const PLUM = "rgba(91, 33, 182, 0.55)";
const ROSE = "rgba(225, 29, 72, 0.55)";
const AMBER = "rgba(217, 119, 6, 0.50)";
const ROSE_DEEP = "rgba(190, 18, 60, 0.50)";

// Cluster center (where all particles converge) — offset to the LEFT so the
// centered hero text + search bar sit in clear air. Coordinates are relative
// to the hero container's center.
const CX = -28;  // vw — shift cluster ~28% left of center
const CY = 6;    // vh — slight downward shift
const cToX = (offset: number) => `${CX + offset}vw`;
const cToY = (offset: number) => `${CY + offset}vh`;

const PARTICLES: Particle[] = [
    // Outer scatter → inner cluster (left of center)
    { fromX: "-46vw", fromY: "-34vh", toX: cToX(-2), toY: cToY(-2), fromScale: 0.55, toScale: 1.05, fromOp: 0.20, toOp: 0.62, rot: "8deg",  color: PLUM,      size: 220, shape: "blob" },
    { fromX: " 28vw", fromY: "-30vh", toX: cToX( 3), toY: cToY( 1), fromScale: 0.50, toScale: 0.95, fromOp: 0.20, toOp: 0.58, rot: "-6deg", color: ROSE,      size: 200, shape: "circle" },
    { fromX: "-44vw", fromY: " 28vh", toX: cToX(-3), toY: cToY( 2), fromScale: 0.50, toScale: 1.00, fromOp: 0.18, toOp: 0.55, rot: "12deg", color: AMBER,     size: 240, shape: "blob" },
    { fromX: " 36vw", fromY: " 30vh", toX: cToX( 2), toY: cToY( 0), fromScale: 0.55, toScale: 0.92, fromOp: 0.22, toOp: 0.60, rot: "-10deg",color: PLUM,      size: 210, shape: "square" },
    { fromX: "-32vw", fromY: " 0vh",  toX: cToX(-1), toY: cToY( 1), fromScale: 0.45, toScale: 0.85, fromOp: 0.18, toOp: 0.52, rot: "5deg",  color: ROSE_DEEP, size: 180, shape: "capsule" },
    { fromX: " 30vw", fromY: " 0vh",  toX: cToX( 1), toY: cToY(-1), fromScale: 0.45, toScale: 0.88, fromOp: 0.18, toOp: 0.55, rot: "-4deg", color: ROSE,      size: 190, shape: "blob" },
    { fromX: " 4vw",  fromY: "-36vh", toX: cToX( 0), toY: cToY(-2), fromScale: 0.40, toScale: 0.80, fromOp: 0.16, toOp: 0.50, rot: "14deg", color: AMBER,     size: 170, shape: "circle" },
    { fromX: "-4vw",  fromY: " 34vh", toX: cToX( 0), toY: cToY( 2), fromScale: 0.40, toScale: 0.82, fromOp: 0.16, toOp: 0.48, rot: "-12deg",color: PLUM,      size: 175, shape: "square" },
    // Smaller "noise particles" for texture and shape variety
    { fromX: "-22vw", fromY: "-22vh", toX: cToX(-3), toY: cToY( 1), fromScale: 0.32, toScale: 0.50, fromOp: 0.12, toOp: 0.40, rot: "20deg", color: ROSE,      size: 110, shape: "blob" },
    { fromX: " 22vw", fromY: "-24vh", toX: cToX( 3), toY: cToY(-2), fromScale: 0.32, toScale: 0.52, fromOp: 0.12, toOp: 0.42, rot: "-18deg",color: PLUM,      size: 120, shape: "capsule" },
    { fromX: "-26vw", fromY: " 22vh", toX: cToX(-2), toY: cToY( 2), fromScale: 0.34, toScale: 0.55, fromOp: 0.14, toOp: 0.45, rot: "16deg", color: AMBER,     size: 130, shape: "circle" },
    { fromX: " 26vw", fromY: " 22vh", toX: cToX( 2), toY: cToY(-1), fromScale: 0.32, toScale: 0.50, fromOp: 0.12, toOp: 0.42, rot: "-22deg",color: ROSE_DEEP, size: 115, shape: "square" },
];

// Border-radius per shape. Blobs use irregular elliptical radii for organic feel.
function shapeStyles(shape: Shape, size: number): React.CSSProperties {
    switch (shape) {
        case "circle":
            return { width: `${size}px`, height: `${size}px`, borderRadius: "50%" };
        case "blob":
            // Asymmetric border-radius creates an organic, hand-drawn blob shape.
            return { width: `${size}px`, height: `${size * 0.92}px`, borderRadius: "62% 38% 54% 46% / 48% 56% 44% 52%" };
        case "square":
            // Soft rounded square — adds geometric punctuation to the organic field.
            return { width: `${size * 0.95}px`, height: `${size * 0.95}px`, borderRadius: "30%" };
        case "capsule":
            // Wide capsule pill — horizontal accent.
            return { width: `${size * 1.4}px`, height: `${size * 0.55}px`, borderRadius: "9999px" };
    }
}

// Each shape fully appears from nothing, then disappears back to nothing — see the
// per-particle timing below. No single shared cycle: durations + phases are varied
// so the field twinkles instead of vanishing all at once.

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
                        <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="
                                1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 20 -9"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            {/* Goo-filtered shape field — synchronized scatter → cluster → scatter loop */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ filter: "url(#hero-goo)" }}
            >
                {PARTICLES.map((p, i) => {
                    // Vary each shape's lifespan and start phase so they appear and
                    // disappear independently (a living twinkle), never in lockstep.
                    // Deterministic — no Math.random — so SSR and client markup match.
                    const dur = 7 + (i % 6);            // 7–12s lifespan
                    const delay = -((i * 2.3) % dur);   // out-of-phase (negative) start
                    return (
                        <span
                            key={i}
                            className="hero-particle"
                            style={{
                                ...shapeStyles(p.shape, p.size),
                                ["--blob-op-to" as string]: p.toOp,

                                background: `radial-gradient(circle at 35% 30%, ${p.color}, ${p.color.replace(/[\d.]+\)$/, "0.12)")})`,
                                position: "absolute",
                                // Fixed, spread-out position; only opacity animates (0 → peak → 0).
                                transform: `translate3d(${p.fromX}, ${p.fromY}, 0) scale(${p.toScale}) rotate(${p.rot})`,
                                animation: `blob-fade ${dur}s ease-in-out ${delay}s infinite`,
                                willChange: "opacity",
                            }}
                        />
                    );
                })}
            </div>

            {/* Background ambient — three soft glows that fade in place (no drift) */}
            <span
                aria-hidden="true"
                className="absolute"
                style={{
                    left: "8%", top: "12%", width: "46vmin", height: "46vmin",
                    background: `radial-gradient(circle at 30% 30%, ${PLUM}, transparent 65%)`,
                    filter: "blur(60px)",
                    animation: "blob-fade-ambient 11s ease-in-out infinite",
                    willChange: "opacity",
                }}
            />
            <span
                aria-hidden="true"
                className="absolute"
                style={{
                    right: "6%", top: "8%", width: "40vmin", height: "40vmin",
                    background: `radial-gradient(circle at 60% 40%, ${ROSE}, transparent 65%)`,
                    filter: "blur(70px)",
                    animation: "blob-fade-ambient 13s ease-in-out -4s infinite",
                    willChange: "opacity",
                }}
            />
            <span
                aria-hidden="true"
                className="absolute"
                style={{
                    left: "55%", bottom: "8%", width: "44vmin", height: "44vmin",
                    background: `radial-gradient(circle at 50% 50%, ${AMBER}, transparent 70%)`,
                    filter: "blur(80px)",
                    animation: "blob-fade-ambient 15s ease-in-out -8s infinite",
                    willChange: "opacity",
                }}
            />

            {/* Soft radial readability mask — fades the central area where the headline + search bar live,
                so even when shapes are at full opacity none sits directly behind the text. */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 50% 36% at 60% 50%, rgba(250, 247, 242, 0.85) 0%, rgba(250, 247, 242, 0.55) 35%, transparent 70%)",
                }}
            />

            {/* Motion-reduce fallback — static still frame (shapes hold their inline position) */}
            <style>{`
                @media (prefers-reduced-motion: reduce) {
                    .hero-particle {
                        animation: none !important;
                        opacity: var(--blob-op-to) !important;
                    }
                }
            `}</style>
        </div>
    );
}
