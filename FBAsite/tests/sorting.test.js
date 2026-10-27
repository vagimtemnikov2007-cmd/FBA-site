import assert from "node:assert/strict";
import { test } from "node:test";
import { sortAnimations, SORT_TYPES } from "../src/service/SortAnimations.js";

test("popularity follows server ranks, preserves source data and falls back for old cached cards", () => {
    const cards = [
        { id: "new", name: "Zulu", popularity_rank: 3, created_at: "2026-10-27" },
        { id: "old", name: "Bravo", popularity_rank: 1, created_at: "2026-09-01" },
        { id: "middle", name: "Alpha", popularity_rank: 2, created_at: "2026-10-01" },
        { id: "cached-old", name: "Old cache", created_at: "2026-08-01" },
        { id: "cached-new", name: "New cache", created_at: "2026-10-26" },
    ];
    const before = JSON.stringify(cards);
    assert.deepEqual(sortAnimations(cards, SORT_TYPES.POPULAR).map(card => card.id),
        ["old", "middle", "new", "cached-new", "cached-old"]);
    assert.equal(JSON.stringify(cards), before);
    assert.equal(sortAnimations(cards, SORT_TYPES.NEWEST)[0].id, "new");
    assert.equal(sortAnimations(cards, SORT_TYPES.NAME)[0].id, "middle");
});
