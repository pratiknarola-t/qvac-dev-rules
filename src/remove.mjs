import { relative } from 'node:path';
import { deleteFile, pruneEmptyDirs, readTextOrEmpty, writeText } from './fs-utils.mjs';
import { hashText, parentDirectories, readManifest, removeManifest, resolveManifestPaths } from './manifest.mjs';
import { removeBlock } from './managed-block.mjs';

const removeFile = async (entry, { root, dryRun, log }) => {
  const current = await readTextOrEmpty(entry.path);
  if (current !== '' && hashText(current) !== entry.hash) {
    log(`kept (modified locally): ${relative(root, entry.path)}`);
    return false;
  }
  log(`remove ${relative(root, entry.path)}`);
  if (!dryRun) await deleteFile(entry.path);
  return true;
};

const removeFiles = async (files, options) => {
  const removed = [];
  await files.reduce(async (chain, entry) => {
    await chain;
    if (await removeFile(entry, options)) removed.push(entry.path);
  }, Promise.resolve());
  return removed;
};

const clearBlock = async (path, { root, dryRun, log }) => {
  const existing = await readTextOrEmpty(path);
  const stripped = removeBlock(existing);
  log(`unblock ${relative(root, path)}`);
  if (dryRun) return;
  if (stripped.trim() === '') {
    await deleteFile(path);
    return;
  }
  await writeText(path, stripped.endsWith('\n') ? stripped : `${stripped}\n`);
};

const clearBlocks = (blocks, options) =>
  blocks.reduce(async (chain, path) => {
    await chain;
    await clearBlock(path, options);
  }, Promise.resolve());

export const removeInstall = async ({ root, dryRun, log }) => {
  const manifest = await readManifest(root);
  if (!manifest) return { removed: 0, found: false };
  const { files, blocks } = resolveManifestPaths(root, manifest);
  const removed = await removeFiles(files, { root, dryRun, log });
  await clearBlocks(blocks, { root, dryRun, log });
  if (!dryRun) {
    await pruneEmptyDirs(parentDirectories(removed), root);
    await removeManifest(root);
  }
  return { removed: removed.length, found: true, manifest };
};
