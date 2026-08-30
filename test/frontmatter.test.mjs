import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, withFrontmatter } from '../src/frontmatter.mjs';

test('returns the whole text as body when there is no frontmatter', () => {
  const { data, body } = parseFrontmatter('# Title\n\ntext\n');
  assert.deepEqual(data, {});
  assert.equal(body, '# Title\n\ntext\n');
});

test('parses scalars, booleans and quoted values', () => {
  const { data, body } = parseFrontmatter('---\nname: rule\ndescription: "a, b"\nalwaysApply: true\n---\n\n# Body\n');
  assert.deepEqual(data, { name: 'rule', description: 'a, b', alwaysApply: true });
  assert.equal(body, '# Body\n');
});

test('parses list values', () => {
  const { data } = parseFrontmatter('---\npaths:\n  - "src/**"\n  - "lib/**"\n---\n\nbody\n');
  assert.deepEqual(data.paths, ['src/**', 'lib/**']);
});

test('round-trips data through serialization', () => {
  const data = { name: 'x', description: 'has, comma', globs: '**/a/**', alwaysApply: false };
  const parsed = parseFrontmatter(withFrontmatter(data, '# Body\n\ntext'));
  assert.deepEqual(parsed.data, data);
  assert.equal(parsed.body, '# Body\n\ntext\n');
});

test('omits undefined fields', () => {
  const text = withFrontmatter({ name: 'x', globs: undefined }, 'body');
  assert.equal(text.includes('globs'), false);
});

test('ignores a frontmatter block that is never closed', () => {
  const text = '---\nname: x\n\n# Body\n';
  assert.deepEqual(parseFrontmatter(text), { data: {}, body: text });
});
