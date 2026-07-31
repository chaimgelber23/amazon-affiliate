export const EvidenceVerdict = {
    PASS: "PASS",
    FAIL: "FAIL",
    UNKNOWN: "UNKNOWN",
} as const;

export type EvidenceVerdict =
    (typeof EvidenceVerdict)[keyof typeof EvidenceVerdict];

export interface ConstraintDecision {
    claim: string;
    verdict: EvidenceVerdict;
    blocks: boolean;
}

export interface ListingConstraintEvaluation {
    decisions: ConstraintDecision[];
    blocks: boolean;
    verifiedClaims: string[];
    unknownClaims: string[];
}

interface AbsenceRule {
    claim: string;
    pattern: RegExp;
    strict: boolean;
}

function normalizedWords(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function combineSearchIntent(
    parts: ReadonlyArray<string | null | undefined>,
): string {
    return parts
        .map((part) => part?.trim() ?? "")
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

const ABSENCE_RULES: readonly AbsenceRule[] = [
    { claim: "no earbuds", pattern: /\bearbuds?\b/, strict: false },
    {
        claim: "no poison",
        pattern: /\b(?:poisons?|poisonous|rodenticides?|pesticides?)\b/,
        strict: false,
    },
    { claim: "no hub required", pattern: /\bhubs?\b/, strict: false },
    { claim: "no blade", pattern: /\bblades?\b/, strict: false },
    {
        claim: "no numpad",
        pattern: /\b(?:numpads?|number\s+pads?|numeric\s+keypads?)\b/,
        strict: false,
    },
    {
        claim: "no subscription",
        pattern: /\bsubscriptions?\b/,
        strict: false,
    },
    { claim: "PTFE-free", pattern: /\bptfe\b/, strict: true },
    { claim: "PFAS-free", pattern: /\bpfas\b/, strict: true },
    { claim: "BPA-free", pattern: /\bbpa\b/, strict: true },
    { claim: "latex-free", pattern: /\blatex\b/, strict: true },
    {
        claim: "without UL certification",
        pattern: /\bul(?:\s+(?:listed|certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without ETL certification",
        pattern: /\betl(?:\s+(?:listed|certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without Energy Star certification",
        pattern: /\benergy\s+star(?:\s+(?:certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without NSF certification",
        pattern: /\bnsf(?:\s+(?:certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without FSC certification",
        pattern: /\bfsc(?:\s+(?:certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without GOTS certification",
        pattern: /\bgots(?:\s+(?:certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without OEKO-TEX certification",
        pattern:
            /\boeko\s+tex(?:\s+(?:listed|certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without RoHS compliance",
        pattern: /\brohs(?:\s+(?:compliant|compliance|certified))?\b/,
        strict: true,
    },
    {
        claim: "without GREENGUARD certification",
        pattern: /\bgreenguard(?:\s+(?:certified|certification))?\b/,
        strict: true,
    },
    {
        claim: "without BIFMA certification",
        pattern: /\bbifma(?:\s+(?:certified|certification))?\b/,
        strict: true,
    },
];

function matchesForPattern(value: string, pattern: RegExp): RegExpMatchArray[] {
    const flags = `${pattern.flags.replace(/[gy]/g, "")}g`;
    return Array.from(value.matchAll(new RegExp(pattern.source, flags)));
}

function mentionIsRequestedAbsent(
    value: string,
    index: number,
    length: number,
): boolean {
    const before = value
        .slice(0, index)
        .split(" ")
        .filter(Boolean)
        .slice(-12)
        .join(" ");
    const after = value
        .slice(index + length)
        .split(" ")
        .filter(Boolean)
        .slice(0, 5)
        .join(" ");
    return (
        /\b(?:no|not|without|exclude|excludes|excluding|avoid|avoiding)(?:\s+(?:any|a|an|the))?(?:\s+[a-z0-9]+){0,5}$/.test(
            before,
        ) ||
        /\bfree\s+(?:of|from)(?:\s+[a-z0-9]+){0,3}$/.test(before) ||
        /^(?:free|excluded|unwanted|not\s+allowed)\b/.test(after)
    );
}

function queryRequestsAbsence(query: string, rule: AbsenceRule): boolean {
    const normalized = normalizedWords(query);
    return matchesForPattern(normalized, rule.pattern).some((match) =>
        mentionIsRequestedAbsent(
            normalized,
            match.index ?? 0,
            match[0].length,
        ),
    );
}

function mentionIsExplicitlyAbsent(
    value: string,
    index: number,
    length: number,
): boolean {
    const before = value
        .slice(0, index)
        .split(" ")
        .filter(Boolean)
        .slice(-10)
        .join(" ");
    const after = value
        .slice(index + length)
        .split(" ")
        .filter(Boolean)
        .slice(0, 6)
        .join(" ");
    const directNegation =
        /\b(?:no|non|not|never|without)(?:\s+(?:any|a|an|the))?$/.test(
            before,
        );
    const predicateNegation =
        /\b(?:does\s+not|doesn\s+t|do\s+not|don\s+t|is\s+not|isn\s+t|are\s+not|aren\s+t|will\s+not|won\s+t)(?:\s+(?:target|targets|targeting|attract|attracts|kill|kills|control|controls|contain|contains|include|includes|included|use|uses|used|require|requires|required|need|needs|needed|support|supports|supported|or|and)){0,5}(?:\s+(?:any|a|an|the))?$/.test(
            before,
        );
    const contextualNegation =
        /\b(?:excludes?|excluding|excluded|instead\s+of|alternatives?\s+to|rather\s+than|unlike|free\s+of|free\s+from|no\s+need\s+for|without\s+(?:the\s+)?need\s+for|eliminates?\s+the\s+need\s+for|avoids?\s+the\s+need\s+for|not\s+(?:designed|intended|effective)\s+(?:for|against))(?:\s+[a-z0-9]+){0,3}$/.test(
            before,
        );
    const negatedAfter =
        /^(?:free|proof|excluded|unwanted|alternatives?|not\s+(?:contained|included|present|supported|targeted|killed|controlled|needed|required|used)|(?:is|are)\s+not\s+(?:contained|included|present|supported|targeted|killed|controlled|needed|required|used))\b/.test(
            after,
        );
    return (
        directNegation ||
        predicateNegation ||
        contextualNegation ||
        negatedAfter
    );
}

function hasExplicitAbsenceEvidence(value: string, pattern: RegExp): boolean {
    const normalized = normalizedWords(value);
    return matchesForPattern(normalized, pattern).some((match) =>
        mentionIsExplicitlyAbsent(
            normalized,
            match.index ?? 0,
            match[0].length,
        ),
    );
}

function hasAffirmativeEvidenceMatch(
    value: string,
    pattern: RegExp,
): boolean {
    const normalized = normalizedWords(value);
    for (const match of matchesForPattern(normalized, pattern)) {
        if (
            !mentionIsExplicitlyAbsent(
                normalized,
                match.index ?? 0,
                match[0].length,
            )
        ) {
            return true;
        }
    }
    return false;
}

export function evaluateListingConstraints({
    query,
    title,
    features = [],
}: {
    query: string;
    title: string;
    features?: string[];
}): ListingConstraintEvaluation {
    const evidence = [title, ...features];
    const decisions: ConstraintDecision[] = [];

    for (const rule of ABSENCE_RULES) {
        if (!queryRequestsAbsence(query, rule)) continue;

        const hasForbiddenEvidence = evidence.some((value) =>
            hasAffirmativeEvidenceMatch(value, rule.pattern),
        );
        const hasReliableAbsence = evidence.some((value) =>
            hasExplicitAbsenceEvidence(value, rule.pattern),
        );
        const verdict = hasForbiddenEvidence
            ? EvidenceVerdict.FAIL
            : hasReliableAbsence
              ? EvidenceVerdict.PASS
              : EvidenceVerdict.UNKNOWN;
        decisions.push({
            claim: rule.claim,
            verdict,
            blocks:
                verdict === EvidenceVerdict.FAIL ||
                (verdict === EvidenceVerdict.UNKNOWN && rule.strict),
        });
    }

    return {
        decisions,
        blocks: decisions.some((decision) => decision.blocks),
        verifiedClaims: decisions
            .filter((decision) => decision.verdict === EvidenceVerdict.PASS)
            .map((decision) => decision.claim),
        unknownClaims: decisions
            .filter((decision) => decision.verdict === EvidenceVerdict.UNKNOWN)
            .map((decision) => decision.claim),
    };
}

export function extractRequestedAsins(query: string): string[] {
    const asins: string[] = [];
    const seen = new Set<string>();
    const add = (value: string | undefined) => {
        const normalized = value?.toUpperCase();
        if (
            !normalized ||
            !/^[A-Z0-9]{10}$/.test(normalized) ||
            seen.has(normalized)
        ) {
            return;
        }
        seen.add(normalized);
        asins.push(normalized);
    };

    for (const match of query.matchAll(
        /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*amazon\.[a-z.]{2,}\/(?:[^\s/?#]+\/)*(?:dp|product|d)\/([a-z0-9]{10})(?=[/?#\s]|$)/gi,
    )) {
        add(match[1]);
    }
    for (const match of query.matchAll(
        /\basin\s*(?::|#|is)?\s*([a-z0-9]{10})\b/gi,
    )) {
        add(match[1]);
    }
    for (const match of query.matchAll(/\bb0[a-z0-9]{8}\b/gi)) {
        add(match[0]);
    }
    return asins;
}

export function compareDeterministicListingIdentity(
    leftAsin: string,
    rightAsin: string,
): number {
    return leftAsin.toUpperCase().localeCompare(rightAsin.toUpperCase());
}

export interface PriceCeiling {
    amount: number;
    inclusive: boolean;
}

const NON_PRICE_UNITS =
    /^(?:mah|wh|watts?|w|volts?|v|amps?|a|gb|tb|mb|hz|khz|mhz|ghz|oz|ounces?|lbs?|pounds?|inches?|inch|cm|mm|ml|liters?|litres?|packs?|count|ct|pieces?|pcs?|units?|reviews?|stars?|hours?|hrs?|minutes?|mins?)\b/i;

function parsedCeiling(
    match: RegExpMatchArray | null,
    inclusive: boolean,
): PriceCeiling | null {
    if (!match) return null;
    const amount = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return { amount, inclusive };
}

/**
 * Parse an explicit shopper price ceiling without treating nearby capacity,
 * size, count, or rating numbers as money. Currency is optional only for
 * ordinary budget phrasing such as "headphones under 100".
 */
export function extractPriceCeiling(query: string): PriceCeiling | null {
    const strictPrefix =
        /\b(?:under|below|less than)\s*(?:\$\s*)?([\d,]+(?:\.\d{1,2})?)(?![\d,.])(?:\s*(?:dollars?|bucks?|usd)\b)?/gi;
    for (const match of query.matchAll(strictPrefix)) {
        const tail = query.slice((match.index ?? 0) + match[0].length).trimStart();
        if (NON_PRICE_UNITS.test(tail)) continue;
        return parsedCeiling(match, false);
    }

    const inclusivePrefix =
        query.match(
            /\b(?:up to|no more than|at most|max(?:imum)?(?: budget)?(?: of)?|budget(?: of| is|:)?)[\s$]*([\d,]+(?:\.\d{1,2})?)(?![\d,.])(?:\s*(?:dollars?|bucks?|usd)\b)?/i,
        ) ??
        query.match(
            /\$\s*([\d,]+(?:\.\d{1,2})?)(?![\d,.])\s*(?:dollars?\s*)?(?:or less|max(?:imum)?|budget)\b/i,
        );
    return parsedCeiling(inclusivePrefix, true);
}

export function parseOfficialPrice(price: string | undefined): number | null {
    if (!price) return null;
    const match = price
        .replace(/,/g, "")
        .match(/(?:USD\s*)?\$?\s*(\d+(?:\.\d{1,2})?)/i);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
}

export function fitsPriceCeiling(
    price: string | undefined,
    ceiling: PriceCeiling | null,
): boolean {
    if (!ceiling) return true;
    const current = parseOfficialPrice(price);
    if (current === null) return false;
    return ceiling.inclusive
        ? current <= ceiling.amount
        : current < ceiling.amount;
}

interface ProductIdentityRule {
    query: RegExp;
    listing: RegExp;
    accessoryOnly?: RegExp;
}

const PRODUCT_IDENTITY_RULES: readonly ProductIdentityRule[] = [
    { query: /\b(?:mouse|mice)\b/, listing: /\b(?:mouse|mice)\b/ },
    { query: /\bwebcams?\b/, listing: /\bwebcams?\b/ },
    { query: /\bmicrophones?\b/, listing: /\bmicrophones?\b/ },
    { query: /\bspeakers?\b/, listing: /\bspeakers?\b/ },
    { query: /\brouters?\b/, listing: /\brouters?\b/ },
    { query: /\bprinters?\b/, listing: /\bprinters?\b/ },
    { query: /\bprojectors?\b/, listing: /\bprojectors?\b/ },
    {
        query: /\b(?:laptops?|notebooks?)\b/,
        listing: /\b(?:laptops?|notebooks?)\b/,
    },
    { query: /\btablets?\b/, listing: /\btablets?\b/ },
    { query: /\bcameras?\b/, listing: /\bcameras?\b/ },
    { query: /\bearbuds?\b/, listing: /\bearbuds?\b/ },
    { query: /\bheadphones?\b/, listing: /\bheadphones?\b/ },
    { query: /\bheadsets?\b/, listing: /\bheadsets?\b/ },
    { query: /\bvacuums?\b/, listing: /\bvacuums?\b/ },
    { query: /\bblenders?\b/, listing: /\bblenders?\b/ },
    { query: /\btoasters?\b/, listing: /\btoasters?\b/ },
    { query: /\bair\s+fryers?\b/, listing: /\bair\s+fryers?\b/ },
    {
        query: /\bcoffee\s+(?:makers?|machines?)\b/,
        listing: /\bcoffee\s+(?:makers?|machines?)\b/,
    },
    {
        query: /\bair\s+purifiers?\b/,
        listing: /\bair\s+purifiers?\b/,
    },
    { query: /\bhumidifiers?\b/, listing: /\bhumidifiers?\b/ },
    { query: /\bdehumidifiers?\b/, listing: /\bdehumidifiers?\b/ },
    {
        query: /\bgrinders?\b/,
        listing: /\bgrinders?\b/,
        accessoryOnly:
            /\b(?:cleaning\s+)?brush(?:es)?\b|\breplacement\s+(?:burrs?|parts?)\b|\bgrinder\s+(?:cleaner|accessor(?:y|ies))\b/,
    },
    {
        query: /\bkn(?:ife|ives)\b/,
        listing: /\bkn(?:ife|ives)\b/,
        accessoryOnly:
            /\b(?:knife\s+)?sharpeners?\b|\bsharpening\s+(?:stone|system|rod)\b|\bknife\s+(?:sheath|guard|case|roll|block)\b/,
    },
    {
        query: /\bdesks?\b/,
        listing: /\bdesks?\b/,
        accessoryOnly:
            /\bdesk\s+(?:converter|mat|frame|legs?|drawer|organizer|cable\s+tray|accessor(?:y|ies))\b|\b(?:converter|frame|legs?|drawer|cable\s+tray)\s+for\s+(?:a\s+)?desk\b/,
    },
    {
        query: /\b(?:shoes?|sneakers?)\b/,
        listing: /\b(?:shoes?|sneakers?)\b/,
        accessoryOnly:
            /\b(?:shoe\s+)?(?:insoles?|inserts?|laces?|cleaners?|bags?|racks?)\b/,
    },
    {
        query: /\bpans?\b/,
        listing: /\bpans?\b/,
        accessoryOnly:
            /\b(?:pan\s+)?(?:lids?|protectors?|scrapers?|racks?)\b/,
    },
];

function identityMentionIsNegated(value: string, index: number): boolean {
    const before = value
        .slice(0, index)
        .split(" ")
        .filter(Boolean)
        .slice(-6)
        .join(" ");
    return /\b(?:no|not|without|exclude|excluding|avoid|avoiding)(?:\s+[a-z0-9]+){0,4}$/.test(
        before,
    );
}

/**
 * Fail closed when an unambiguous product request resolves to a different
 * product or a known accessory-only listing. Multiple product nouns are left
 * to the route's compatibility/constraint checks.
 */
export function provesRequestedProductIdentity(
    query: string,
    title: string,
): boolean {
    const normalizedQuery = normalizedWords(query);
    const normalizedTitle = normalizedWords(title);
    const requested = PRODUCT_IDENTITY_RULES.filter((rule) => {
        const match = normalizedQuery.match(rule.query);
        return (
            match !== null &&
            !identityMentionIsNegated(normalizedQuery, match.index ?? 0)
        );
    });
    if (requested.length !== 1) return true;
    const [rule] = requested;
    return (
        rule.listing.test(normalizedTitle) &&
        !rule.accessoryOnly?.test(normalizedTitle)
    );
}

export function explicitlyRequiresNewCondition(query: string): boolean {
    const normalized = normalizedWords(query);
    return (
        /\b(?:brand\s+new|factory\s+new|new)\s+condition(?:\s+only)?\b/.test(
            normalized,
        ) ||
        /\bcondition\s+(?:is\s+|must\s+be\s+|has\s+to\s+be\s+)?(?:brand\s+|factory\s+)?new\b/.test(
            normalized,
        ) ||
        /\b(?:must|needs?\s+to|has\s+to|should)\s+be\s+(?:brand\s+|factory\s+)?new\b/.test(
            normalized,
        ) ||
        /\b(?:only\s+(?:brand\s+|factory\s+)?new|(?:brand\s+|factory\s+)?new\s+only)\b/.test(
            normalized,
        )
    );
}

type PestTarget =
    | "ant"
    | "roach"
    | "fly"
    | "gnat"
    | "mosquito"
    | "mouse"
    | "rat"
    | "spider"
    | "wasp"
    | "termite"
    | "flea"
    | "bed-bug"
    | "moth";

const PEST_TARGET_RULES: Array<{
    key: PestTarget;
    pattern: RegExp;
}> = [
    { key: "ant", pattern: /\bants?\b/ },
    {
        key: "roach",
        pattern: /\b(?:roach(?:es)?|cockroach(?:es)?)\b/,
    },
    {
        key: "fly",
        pattern: /\b(?:fly|flies|fruit\s+(?:fly|flies))\b/,
    },
    { key: "gnat", pattern: /\bgnats?\b/ },
    { key: "mosquito", pattern: /\bmosquito(?:es)?\b/ },
    { key: "mouse", pattern: /\b(?:mouse|mice)\b/ },
    { key: "rat", pattern: /\brats?\b/ },
    { key: "spider", pattern: /\bspiders?\b/ },
    { key: "wasp", pattern: /\b(?:wasps?|hornets?)\b/ },
    { key: "termite", pattern: /\btermites?\b/ },
    { key: "flea", pattern: /\bfleas?\b/ },
    { key: "bed-bug", pattern: /\bbed\s*bugs?\b/ },
    { key: "moth", pattern: /\bmoths?\b/ },
];

function pestTargets(value: string): Set<PestTarget> {
    return new Set(
        PEST_TARGET_RULES.filter(({ pattern }) =>
            hasAffirmativeEvidenceMatch(value, pattern),
        ).map(({ key }) => key),
    );
}

const PEST_TRAP_FAMILY_PATTERN =
    /\b(?:traps?|baits?|bait\s+stations?|stations?|stakes?)\b/;
const PEST_NON_TRAP_FORM_PATTERN =
    /\b(?:sprays?|aerosols?|powders?|granules?|dusts?|gel\s+syringes?|foggers?)\b/;
const BROAD_PEST_TARGET_PATTERN =
    /\b(?:(?:multi|multiple)\s+(?:pest|insect|bug)s?|(?:other|various|many|multiple|common|general|household)\s+(?:crawling\s+)?(?:insects?|pests?|bugs?)|(?:all\s+)?crawling\s+(?:insects?|pests?|bugs?)|broad\s+spectrum\s+(?:insect|pest|bug)\s+control|(?:wide\s+range|variety)\s+of\s+(?:insects?|pests?|bugs?))\b/;
const PEST_ACCESSORY_NOUN_PATTERN =
    /\b(?:holders?|covers?|trays?|mounts?|containers?|cases?|accessor(?:y|ies)|protectors?|enclosures?|boxes?|cages?)\b/;

function normalizedEvidenceClauses(
    title: string,
    features: string[],
): Array<{ value: string; isTitle: boolean }> {
    return [
        { value: normalizedWords(title), isTitle: true },
        ...features
            .flatMap((feature) => feature.split(/[.;|\u2022]+/))
            .map((feature) => ({
                value: normalizedWords(feature),
                isTitle: false,
            })),
    ].filter((clause) => clause.value);
}

function officialFeatureClaimsNonTrapForm(feature: string): boolean {
    if (!hasAffirmativeEvidenceMatch(feature, PEST_NON_TRAP_FORM_PATTERN)) {
        return false;
    }
    const normalized = normalizedWords(feature);
    return (
        /^(?:an?\s+)?(?:ready\s+to\s+use\s+)?(?:ant\s+)?(?:sprays?|aerosols?|powders?|granules?|dusts?|gel\s+syringes?|foggers?)\b/.test(
            normalized,
        ) ||
        /\b(?:this|the)\s+(?:product|formula|treatment|solution|killer|item)\b(?:\s+[a-z0-9]+){0,5}\s+(?:is|comes\s+as)\b(?:\s+[a-z0-9]+){0,4}\s+(?:sprays?|aerosols?|powders?|granules?|dusts?|gel\s+syringes?|foggers?)\b/.test(
            normalized,
        ) ||
        /\b(?:ready\s+to\s+use|aerosol|pump|trigger)\s+(?:ant\s+)?sprays?\b/.test(
            normalized,
        )
    );
}

function claimsPestAccessoryOnly(
    clause: string,
    isTitle: boolean,
): boolean {
    if (!hasAffirmativeEvidenceMatch(clause, PEST_ACCESSORY_NOUN_PATTERN)) {
        return false;
    }
    const normalized = normalizedWords(clause);
    const accessoryForTrap =
        /\b(?:holders?|covers?|trays?|mounts?|containers?|cases?|accessor(?:y|ies)|protectors?|enclosures?|boxes?|cages?)\b(?:\s+[a-z0-9]+){0,4}\s+(?:for|fits?|compatible\s+with|designed\s+for)\b(?:\s+[a-z0-9]+){0,6}\s+(?:ant\s+)?(?:bait\s+)?(?:traps?|stations?)\b/.test(
            normalized,
        );
    const trapAccessory =
        /\b(?:ant\s+)?(?:bait\s+)?(?:traps?|stations?)\b(?:\s+(?:reusable|protective|safety|weatherproof|outdoor|indoor|locking|child\s+resistant)){0,3}\s+(?:holders?|covers?|trays?|mounts?|containers?|cases?|accessor(?:y|ies)|protectors?|enclosures?|boxes?|cages?)\b/.test(
            normalized,
        );
    const explicitAccessoryIdentity =
        /\b(?:this|these|the)\s+(?:product|item|set|pack|items)?\s*(?:is|are)\b(?:\s+[a-z0-9]+){0,4}\s+(?:holders?|covers?|trays?|mounts?|containers?|cases?|accessor(?:y|ies)|protectors?|enclosures?|boxes?|cages?)\b/.test(
            normalized,
        ) ||
        /\b(?:contains?|includes?)\b(?:\s+[a-z0-9]+){0,4}\s+(?:holders?|covers?|trays?|mounts?|containers?|cases?|accessor(?:y|ies)|protectors?|enclosures?|boxes?|cages?)\s+only\b/.test(
            normalized,
        ) ||
        /\b(?:holders?|covers?|trays?|mounts?|containers?|cases?|accessor(?:y|ies)|protectors?|enclosures?|boxes?|cages?)\s+only\b/.test(
            normalized,
        );
    return accessoryForTrap || (isTitle && trapAccessory) || explicitAccessoryIdentity;
}

function claimsIncompletePestProduct(
    title: string,
    evidenceClauses: Array<{ value: string; isTitle: boolean }>,
): boolean {
    const normalizedTitle = normalizedWords(title);
    if (
        /\b(?:refills?|replacement|spare)\b(?:\s+[a-z0-9]+){0,5}\s+(?:baits?|cartridges?|pods?|inserts?|traps?|stations?)\b/.test(
            normalizedTitle,
        ) ||
        /\b(?:ant\s+)?(?:traps?|baits?|stations?)\s+refills?\b/.test(
            normalizedTitle,
        ) ||
        /\b(?:baits?|cartridges?|pods?|inserts?)\b(?:\s+[a-z0-9]+){0,4}\s+(?:refills?|replacements?|for\s+(?:ant\s+)?(?:bait\s+)?stations?)\b/.test(
            normalizedTitle,
        )
    ) {
        return true;
    }

    return evidenceClauses.some(({ value }) =>
        /\b(?:bait\s+not\s+included|without\s+bait|no\s+bait\s+(?:included|supplied)|bait\s+sold\s+separately|add\s+(?:your\s+)?own\s+bait|unbaited|empty\s+(?:bait\s+)?stations?|(?:bait|traps?|stations?)\s+(?:(?:is|are)\s+)?not\s+included|refills?\s+only|replacement\s+(?:bait|trap|station)\s+only|(?:this|the)\s+(?:product|item|pack|set)\b(?:\s+[a-z0-9]+){0,5}\s+(?:is\b(?:\s+[a-z0-9]+){0,3}\s+(?:a\s+)?(?:refill|replacement|spare)\b|(?:contains?|includes?)\b(?:\s+[a-z0-9]+){0,3}\s+only\s+refills?\b))\b/.test(
            value,
        ),
    );
}

export function violatesPestProductSpecificity(
    query: string,
    title: string,
    features: string[] = [],
): boolean {
    const normalizedQuery = normalizedWords(query);
    const normalizedTitle = normalizedWords(title);
    const evidenceClauses = normalizedEvidenceClauses(title, features);
    const requestedTargets = pestTargets(normalizedQuery);
    if (
        requestedTargets.size === 0 ||
        !/\b(?:traps?|baits?|bait\s+stations?|stations?|stakes?|killers?|control)\b/.test(
            normalizedQuery,
        )
    ) {
        return false;
    }

    const listingTargets = new Set<PestTarget>();
    for (const { value } of evidenceClauses) {
        for (const target of pestTargets(value)) listingTargets.add(target);
    }
    for (const target of requestedTargets) {
        if (!listingTargets.has(target)) return true;
    }
    const explicitlyAllowsBroadPests = hasAffirmativeEvidenceMatch(
        normalizedQuery,
        /\b(?:multi\s+pest|multiple\s+pests?|all\s+insects?|insects?|bugs?)\b/,
    );
    if (
        requestedTargets.size === 1 &&
        !explicitlyAllowsBroadPests &&
        evidenceClauses.some(({ value }) =>
            hasAffirmativeEvidenceMatch(value, BROAD_PEST_TARGET_PATTERN),
        )
    ) {
        return true;
    }

    const requestsTrapFamily =
        PEST_TRAP_FAMILY_PATTERN.test(normalizedQuery);
    if (
        requestsTrapFamily &&
        !evidenceClauses.some(({ value }) =>
            hasAffirmativeEvidenceMatch(value, PEST_TRAP_FAMILY_PATTERN),
        )
    ) {
        return true;
    }
    if (
        requestsTrapFamily &&
        (hasAffirmativeEvidenceMatch(
            normalizedTitle,
            PEST_NON_TRAP_FORM_PATTERN,
        ) ||
            features.some(officialFeatureClaimsNonTrapForm))
    ) {
        return true;
    }
    if (
        requestedTargets.has("ant") &&
        /\b(?:ant\s+moats?|ant\s+farms?)\b/.test(normalizedTitle)
    ) {
        return true;
    }
    if (
        evidenceClauses.some(({ value, isTitle }) =>
            claimsPestAccessoryOnly(value, isTitle),
        )
    ) {
        return true;
    }

    const explicitlyRequestsEmptyOrReusable =
        /\b(?:reusable|refills?|replacement|empty|bait\s+not\s+included|without\s+bait)\b/.test(
            normalizedQuery,
        );
    if (
        !explicitlyRequestsEmptyOrReusable &&
        claimsIncompletePestProduct(title, evidenceClauses)
    ) {
        return true;
    }

    return false;
}

function errorSignals(error: unknown, depth = 0): string[] {
    if (depth > 2 || error === null || error === undefined) return [];
    if (typeof error === "string" || typeof error === "number") {
        return [String(error)];
    }
    if (typeof error !== "object") return [];
    const record = error as Record<string, unknown>;
    const signals = ["name", "message", "code", "status", "statusCode"]
        .map((key) => record[key])
        .filter(
            (value): value is string | number =>
                typeof value === "string" || typeof value === "number",
        )
        .map(String);
    if (record.response && typeof record.response === "object") {
        const status = (record.response as Record<string, unknown>).status;
        if (typeof status === "string" || typeof status === "number") {
            signals.push(String(status));
        }
    }
    return signals.concat(errorSignals(record.cause, depth + 1));
}

export function isFatalAmazonSearchError(error: unknown): boolean {
    const signal = errorSignals(error).join(" ");
    if (/\bsearch\s+deadline\s+exceeded\b/i.test(signal)) return true;
    if (isAmazonAccessUnavailableError(error)) return true;
    if (
        /\bTimeoutError\b/i.test(signal) ||
        /\b(?:timed?\s*out|timeout)\b/i.test(signal)
    ) {
        return false;
    }
    if (
        /\bAbortError\b/i.test(signal) ||
        /\b(?:aborted|cancelled|canceled)\b/i.test(signal)
    ) {
        return true;
    }

    // A local per-call timeout or queue/lease miss is recoverable for one
    // discovery phrase. The route separately promotes its shared request
    // cancellation/deadline to fatal before calling this classifier.
    // Unknown errors stay fail-closed so programming and malformed-request
    // failures cannot be converted into a partial shortlist.
    return !(
        /\b(?:busy|queue|lease)\b/i.test(signal) ||
        /(?:^|\D)429(?:\D|$)/.test(signal) ||
        /(?:^|\D)5\d\d(?:\D|$)/.test(signal) ||
        /\b(?:throttl|too\s+many\s+requests|network|transport|fetch\s+failed|connection|econn|enotfound|socket|transient|upstream)\b/i.test(
            signal,
        )
    );
}

export function isAmazonAccessUnavailableError(error: unknown): boolean {
    const signal = errorSignals(error).join(" ");
    return (
        /(?:^|\D)(?:401|403)(?:\D|$)/.test(signal) ||
        /\b(?:AssociateNotEligible|unauthori[sz]ed|forbidden|authentication|authorization|access\s+denied|not\s+eligible|invalid\s+(?:credentials?|signature|partner\s+tag))\b/i.test(
            signal,
        ) ||
        /\bAmazon\s+Creators\s+API\b.*\b(?:not\s+configured|credential\s+version\s+is\s+unsupported)\b/i.test(
            signal,
        ) ||
        /\bCreators\s+API\s+token\b.*\b(?:failed|did\s+not\s+include)\b/i.test(
            signal,
        )
    );
}

export async function collectSuccessfulPhraseSets<T>(
    phrases: readonly string[],
    fetchPhrase: (phrase: string) => Promise<T[]> | T[],
    isFatal: (error: unknown) => boolean = isFatalAmazonSearchError,
): Promise<T[][]> {
    const sets: T[][] = [];
    const failures: unknown[] = [];
    for (const phrase of phrases) {
        try {
            sets.push(await fetchPhrase(phrase));
        } catch (error) {
            if (isFatal(error)) throw error;
            failures.push(error);
        }
    }
    if (sets.length === 0 && failures.length > 0) {
        throw new AggregateError(
            failures,
            "Every Amazon search phrase failed.",
        );
    }
    return sets;
}
