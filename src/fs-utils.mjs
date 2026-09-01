import { access, mkdir, readdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ENCODING = 'utf8';

export const ensureDir = (path) => mkdir(path, { recursive: true });

export const readTextOrEmpty = async (path) => {
  try {
    return await readFile(path, ENCODING);
  } catch {
    return '';
  }
};

export const fileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const writeText = async (path, contents) => {
  await ensureDir(dirname(path));
  await writeFile(path, contents, ENCODING);
};

export const deleteFile = (path) => rm(path, { force: true });

const collectEntries = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? collectEntries(path) : [path];
    }),
  );
  return nested.flat();
};

export const listFilesRecursive = (dir) => collectEntries(dir);

export const pruneEmptyDirs = async (dirs, stopAt) => {
  const sorted = [...new Set(dirs)].sort((a, b) => b.length - a.length);
  await sorted.reduce(async (previous, dir) => {
    await previous;
    await pruneUpwards(dir, stopAt);
  }, Promise.resolve());
};

const pruneUpwards = async (dir, stopAt) => {
  let current = dir;
  while (current.startsWith(stopAt) && current !== stopAt) {
    try {
      await rmdir(current);
    } catch {
      return;
    }
    current = dirname(current);
  }
};
