import test from 'node:test';
import assert from 'node:assert/strict';
import { hasBlock, removeBlock, upsertBlock, wrapBlock } from '../src/managed-block.mjs';

const block = wrapBlock('managed body');
const other = wrapBlock('new body');

test('inserts into an empty file', () => {
  const result = upsertBlock('', block);
  assert.equal(hasBlock(result), true);
  assert.match(result, /managed body/);
});

test('appends without touching existing content', () => {
  const result = upsertBlock('# Mine\n\nkeep me\n', block);
  assert.match(result, /^# Mine\n\nkeep me\n\n<!-- BEGIN agent-rules -->/);
});

test('replaces only the managed block on a second write', () => {
  const first = upsertBlock('# Mine\n\nkeep me\n', block);
  const second = upsertBlock(first, other);
  assert.match(second, /keep me/);
  assert.match(second, /new body/);
  assert.equal(second.includes('managed body'), false);
  assert.equal(second.match(/BEGIN agent-rules/g).length, 1);
});

test('preserves content written after the block', () => {
  const withTail = `${upsertBlock('', block).trimEnd()}\n\n# Tail\n`;
  const replaced = upsertBlock(withTail, other);
  assert.match(replaced, /# Tail/);
  assert.match(replaced, /new body/);
});

test('removing the block leaves the surrounding content', () => {
  const result = removeBlock(upsertBlock('# Mine\n\nkeep me\n', block));
  assert.equal(hasBlock(result), false);
  assert.equal(result.trim(), '# Mine\n\nkeep me'.trim());
});

test('removing is a no-op when no block is present', () => {
  assert.equal(removeBlock('# Mine\n'), '# Mine\n');
});
