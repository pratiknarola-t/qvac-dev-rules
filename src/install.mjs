import { relative } from 'node:path';
import { deleteFile, fileExists, listFilesRecursive, readTextOrEmpty, writeText } from './fs-utils.mjs';
import { hashText, readManifest, resolveManifestPaths, writeManifest } from './manifest.mjs';
import { hasBlock, upsertBlock } from './managed-block.mjs';

const readSkillFiles = async (action) => {
  const sources = await listFilesRecursive(action.source);
  return Promise.all(
    sources.map(async (source) => ({
      path: `${action.path}/${relative(action.source, source)}`,
      contents: await readTextOrEmpty(source),
    })),
  );
};

const expandAction = async (action) => {
  if (action.kind === 'skill') return readSkillFiles(action);
  if (action.kind === 'file') return [{ path: action.path, contents: action.contents }];
  return [];
};

export const expandPlan = async (plan) => {
  const groups = await Promise.all(plan.map(expandAction));
  return groups.flat();
};

const needsConsent = async (path) => {
  if (!(await fileExists(path))) return false;
  return !hasBlock(await readTextOrEmpty(path));
};

const applyBlock = async (action, dryRun) => {
  const existing = await readTextOrEmpty(action.path);
  const updated = upsertBlock(existing, action.block);
  if (!dryRun) await writeText(action.path, updated.endsWith('\n') ? updated : `${updated}\n`);
  return action.path;
};

const staleEntries = (previous, keptPaths) => previous.filter((entry) => !keptPaths.has(entry.path));

const removeStale = async ({ root, keptPaths, dryRun, log }) => {
  const previous = await readManifest(root);
  if (!previous) return;
  const { files } = resolveManifestPaths(root, previous);
  const stale = staleEntries(files, keptPaths);
  await stale.reduce(async (chain, entry) => {
    await chain;
    await removeStaleFile(entry, dryRun, log, root);
  }, Promise.resolve());
};

const removeStaleFile = async (entry, dryRun, log, root) => {
  const current = await readTextOrEmpty(entry.path);
  if (current !== '' && hashText(current) !== entry.hash) {
    log(`kept (modified locally): ${relative(root, entry.path)}`);
    return;
  }
  log(`remove ${relative(root, entry.path)}`);
  if (!dryRun) await deleteFile(entry.path);
};

export const applyPlan = async ({ plan, root, packs, harnesses, dryRun, log, confirm }) => {
  const files = await expandPlan(plan);
  const blocks = plan.filter((action) => action.kind === 'block');
  await confirmBlocks(blocks, confirm);
  await writeFiles(files, dryRun, log, root);
  const writtenBlocks = await writeBlocks(blocks, dryRun, log, root);
  const written = files.map(({ path, contents }) => ({ path, hash: hashText(contents) }));
  await removeStale({ root, keptPaths: new Set(written.map((entry) => entry.path)), dryRun, log });
  if (dryRun) return { files: written, blocks: writtenBlocks };
  await writeManifest(root, { packs, harnesses, files: written, blocks: writtenBlocks });
  return { files: written, blocks: writtenBlocks };
};

const confirmBlocks = async (blocks, confirm) => {
  await blocks.reduce(async (chain, block) => {
    await chain;
    if (!(await needsConsent(block.path))) return;
    await confirm(block.path);
  }, Promise.resolve());
};

const writeFiles = async (files, dryRun, log, root) => {
  await files.reduce(async (chain, file) => {
    await chain;
    log(`write  ${relative(root, file.path)}`);
    if (!dryRun) await writeText(file.path, file.contents);
  }, Promise.resolve());
};

const writeBlocks = async (blocks, dryRun, log, root) => {
  const written = [];
  await blocks.reduce(async (chain, block) => {
    await chain;
    log(`block  ${relative(root, block.path)}`);
    written.push(await applyBlock(block, dryRun));
  }, Promise.resolve());
  return written;
};
