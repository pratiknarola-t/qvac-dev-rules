import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { filterByPacks, loadContent } from './content.mjs';
import { detectHarnesses } from './detect.mjs';
import { HARNESS_IDS, getHarness } from './harnesses.mjs';
import { buildPlan } from './plan.mjs';
import { applyPlan } from './install.mjs';
import { removeInstall } from './remove.mjs';
import { readManifest } from './manifest.mjs';
import { askConfirm, askMultiSelect, isInteractive } from './prompt.mjs';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMMANDS = ['add', 'list', 'remove'];
const LIST_SEPARATOR = ',';

const OPTIONS = {
  agent: { type: 'string', short: 'a', multiple: true },
  pack: { type: 'string', short: 'p', multiple: true },
  global: { type: 'boolean', short: 'g', default: false },
  root: { type: 'string' },
  'dry-run': { type: 'boolean', default: false },
  yes: { type: 'boolean', short: 'y', default: false },
  help: { type: 'boolean', short: 'h', default: false },
  version: { type: 'boolean', default: false },
};

const USAGE = `agent-rules — install shared coding rules and skills into your AI coding harness

Usage:
  agent-rules add [options]     install rules and skills
  agent-rules list              show what is installed here
  agent-rules remove            undo a previous install

Options:
  -a, --agent <ids>   comma-separated harnesses (${HARNESS_IDS.join(', ')})
  -p, --pack <ids>    comma-separated packs to install
  -g, --global        install for your user instead of this project
      --root <dir>    target directory (default: current directory)
      --dry-run       show the file plan without writing
  -y, --yes           accept defaults, never prompt
  -h, --help          show this help
      --version       show the version`;

const splitList = (values) =>
  (values || []).flatMap((value) => value.split(LIST_SEPARATOR)).map((value) => value.trim()).filter(Boolean);

const targetRoot = (values) => {
  if (values.root) return resolve(values.root);
  return values.global ? homedir() : process.cwd();
};

const validateHarnesses = (ids) => {
  ids.forEach(getHarness);
  return ids;
};

const validatePacks = (requested, available) => {
  const unknown = requested.filter((pack) => !available.includes(pack));
  if (unknown.length > 0) throw new Error(`Unknown pack(s): ${unknown.join(', ')}. Available: ${available.join(', ')}`);
  return requested;
};

const harnessOptions = () => HARNESS_IDS.map((id) => ({ id, label: getHarness(id).label }));

const chooseHarnesses = async (values, root) => {
  const requested = splitList(values.agent);
  if (requested.length > 0) return validateHarnesses(requested);
  const detected = detectHarnesses(root);
  if (detected.length === 0) throw new Error('No harness detected. Pass --agent to choose one explicitly.');
  if (values.yes || !isInteractive()) return detected;
  return askMultiSelect({ question: 'Install for which harnesses?', options: harnessOptions(), preselected: detected });
};

const choosePacks = async (values, available) => {
  const requested = splitList(values.pack);
  if (requested.length > 0) return validatePacks(requested, available);
  if (values.yes || !isInteractive()) return available;
  return askMultiSelect({
    question: 'Install which rule packs?',
    options: available.map((pack) => ({ id: pack, label: pack })),
    preselected: available,
  });
};

const confirmBlockEdit = (values) => async (path) => {
  if (values.yes || !isInteractive()) return;
  const accepted = await askConfirm(`Append a managed agent-rules block to ${path}?`);
  if (!accepted) throw new Error('Aborted: nothing was written.');
};

const runAdd = async (values, log) => {
  const root = targetRoot(values);
  const content = await loadContent(PACKAGE_ROOT);
  const harnesses = await chooseHarnesses(values, root);
  const packs = await choosePacks(values, content.packs);
  const selected = filterByPacks(content, packs);
  const plan = buildPlan({ content: selected, harnessIds: harnesses, root, global: values.global });
  const result = await applyPlan({
    plan,
    root,
    packs,
    harnesses,
    dryRun: values['dry-run'],
    log,
    confirm: confirmBlockEdit(values),
  });
  const verb = values['dry-run'] ? 'Planned' : 'Installed';
  log(`\n${verb} ${result.files.length} files for ${harnesses.join(', ')} (packs: ${packs.join(', ')}) in ${root}`);
};

const runList = async (values, log) => {
  const root = targetRoot(values);
  const manifest = await readManifest(root);
  if (!manifest) {
    log(`No agent-rules install found in ${root}`);
    return;
  }
  log(`Harnesses: ${manifest.harnesses.join(', ')}`);
  log(`Packs: ${manifest.packs.join(', ')}`);
  log(`Files: ${manifest.files.length}`);
  manifest.files.forEach((file) => log(`  ${file.path}`));
  manifest.blocks.forEach((block) => log(`  ${block} (managed block)`));
};

const runRemove = async (values, log) => {
  const root = targetRoot(values);
  const result = await removeInstall({ root, dryRun: values['dry-run'], log });
  if (!result.found) {
    log(`No agent-rules install found in ${root}`);
    return;
  }
  log(`\nRemoved ${result.removed} files from ${root}`);
};

const RUNNERS = { add: runAdd, list: runList, remove: runRemove };

const readVersion = async () => {
  const manifest = JSON.parse(await readFile(resolve(PACKAGE_ROOT, 'package.json'), 'utf8'));
  return manifest.version;
};

export const run = async (argv, log = console.log) => {
  const { values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  if (values.version) {
    log(await readVersion());
    return;
  }
  const command = positionals[0] || 'add';
  if (values.help || !COMMANDS.includes(command)) {
    log(USAGE);
    return;
  }
  await RUNNERS[command](values, log);
};
