import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import brandMark from "../../public/brand/productfindai-mark-on-dark.png";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://productfindai.com";
const NativeImage = "img";

export const alt =
    "ProductFindAI does your Amazon product research and returns a focused shortlist.";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function OpenGraphImage() {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
    const protocol =
        requestHeaders.get("x-forwarded-proto") ||
        (host?.startsWith("127.0.0.1") || host?.startsWith("localhost") ? "http" : "https");
    const requestOrigin = host ? `${protocol}://${host}` : siteUrl;
    const markUrl = new URL(brandMark.src, requestOrigin).toString();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "64px 72px 60px",
                    color: "#FFFFFF",
                    backgroundColor: "#021F4E",
                    backgroundImage:
                        "radial-gradient(circle at 12% 12%, rgba(0,76,160,0.62), transparent 34%), radial-gradient(circle at 90% 86%, rgba(254,114,29,0.18), transparent 32%)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        fontSize: 30,
                        fontWeight: 800,
                        letterSpacing: "-1px",
                    }}
                >
                    <NativeImage
                        src={markUrl}
                        alt=""
                        width="80"
                        height="59"
                        style={{ objectFit: "contain" }}
                    />
                    <span>
                        ProductFind<span style={{ color: "#FE721D" }}>AI</span>
                    </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", maxWidth: 1030 }}>
                    <div
                        style={{
                            display: "flex",
                            color: "#FE721D",
                            fontSize: 18,
                            fontWeight: 800,
                            letterSpacing: "3px",
                            textTransform: "uppercase",
                            marginBottom: 24,
                        }}
                    >
                        Amazon product research
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 65,
                            lineHeight: 1.03,
                            fontWeight: 800,
                            letterSpacing: "-3px",
                        }}
                    >
                        Amazon product research, without the wall of lookalikes.
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        color: "rgba(255,255,255,0.70)",
                        fontSize: 18,
                        fontWeight: 650,
                    }}
                >
                    <span>Official listing fields</span>
                    <span style={{ color: "#FE721D" }}>•</span>
                    <span>Hard requirements respected</span>
                    <span style={{ color: "#FE721D" }}>•</span>
                    <span>No paid placement</span>
                </div>
            </div>
        ),
        size,
    );
}
