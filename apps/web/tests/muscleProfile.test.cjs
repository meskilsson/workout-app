const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mapMusclesToBodyHighlighterData } = require("../src/utils/muscleProfile.ts");

test("distinguishes primary, secondary and untargeted muscles", () => {
    const parts = mapMusclesToBodyHighlighterData(["Chest"], ["triceps"]);
    assert.equal(parts.find(part => part.slug === "chest").intensity, 2);
    assert.equal(parts.find(part => part.slug === "triceps").intensity, 1);
    assert.equal(parts.find(part => part.slug === "quadriceps").intensity, 3);
});

test("primary takes precedence, normalizes names and produces unique body parts", () => {
    const parts = mapMusclesToBodyHighlighterData([" back ", "BACK"], ["back", "biceps"]);
    assert.equal(parts.find(part => part.slug === "upper-back").intensity, 2);
    assert.equal(parts.find(part => part.slug === "lower-back").intensity, 2);
    assert.equal(new Set(parts.map(part => part.slug)).size, parts.length);
});

test("unknown names do not accidentally highlight unrelated muscles", () => {
    assert(mapMusclesToBodyHighlighterData(["unknown"], []).every(part => part.intensity === 3));
});
