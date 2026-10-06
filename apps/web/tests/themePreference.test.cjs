const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { resolveThemePreference, readThemePreference } = require("../src/utils/themePreference.ts");

test("preserves supported modes regardless of the system preference", () => {
    assert.equal(resolveThemePreference("light", true), "light");
    assert.equal(resolveThemePreference("dark", false), "dark");
});

test("migrates removed themes to the corresponding supported mode", () => {
    assert.equal(resolveThemePreference("pink", true), "light");
    for (const saved of ["charcoal", "neon", "orange", "space"]) {
        assert.equal(resolveThemePreference(saved, false), "dark");
    }
});

test("missing or invalid preferences follow the system mode", () => {
    for (const saved of [null, "", "unknown", "{broken}"]) {
        assert.equal(resolveThemePreference(saved, true), "dark");
        assert.equal(resolveThemePreference(saved, false), "light");
    }
});

test("restricted storage falls back to the system mode without throwing", () => {
    const oldWindow = globalThis.window;
    const oldStorage = globalThis.localStorage;
    try {
        globalThis.window = { matchMedia: () => ({ matches: true }) };
        globalThis.localStorage = { getItem() { throw new Error("Storage blocked"); } };
        assert.equal(readThemePreference(), "dark");
    } finally {
        globalThis.window = oldWindow;
        globalThis.localStorage = oldStorage;
    }
});

function luminance(hex) {
    const channels = hex.slice(1).match(/../g).map(value => {
        const channel = parseInt(value, 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + 0.05) / (values[1] + 0.05);
}

const css = readFileSync(require.resolve("../src/styles/base.css"), "utf8");
for (const mode of ["light", "dark"]) {
    test(`${mode} palette keeps readable text and visible control boundaries`, () => {
        const block = css.match(new RegExp(`:root\\[data-theme="${mode}"\\] \\{([^}]+)`))[1];
        const palette = Object.fromEntries([...css.matchAll(/--([\w-]+): (#[\da-fA-F]{6});/g)].map(match => [match[1], match[2]]));
        const tokens = Object.fromEntries([...block.matchAll(/--color-([\w-]+): ([^;]+);/g)].map(match => {
            const reference = match[2].match(/^var\(--([\w-]+)\)$/);
            return [match[1], reference ? palette[reference[1]] : match[2]];
        }));
        for (const surface of ["background", "surface", "surface-light", "primary-soft", "accent-soft", "danger-soft"]) {
            for (const text of ["text", "text-soft", "text-muted"]) {
                assert(contrast(tokens[text], tokens[surface]) >= 4.5, `${text} on ${surface}`);
            }
        }
        for (const action of ["primary", "danger", "accent", "success"]) {
            assert(contrast(tokens[`on-${action}`], tokens[action]) >= 4.5, `${action} button`);
            assert(contrast(tokens[`on-${action}`], tokens[`${action}-hover`]) >= 4.5, `${action} hover`);
            assert(contrast(tokens[`${action}-text`], tokens[`${action}-soft`]) >= 4.5, `${action} text`);
        }
        assert(contrast(tokens["muscle-primary-text"], tokens["dummy-muscle-primary"]) >= 4.5, "primary muscle label");
        assert(contrast(tokens["muscle-secondary-text"], tokens["dummy-muscle-secondary"]) >= 4.5, "secondary muscle label");
        assert(contrast(tokens["warning-text"], tokens["warning-soft"]) >= 4.5, "warning text");
        assert(luminance(tokens["dummy-muscle-primary"]) > luminance(tokens["dummy-muscle-secondary"]), "primary muscle red is lighter");
        assert(contrast(tokens["input-border"], tokens["surface-light"]) >= 3, "input border");
        assert(contrast(tokens.focus, tokens.surface) >= 3, "focus indicator");
    });
}
