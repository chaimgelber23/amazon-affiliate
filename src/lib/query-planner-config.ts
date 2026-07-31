export interface QueryPlannerConfiguration {
    gatewayAvailable: boolean;
    directGoogleAvailable: boolean;
    available: boolean;
    mode: "gateway" | "direct-google" | "deterministic-fallback";
}

type Environment = Record<string, string | undefined>;

/**
 * Keep health reporting aligned with the exact provider-selection rule used by
 * the search route. Vercel OIDC alone does not select AI Gateway here.
 */
export function getQueryPlannerConfiguration(
    environment: Environment = process.env,
): QueryPlannerConfiguration {
    const gatewayAvailable = Boolean(
        environment.AI_GATEWAY_API_KEY?.trim() ||
        environment.PRODUCTFIND_USE_AI_GATEWAY?.trim().toLowerCase() ===
            "true",
    );
    const directGoogleAvailable = Boolean(
        environment.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
    );

    return {
        gatewayAvailable,
        directGoogleAvailable,
        available: gatewayAvailable || directGoogleAvailable,
        mode: gatewayAvailable
            ? "gateway"
            : directGoogleAvailable
              ? "direct-google"
              : "deterministic-fallback",
    };
}
