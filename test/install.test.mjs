import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { filterByPacks, loadContent } from '../src/content.mjs';
import { buildPlan } from '../src/plan.mjs';
import { applyPlan } from '../src/install.mjs';
import { removeInstall } from '../src/remove.mjs';
import { listFilesRecursive } from '../src/fs-utils.mjs';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const silent = () => {};

const makeRoot = () => mkdtemp(join(tmpdir(), 'agent-rules-'));

const install = async (root, harnesses, packs = ['core', 'qvac'], options = {}) => {
  const content = filterByPacks(await loadContent(PACKAGE_ROOT), packs);
  const plan = buildPlan({ content, harnessIds: harnesses, root, global: false });
  return applyPlan({ plan, root, packs, harnesses, dryRun: false, log: silent, confirm: async () => {}, ...options });
};

const snapshot = async (root) => {
  const files = await listFilesRecursive(root);
  const entries = await Promise.all(
    files.sort().map(async (file) => `${relative(root, file)}:${await readFile(file, 'utf8')}`),
  );
  return entries.join('\n');
};

const paths = async (root) => (await listFilesRecursive(root)).map((file) => relative(root, file)).sort();

test('a Claude Code install writes only Claude paths', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await install(root, ['claude-code']);
  const files = await paths(root);
  assert.ok(files.includes('.claude/rules/core/coding-standards.md'));
  assert.ok(files.includes('.claude/skills/pr-review/SKILL.md'));
  assert.equal(files.includes('AGENTS.md'), false);
  assert.equal(files.some((file) => file.startsWith('.cursor/')), false);
});

test('a Cursor install writes .mdc rules that Cursor can parse', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await install(root, ['cursor']);
  const rule = await readFile(join(root, '.cursor/rules/qvac/qvac-monorepo.mdc'), 'utf8');
  assert.match(rule, /^---\ndescription: /);
  assert.match(rule, /globs: "\*\*\/qvac\/\*\*"/);
  assert.match(rule, /alwaysApply: false/);
});

test('harnesses that share a directory are written once', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await install(root, ['codex', 'opencode', 'droid', 'pi']);
  assert.deepEqual(result.blocks, [join(root, 'AGENTS.md')]);
  const files = await paths(root);
  assert.equal(files.filter((file) => file.endsWith('skills/pr-review/SKILL.md')).length, 1);
  assert.ok(files.includes('.agents/rules/core/working-style.md'));
});

test('an existing AGENTS.md keeps its content and the install is idempotent', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'AGENTS.md'), '# Mine\n\nkeep me\n');
  await install(root, ['codex']);
  const first = await snapshot(root);
  await install(root, ['codex']);
  assert.equal(await snapshot(root), first);
  assert.match(await readFile(join(root, 'AGENTS.md'), 'utf8'), /keep me/);
});

test('consent is requested once before touching a memory file we did not create', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'AGENTS.md'), '# Mine\n');
  const asked = [];
  await install(root, ['codex', 'droid'], ['core'], { confirm: async (path) => asked.push(path) });
  assert.deepEqual(asked, [join(root, 'AGENTS.md')]);
});

test('no consent is requested for a memory file that already holds our block', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await install(root, ['codex'], ['core']);
  const asked = [];
  await install(root, ['codex'], ['core'], { confirm: async (path) => asked.push(path) });
  assert.deepEqual(asked, []);
});

test('narrowing the packs removes the files the dropped pack owned', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await install(root, ['claude-code'], ['core', 'qvac']);
  assert.equal(existsSync(join(root, '.claude/rules/qvac/qvac-monorepo.md')), true);
  await install(root, ['claude-code'], ['core']);
  assert.equal(existsSync(join(root, '.claude/rules/qvac/qvac-monorepo.md')), false);
  assert.equal(existsSync(join(root, '.claude/rules/core/coding-standards.md')), true);
});

test('remove restores the tree it found', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'src/keep.txt'), 'mine\n');
  await writeFile(join(root, 'AGENTS.md'), '# Mine\n\nkeep me\n');
  const before = await snapshot(root);
  await install(root, ['claude-code', 'codex']);
  await removeInstall({ root, dryRun: false, log: silent });
  assert.equal(await snapshot(root), before);
});

test('remove keeps a rule the user edited after installing', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await install(root, ['claude-code'], ['core']);
  const edited = join(root, '.claude/rules/core/coding-standards.md');
  await writeFile(edited, 'my own version\n');
  await removeInstall({ root, dryRun: false, log: silent });
  assert.equal(await readFile(edited, 'utf8'), 'my own version\n');
});

test('a dry run writes nothing', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await install(root, ['claude-code'], ['core'], { dryRun: true });
  assert.deepEqual(await paths(root), []);
});

test('the CLI installs from the command line', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await run(process.execPath, [join(PACKAGE_ROOT, 'bin/cli.mjs'), 'add', '--root', root, '--agent', 'cursor', '--pack', 'core', '--yes']);
  assert.equal(existsSync(join(root, '.cursor/rules/core/coding-standards.mdc')), true);
  const listed = await run(process.execPath, [join(PACKAGE_ROOT, 'bin/cli.mjs'), 'list', '--root', root]);
  assert.match(listed.stdout, /Harnesses: cursor/);
});

test('the CLI rejects an unknown harness', async (t) => {
  const root = await makeRoot();
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(
    run(process.execPath, [join(PACKAGE_ROOT, 'bin/cli.mjs'), 'add', '--root', root, '--agent', 'nope', '--yes']),
    /Unknown harness/,
  );
});
