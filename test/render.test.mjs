import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../src/frontmatter.mjs';
import { renderAgentsBody, renderClaudeRule, renderCursorRule, triggerOf } from '../src/render.mjs';

const always = { name: 'a', description: 'always on', globs: [], alwaysApply: true, pack: 'core', body: '# A\n\nalways body' };
const scoped = { name: 'b', description: 'scoped', globs: ['**/x/**', '**/y/**'], alwaysApply: false, pack: 'qvac', body: '# B\n\nscoped body' };
const onDemand = { name: 'c', description: 'on demand', globs: [], alwaysApply: false, pack: 'core', body: '# C\n\nengine body' };

test('classifies each rule by how it should trigger', () => {
  assert.equal(triggerOf(always), 'always');
  assert.equal(triggerOf(scoped), 'scoped');
  assert.equal(triggerOf(onDemand), 'on-demand');
});

test('a Cursor always-on rule sets alwaysApply and omits globs', () => {
  const { data } = parseFrontmatter(renderCursorRule(always));
  assert.equal(data.alwaysApply, true);
  assert.equal(data.globs, undefined);
});

test('a Cursor scoped rule joins globs with commas and does not always apply', () => {
  const { data } = parseFrontmatter(renderCursorRule(scoped));
  assert.equal(data.globs, '**/x/**,**/y/**');
  assert.equal(data.alwaysApply, false);
  assert.equal(data.description, 'scoped');
});

test('a Claude scoped rule uses a paths list', () => {
  const { data, body } = parseFrontmatter(renderClaudeRule(scoped));
  assert.deepEqual(data.paths, ['**/x/**', '**/y/**']);
  assert.match(body, /scoped body/);
});

test('a Claude always-on rule carries no frontmatter, so it loads at launch', () => {
  const rendered = renderClaudeRule(always);
  assert.equal(rendered.startsWith('---'), false);
  assert.deepEqual(parseFrontmatter(rendered).data, {});
});

test('the AGENTS body inlines always-on rules and links the rest', () => {
  const body = renderAgentsBody([always, scoped, onDemand], (rule) => `.agents/rules/${rule.pack}/${rule.name}.md`);
  assert.match(body, /always body/);
  assert.equal(body.includes('scoped body'), false);
  assert.match(body, /\| `\*\*\/x\/\*\*`, `\*\*\/y\/\*\*` \| `\.agents\/rules\/qvac\/b\.md` \|/);
  assert.match(body, /\| on demand \| `\.agents\/rules\/core\/c\.md` \|/);
});

test('the AGENTS body omits the table when every rule is always-on', () => {
  const body = renderAgentsBody([always], () => 'unused');
  assert.equal(body.includes('Read first'), false);
});
