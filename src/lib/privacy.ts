import crypto from "node:crypto";

/**
 * Create a stable, pseudonymous request bucket without storing the raw IP.
 *
 * A keyed HMAC is used instead of a plain hash so an exported database cannot
 * be used to cheaply enumerate the IPv4 space. The dedicated secret is
 * preferred; the server-only Supabase service key is a compatibility fallback
 * while deployments add ANALYTICS_HASH_SECRET.
 */
export function pseudonymizeIp(ip: string): string | null {
    const secret =
        process.env.ANALYTICS_HASH_SECRET ??
        process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret || !ip) return null;

    return crypto
        .createHmac("sha256", secret)
        .update(ip)
        .digest("hex");
}

export function sanitizeLogText(value: string, maxLength: number): string {
    return value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

export function sanitizeLogExtra(
    value: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
    if (!value) return null;

    const sanitized: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value).slice(0, 12)) {
        const safeKey = sanitizeLogText(key, 80);
        if (!safeKey) continue;

        if (typeof raw === "string") {
            sanitized[safeKey] = sanitizeLogText(raw, 500);
        } else if (
            typeof raw === "number" ||
            typeof raw === "boolean" ||
            raw === null
        ) {
            sanitized[safeKey] = raw;
        } else {
            sanitized[safeKey] = "[omitted]";
        }
    }

    return sanitized;
}
