import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterByPacks, loadContent } from '../src/content.mjs';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('loads every pack, rule and skill from the package', async () => {
  const content = await loadContent(PACKAGE_ROOT);
  assert.deepEqual(content.packs, ['core', 'qvac']);
  assert.deepEqual(content.rules.map((rule) => rule.name).sort(), [
    'coding-standards',
    'pr-review-core',
    'qvac-monorepo',
    'qvac-packages',
    'qvac-registry-vcpkg',
    'qvac-whisper-cpp',
    'working-style',
  ]);
  assert.deepEqual(content.skills.map((skill) => skill.name), ['pr-review', 'pr-self-review']);
});

test('every rule carries a name and a description', async () => {
  const content = await loadContent(PACKAGE_ROOT);
  content.rules.forEach((rule) => {
    assert.ok(rule.name, 'rule is missing a name');
    assert.ok(rule.description, `${rule.name} is missing a description`);
  });
});

test('a skill name matches its directory, as Cursor and OpenCode require', async () => {
  const content = await loadContent(PACKAGE_ROOT);
  content.skills.forEach((skill) => {
    assert.equal(skill.dir.endsWith(`/${skill.name}`), true, `${skill.name} does not match its folder`);
  });
});

test('filtering to one pack drops the other pack', async () => {
  const content = await loadContent(PACKAGE_ROOT);
  const core = filterByPacks(content, ['core']);
  assert.equal(core.rules.every((rule) => rule.pack === 'core'), true);
  assert.equal(core.rules.length, 3);
  assert.equal(core.skills.length, 2);
});

test('rules and skills stay free of harness-specific paths', async () => {
  const content = await loadContent(PACKAGE_ROOT);
  content.rules.forEach((rule) => {
    assert.equal(/\.claude\/|\.cursor\/|CLAUDE\.md/.test(rule.body), false, `${rule.name} names a specific harness`);
  });
});
