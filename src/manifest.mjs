import { createHash } from 'node:crypto';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

export const MANIFEST_NAME = '.agent-rules.json';
const MANIFEST_VERSION = 1;
const ENCODING = 'utf8';

export const hashText = (text) => createHash('sha256').update(text).digest('hex');

export const manifestPath = (root) => join(root, MANIFEST_NAME);

export const readManifest = async (root) => {
  try {
    return JSON.parse(await readFile(manifestPath(root), ENCODING));
  } catch {
    return null;
  }
};

const toRelative = (root, path) => relative(root, path);

export const writeManifest = async (root, { packs, harnesses, files, blocks }) => {
  const manifest = {
    version: MANIFEST_VERSION,
    packs,
    harnesses,
    files: files.map(({ path, hash }) => ({ path: toRelative(root, path), hash })).sort((a, b) => a.path.localeCompare(b.path)),
    blocks: blocks.map((path) => toRelative(root, path)).sort(),
  };
  await writeFile(manifestPath(root), `${JSON.stringify(manifest, null, 2)}\n`, ENCODING);
  return manifest;
};

export const removeManifest = (root) => rm(manifestPath(root), { force: true });

export const resolveManifestPaths = (root, manifest) => ({
  files: (manifest.files || []).map((entry) => ({ path: resolve(root, entry.path), hash: entry.hash })),
  blocks: (manifest.blocks || []).map((path) => resolve(root, path)),
});

export const parentDirectories = (paths) => [...new Set(paths.map((path) => dirname(path)))];
