const assert = require('node:assert/strict');
const { test } = require('node:test');
const { sortableTransition } = require('../src/components/motion/sortableTransition.ts');

test('sortable transitions retain dnd timing and stop for direct dragging/reduced motion', () => {
    assert.equal(sortableTransition('transform 200ms ease', false).duration, 0.2);
    assert.equal(sortableTransition(undefined, false).duration, 0);
    assert.equal(sortableTransition('transform 200ms ease', true).duration, 0);
});
