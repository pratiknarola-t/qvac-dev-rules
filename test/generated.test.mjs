import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterByPacks, loadContent } from '../src/content.mjs';
import { buildPlan } from '../src/plan.mjs';
import { applyPlan } from '../src/install.mjs';
import { listFilesRecursive } from '../src/fs-utils.mjs';
import { MANIFEST_NAME } from '../src/manifest.mjs';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_HARNESSES = ['claude-code', 'cursor', 'codex'];
const GENERATED_DIRS = ['.claude/rules', '.claude/skills', '.cursor/rules', '.agents'];

const generate = async (root) => {
  const content = filterByPacks(await loadContent(PACKAGE_ROOT), ['core', 'qvac']);
  const plan = buildPlan({ content, harnessIds: GENERATED_HARNESSES, root, global: false });
  await applyPlan({
    plan,
    root,
    packs: ['core', 'qvac'],
    harnesses: GENERATED_HARNESSES,
    dryRun: false,
    log: () => {},
    confirm: async () => {},
  });
};

const relativeFiles = async (root, dir) => {
  try {
    const files = await listFilesRecursive(join(root, dir));
    return files.map((file) => relative(root, file)).sort();
  } catch {
    return [];
  }
};

const committedFiles = async () => {
  const groups = await Promise.all(GENERATED_DIRS.map((dir) => relativeFiles(PACKAGE_ROOT, dir)));
  return [...groups.flat(), 'AGENTS.md'].sort();
};

test('the committed harness files match what the generator produces', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'agent-rules-generated-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await generate(root);
  const generated = (await listFilesRecursive(root))
    .map((file) => relative(root, file))
    .filter((file) => file !== MANIFEST_NAME)
    .sort();
  assert.deepEqual(generated, await committedFiles(), 'run `npm run generate` to refresh the committed output');
  await Promise.all(
    generated.map(async (file) => {
      const expected = await readFile(join(root, file), 'utf8');
      const actual = await readFile(join(PACKAGE_ROOT, file), 'utf8');
      assert.equal(actual, expected, `${file} is stale — run \`npm run generate\``);
    }),
  );
});
