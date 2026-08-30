import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { HARNESS_IDS, getHarness } from './harnesses.mjs';

const pathEntries = () => (process.env.PATH || '').split(delimiter).filter(Boolean);

const isOnPath = (command) => pathEntries().some((dir) => existsSync(join(dir, command)));

const hasProjectMarker = (harness, root) => harness.projectMarkers.some((marker) => existsSync(join(root, marker)));

const hasHomeMarker = (harness) => harness.homeMarkers.some((marker) => existsSync(marker));

export const detectHarness = (id, root) => {
  const harness = getHarness(id);
  return hasProjectMarker(harness, root) || hasHomeMarker(harness) || isOnPath(harness.command);
};

export const detectHarnesses = (root) => HARNESS_IDS.filter((id) => detectHarness(id, root));
