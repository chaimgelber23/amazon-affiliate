export const PRODUCT_BADGE_SCOPE = "current-verified-shortlist" as const;

export const PRODUCT_BADGE_LABELS = {
    "best-overall": "Top Match",
    "best-price": "Lowest Listed Price",
    "runner-up": "Second Match",
    "strong-alternative": "Another Match",
} as const;

export type ProductBadgeKind = keyof typeof PRODUCT_BADGE_LABELS;

export type ProductBadge = {
    [Kind in ProductBadgeKind]: {
        kind: Kind;
        label: (typeof PRODUCT_BADGE_LABELS)[Kind];
        scope: typeof PRODUCT_BADGE_SCOPE;
        evidence: string;
    };
}[ProductBadgeKind];

export const PRODUCT_BADGE_TONE_CLASSES: Record<ProductBadgeKind, string> = {
    "best-overall":
        "border-violet-200 bg-violet-50 text-violet-800",
    "best-price":
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    "runner-up":
        "border-rose-200 bg-rose-50 text-rose-800",
    "strong-alternative":
        "border-amber-200 bg-amber-50 text-amber-900",
};

const PRODUCT_BADGE_SORT_ORDER: Record<ProductBadgeKind, number> = {
    "best-overall": 0,
    "best-price": 1,
    "runner-up": 2,
    "strong-alternative": 3,
};

export function orderProductBadges(
    badges: readonly ProductBadge[] | undefined,
): ProductBadge[] {
    return [...(badges ?? [])].sort(
        (left, right) =>
            PRODUCT_BADGE_SORT_ORDER[left.kind] -
            PRODUCT_BADGE_SORT_ORDER[right.kind],
    );
}
