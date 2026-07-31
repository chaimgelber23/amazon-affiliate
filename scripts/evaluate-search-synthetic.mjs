import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const coreSource = await readFile(
    new URL("../src/lib/search-core.ts", import.meta.url),
    "utf8",
);
assert.doesNotMatch(coreSource, /^\s*import(?:\s|\()/m);
assert.doesNotMatch(
    coreSource,
    /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/,
);
const searchRouteSource = await readFile(
    new URL("../src/app/api/search/route.ts", import.meta.url),
    "utf8",
);
const searchBoxSource = await readFile(
    new URL("../src/components/SearchBox.tsx", import.meta.url),
    "utf8",
);

const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch",
);
const restoreFetch = () => {
    if (originalFetchDescriptor) {
        Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
        delete globalThis.fetch;
    }
};
Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: false,
    value: async () => {
        throw new Error("NETWORK_FENCE: synthetic search evaluation is offline");
    },
});

let searchCore;
let queryPlannerConfig;
let catalogStatusPolicy;
try {
    searchCore = await import("../src/lib/search-core.ts");
    queryPlannerConfig = await import("../src/lib/query-planner-config.ts");
    catalogStatusPolicy = await import("../src/lib/catalog-status.ts");
} catch (error) {
    restoreFetch();
    throw error;
}

const {
    EvidenceVerdict,
    combineSearchIntent,
    collectSuccessfulPhraseSets,
    compareDeterministicListingIdentity,
    evaluateListingConstraints,
    explicitlyRequiresNewCondition,
    extractPriceCeiling,
    extractRequestedAsins,
    fitsPriceCeiling,
    isAmazonAccessUnavailableError,
    isFatalAmazonSearchError,
    provesRequestedProductIdentity,
    violatesPestProductSpecificity,
} = searchCore;
const { shouldRecordCatalogFailure } = catalogStatusPolicy;

const tests = [];

function test(name, run) {
    tests.push({ name, run });
}

function assertEvaluationPartitions(evaluation) {
    assert.equal(
        evaluation.blocks,
        evaluation.decisions.some((decision) => decision.blocks),
    );
    assert.deepEqual(
        evaluation.verifiedClaims,
        evaluation.decisions
            .filter((decision) => decision.verdict === EvidenceVerdict.PASS)
            .map((decision) => decision.claim),
    );
    assert.deepEqual(
        evaluation.unknownClaims,
        evaluation.decisions
            .filter((decision) => decision.verdict === EvidenceVerdict.UNKNOWN)
            .map((decision) => decision.claim),
    );
}

function onlyDecision(evaluation) {
    assertEvaluationPartitions(evaluation);
    assert.equal(evaluation.decisions.length, 1);
    return evaluation.decisions[0];
}

test("source dependency and network fence", async () => {
    assert.equal(typeof searchCore.evaluateListingConstraints, "function");
    assert.equal(typeof searchCore.collectSuccessfulPhraseSets, "function");
    assert.match(
        searchRouteSource,
        /from\s+["']@\/lib\/search-core["']/,
    );
    assert.doesNotMatch(
        searchRouteSource,
        /function\s+violatesPestProductSpecificity\s*\(/,
    );
});

test("query-planner health selection matches runtime selection", () => {
    const { getQueryPlannerConfiguration } = queryPlannerConfig;
    assert.deepEqual(
        getQueryPlannerConfiguration({ VERCEL_OIDC_TOKEN: "synthetic" }),
        {
            gatewayAvailable: false,
            directGoogleAvailable: false,
            available: false,
            mode: "deterministic-fallback",
        },
    );
    assert.equal(
        getQueryPlannerConfiguration({
            PRODUCTFIND_USE_AI_GATEWAY: "true",
        }).mode,
        "gateway",
    );
    assert.equal(
        getQueryPlannerConfiguration({
            GOOGLE_GENERATIVE_AI_API_KEY: "synthetic",
        }).mode,
        "direct-google",
    );
});

test("refinement intent remains cumulative across multiple steps", () => {
    const original = "mechanical keyboard under $150";
    const firstRefinement = "wireless";
    const secondRefinement = "quiet switches";

    const firstPriorIntent = combineSearchIntent([original]);
    const firstServerIntent = combineSearchIntent([
        firstPriorIntent,
        firstRefinement,
    ]);
    assert.equal(
        firstServerIntent,
        "mechanical keyboard under $150 wireless",
    );

    const secondPriorIntent = combineSearchIntent([
        original,
        firstRefinement,
    ]);
    const secondServerIntent = combineSearchIntent([
        secondPriorIntent,
        secondRefinement,
    ]);
    assert.equal(
        secondServerIntent,
        "mechanical keyboard under $150 wireless quiet switches",
    );
    assert.match(searchBoxSource, /originalQuery:\s*priorIntent/);
    assert.match(
        searchRouteSource,
        /combineSearchIntent\(\[\s*isSafeRefinement/,
    );
});

test("deterministic ranking contains no hardcoded brand bonus", () => {
    const start = searchRouteSource.indexOf("function exactTitleFitScore");
    const end = searchRouteSource.indexOf(
        "function officialListingFitScore",
        start,
    );
    assert.notEqual(start, -1);
    assert.notEqual(end, -1);
    const scoringSource = searchRouteSource.slice(start, end);
    assert.doesNotMatch(
        scoringSource,
        /\b(?:Sony|Bose|Sennheiser|Logitech|Razer|Keychron|New Balance)\b/i,
    );

    const compareStart = searchRouteSource.indexOf(
        "function compareOfficialCandidates",
    );
    const compareEnd = searchRouteSource.indexOf(
        "function buildAmazonDiscoveryQuery",
        compareStart,
    );
    assert.notEqual(compareStart, -1);
    assert.notEqual(compareEnd, -1);
    assert.doesNotMatch(
        searchRouteSource.slice(compareStart, compareEnd),
        /\baiRank\b/,
    );
    assert.doesNotMatch(searchRouteSource, /\baiRank\b/);

    const forward = ["B0FAKE0002", "B0FAKE0001"].sort(
        compareDeterministicListingIdentity,
    );
    const reversed = ["B0FAKE0001", "B0FAKE0002"]
        .reverse()
        .sort(compareDeterministicListingIdentity);
    assert.deepEqual(forward, ["B0FAKE0001", "B0FAKE0002"]);
    assert.deepEqual(reversed, forward);
});

test("passive catalog status records provider evidence, not local pressure", () => {
    assert.equal(
        shouldRecordCatalogFailure({
            error: new Error(
                "Amazon product API is busy; shared request queue is full",
            ),
            catalogRequestStarted: false,
            catalogFailureObserved: false,
            requestCancelled: false,
        }),
        false,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: Object.assign(
                new Error("Creators API token request failed (500)"),
                { status: 500 },
            ),
            catalogRequestStarted: false,
            catalogFailureObserved: false,
            requestCancelled: false,
        }),
        true,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: Object.assign(
                new Error("The operation was aborted due to timeout"),
                { name: "TimeoutError" },
            ),
            catalogRequestStarted: false,
            catalogFailureObserved: false,
            requestCancelled: false,
        }),
        true,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: Object.assign(
                new Error("Creators API token request failed (401)"),
                { status: 401 },
            ),
            catalogRequestStarted: false,
            catalogFailureObserved: false,
            requestCancelled: false,
        }),
        true,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: new Error(
                "Creators API token response did not include access_token",
            ),
            catalogRequestStarted: false,
            catalogFailureObserved: false,
            requestCancelled: false,
        }),
        true,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: Object.assign(new Error("catalog call timed out"), {
                name: "TimeoutError",
            }),
            catalogRequestStarted: true,
            catalogFailureObserved: false,
            requestCancelled: false,
        }),
        true,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: Object.assign(new Error("shopper cancelled"), {
                name: "AbortError",
            }),
            catalogRequestStarted: true,
            catalogFailureObserved: false,
            requestCancelled: true,
        }),
        false,
    );
    assert.equal(
        shouldRecordCatalogFailure({
            error: Object.assign(new Error("retry deadline reached"), {
                name: "TimeoutError",
            }),
            catalogRequestStarted: true,
            catalogFailureObserved: true,
            requestCancelled: true,
        }),
        true,
    );
});

test("over-ear no-earbuds keeps unknown and blocks earbuds", () => {
    const overEar = evaluateListingConstraints({
        query: "over-ear headphones, no earbuds",
        title: "Aster Arc Over-Ear Headphones",
        features: ["Cushioned headband"],
    });
    assert.deepEqual(onlyDecision(overEar), {
        claim: "no earbuds",
        verdict: EvidenceVerdict.UNKNOWN,
        blocks: false,
    });
    assert.deepEqual(overEar.verifiedClaims, []);
    assert.deepEqual(overEar.unknownClaims, ["no earbuds"]);

    const earbuds = evaluateListingConstraints({
        query: "over-ear headphones, no earbuds",
        title: "Aster Pin In-Ear Earbuds Headphones",
        features: ["Compact in-ear design"],
    });
    assert.deepEqual(onlyDecision(earbuds), {
        claim: "no earbuds",
        verdict: EvidenceVerdict.FAIL,
        blocks: true,
    });
});

test("mouse traps no-poison has UNKNOWN FAIL and PASS evidence", () => {
    const silent = evaluateListingConstraints({
        query: "mouse traps, no poison",
        title: "Northstar Reusable Mouse Snap Trap",
        features: ["Mechanical trigger"],
    });
    assert.deepEqual(onlyDecision(silent), {
        claim: "no poison",
        verdict: EvidenceVerdict.UNKNOWN,
        blocks: false,
    });
    assert.deepEqual(silent.verifiedClaims, []);

    const poison = evaluateListingConstraints({
        query: "mouse traps, no poison",
        title: "Northstar Mouse Trap with Poison Bait",
        features: ["Contains rodenticide"],
    });
    assert.deepEqual(onlyDecision(poison), {
        claim: "no poison",
        verdict: EvidenceVerdict.FAIL,
        blocks: true,
    });

    const poisonFree = evaluateListingConstraints({
        query: "mouse traps, no poison",
        title: "Northstar Poison-Free Mouse Snap Trap",
        features: ["Mechanical trigger"],
    });
    assert.deepEqual(onlyDecision(poisonFree), {
        claim: "no poison",
        verdict: EvidenceVerdict.PASS,
        blocks: false,
    });
    assert.deepEqual(poisonFree.verifiedClaims, ["no poison"]);
    assert.deepEqual(poisonFree.unknownClaims, []);
});

test("camera no-hub-required is explicitly verified", () => {
    const camera = evaluateListingConstraints({
        query: "security camera that does not require a hub",
        title: "Luma Nest Indoor Security Camera",
        features: ["No hub required"],
    });
    assert.deepEqual(onlyDecision(camera), {
        claim: "no hub required",
        verdict: EvidenceVerdict.PASS,
        blocks: false,
    });
    assert.deepEqual(camera.verifiedClaims, ["no hub required"]);
});

test("PTFE absence stays strict and three-valued", () => {
    const ceramicOnly = evaluateListingConstraints({
        query: "ceramic nonstick pan without PTFE",
        title: "Ember Vale Ceramic Nonstick Pan",
        features: ["Ceramic cooking surface"],
    });
    assert.deepEqual(onlyDecision(ceramicOnly), {
        claim: "PTFE-free",
        verdict: EvidenceVerdict.UNKNOWN,
        blocks: true,
    });
    assert.deepEqual(ceramicOnly.verifiedClaims, []);
    assert.deepEqual(ceramicOnly.unknownClaims, ["PTFE-free"]);

    const explicitFree = evaluateListingConstraints({
        query: "ceramic nonstick pan without PTFE",
        title: "Ember Vale Ceramic Nonstick Pan",
        features: ["PTFE-free coating"],
    });
    assert.deepEqual(onlyDecision(explicitFree), {
        claim: "PTFE-free",
        verdict: EvidenceVerdict.PASS,
        blocks: false,
    });
    assert.deepEqual(explicitFree.verifiedClaims, ["PTFE-free"]);

    const explicitPtfe = evaluateListingConstraints({
        query: "ceramic nonstick pan without PTFE",
        title: "Ember Vale Ceramic Nonstick Pan",
        features: ["Contains a PTFE coating"],
    });
    assert.deepEqual(onlyDecision(explicitPtfe), {
        claim: "PTFE-free",
        verdict: EvidenceVerdict.FAIL,
        blocks: true,
    });
});

test("ASIN extraction rejects technical tokens and keeps explicit synthetic IDs", () => {
    assert.deepEqual(
        extractRequestedAsins("usb-c dock with usb3gen2x2 support"),
        [],
    );
    assert.deepEqual(
        extractRequestedAsins(
            "compare https://www.amazon.com/dp/B0FAKE0001?ref_=synthetic and ASIN: B0FAKE0002",
        ),
        ["B0FAKE0001", "B0FAKE0002"],
    );
});

test("new-condition intent ignores New Balance", () => {
    assert.equal(
        explicitlyRequiresNewCondition("New Balance running shoes"),
        false,
    );
    assert.equal(
        explicitlyRequiresNewCondition(
            "running shoes, new condition only, not refurbished",
        ),
        true,
    );
});

test("ordinary price ceilings are enforced without stealing spec numbers", () => {
    const strict = extractPriceCeiling("headphones under 100");
    assert.deepEqual(strict, { amount: 100, inclusive: false });
    assert.equal(fitsPriceCeiling("$99.99", strict), true);
    assert.equal(fitsPriceCeiling("$100.00", strict), false);

    const budget = extractPriceCeiling("headphones with a $100 budget");
    assert.deepEqual(budget, { amount: 100, inclusive: true });
    assert.equal(fitsPriceCeiling("$100.00", budget), true);
    assert.equal(fitsPriceCeiling("$100.01", budget), false);

    assert.equal(
        extractPriceCeiling("power bank under 10000 mAh with 20W charging"),
        null,
    );
    assert.equal(
        extractPriceCeiling("coffee pods under 100 count"),
        null,
    );
});

test("ordinary product identity rejects accessory-only decoys", () => {
    const cases = [
        {
            query: "burr coffee grinder under 100",
            product: "Northstar Coffee Grinder Cleaning Brush",
            real: "Northstar Conical Burr Coffee Grinder",
        },
        {
            query: "8 inch chef knife",
            product: "Northstar Knife Sharpener System",
            real: "Northstar 8 Inch Chef Knife",
        },
        {
            query: "electric standing desk",
            product: "Northstar Standing Desk Cable Tray",
            real: "Northstar Electric Standing Desk",
        },
        {
            query: "neutral running shoes",
            product: "Northstar Running Shoe Insoles",
            real: "Northstar Neutral Running Shoes",
        },
    ];
    for (const fixture of cases) {
        assert.equal(
            provesRequestedProductIdentity(fixture.query, fixture.product),
            false,
            fixture.product,
        );
        assert.equal(
            provesRequestedProductIdentity(fixture.query, fixture.real),
            true,
            fixture.real,
        );
    }
});

test("mouse pest specificity accepts rodent set and rejects roach-only", () => {
    assert.equal(
        violatesPestProductSpecificity(
            "mouse traps",
            "Northstar Snap Trap for Mice and Rats",
            ["Targets mice and rats"],
        ),
        false,
    );
    assert.equal(
        violatesPestProductSpecificity(
            "mouse traps",
            "Northstar Roach Trap",
            ["Targets roaches"],
        ),
        true,
    );
});

test("phrase collection tolerates transient failure but not all-fail or fatal", async () => {
    assert.equal(
        isFatalAmazonSearchError(
            Object.assign(new Error("synthetic request aborted"), {
                name: "AbortError",
            }),
        ),
        true,
    );
    assert.equal(
        isFatalAmazonSearchError(new Error("synthetic search deadline exceeded")),
        true,
    );
    const phraseTimeout = Object.assign(
        new Error("The operation was aborted due to timeout"),
        { name: "TimeoutError" },
    );
    assert.equal(isFatalAmazonSearchError(phraseTimeout), false);
    assert.equal(
        isFatalAmazonSearchError(new Error("synthetic authentication rejected")),
        true,
    );
    assert.equal(isFatalAmazonSearchError({ status: 401 }), true);
    assert.equal(isFatalAmazonSearchError({ response: { status: 403 } }), true);
    assert.equal(
        isFatalAmazonSearchError(new Error("AssociateNotEligible")),
        true,
    );
    assert.equal(
        isAmazonAccessUnavailableError(
            new Error("Amazon Creators API is not configured"),
        ),
        true,
    );
    assert.equal(
        isFatalAmazonSearchError(
            Object.assign(new Error("synthetic malformed request"), {
                status: 400,
            }),
        ),
        true,
    );
    assert.equal(
        isFatalAmazonSearchError(new Error("synthetic upstream 500")),
        false,
    );

    const transient = new Error("synthetic upstream 500");
    const sets = await collectSuccessfulPhraseSets(
        ["phrase one", "phrase two", "phrase three"],
        async (phrase) => {
            if (phrase === "phrase two") throw transient;
            return [`result from ${phrase}`];
        },
    );
    assert.deepEqual(sets, [
        ["result from phrase one"],
        ["result from phrase three"],
    ]);

    const timeoutSets = await collectSuccessfulPhraseSets(
        ["phrase one", "phrase two", "phrase three"],
        async (phrase) => {
            if (phrase === "phrase two") throw phraseTimeout;
            return [`result from ${phrase}`];
        },
    );
    assert.deepEqual(timeoutSets, [
        ["result from phrase one"],
        ["result from phrase three"],
    ]);

    await assert.rejects(
        collectSuccessfulPhraseSets(
            ["phrase one", "phrase two"],
            async () => {
                throw new Error("synthetic transient failure");
            },
        ),
        AggregateError,
    );

    const fatal = Object.assign(new Error("AssociateNotEligible"), {
        status: 403,
    });
    const calls = [];
    await assert.rejects(
        collectSuccessfulPhraseSets(
            ["phrase one", "phrase two", "phrase three"],
            async (phrase) => {
                calls.push(phrase);
                if (phrase === "phrase two") throw fatal;
                return [phrase];
            },
        ),
        (error) => error === fatal,
    );
    assert.deepEqual(calls, ["phrase one", "phrase two"]);
});

const failures = [];
try {
    for (const { name, run } of tests) {
        try {
            await run();
            console.log(`PASS ${name}`);
        } catch (error) {
            failures.push({ name, error });
            console.error(
                `FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
} finally {
    restoreFetch();
}

if (failures.length > 0) {
    console.error(
        `Synthetic search-core evaluation failed: ${failures.length}/${tests.length}`,
    );
    process.exitCode = 1;
} else {
    console.log(`Synthetic search-core evaluation passed: ${tests.length}/${tests.length}`);
}
