import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || join(HOME, '.config');
const OPENCODE_HOME = join(XDG_CONFIG_HOME, 'opencode');
const SHARED_SKILLS = '.agents/skills';
const SHARED_GLOBAL_SKILLS = join(HOME, '.agents/skills');
const SHARED_RULES = '.agents/rules';
const AGENTS_FILE = 'AGENTS.md';

export const RULE_FORMAT = { CLAUDE: 'claude', CURSOR: 'cursor', AGENTS: 'agents' };

export const HARNESSES = {
  'claude-code': {
    label: 'Claude Code',
    ruleFormat: RULE_FORMAT.CLAUDE,
    command: 'claude',
    projectMarkers: ['.claude', 'CLAUDE.md'],
    homeMarkers: [join(HOME, '.claude')],
    project: { rulesDir: '.claude/rules', skillsDir: '.claude/skills', memoryFile: null },
    global: { rulesDir: join(HOME, '.claude/rules'), skillsDir: join(HOME, '.claude/skills'), memoryFile: null },
  },
  cursor: {
    label: 'Cursor',
    ruleFormat: RULE_FORMAT.CURSOR,
    command: 'cursor-agent',
    projectMarkers: ['.cursor'],
    homeMarkers: [join(HOME, '.cursor')],
    project: { rulesDir: '.cursor/rules', skillsDir: SHARED_SKILLS, memoryFile: null },
    global: { rulesDir: join(HOME, '.cursor/rules'), skillsDir: SHARED_GLOBAL_SKILLS, memoryFile: null },
  },
  codex: {
    label: 'Codex',
    ruleFormat: RULE_FORMAT.AGENTS,
    command: 'codex',
    projectMarkers: ['.codex'],
    homeMarkers: [join(HOME, '.codex')],
    project: { rulesDir: SHARED_RULES, skillsDir: SHARED_SKILLS, memoryFile: AGENTS_FILE },
    global: { rulesDir: join(HOME, '.codex/rules'), skillsDir: SHARED_GLOBAL_SKILLS, memoryFile: join(HOME, '.codex', AGENTS_FILE) },
  },
  opencode: {
    label: 'OpenCode',
    ruleFormat: RULE_FORMAT.AGENTS,
    command: 'opencode',
    projectMarkers: ['.opencode'],
    homeMarkers: [OPENCODE_HOME],
    project: { rulesDir: SHARED_RULES, skillsDir: SHARED_SKILLS, memoryFile: AGENTS_FILE },
    global: { rulesDir: join(OPENCODE_HOME, 'rules'), skillsDir: SHARED_GLOBAL_SKILLS, memoryFile: join(OPENCODE_HOME, AGENTS_FILE) },
  },
  droid: {
    label: 'Factory Droid',
    ruleFormat: RULE_FORMAT.AGENTS,
    command: 'droid',
    projectMarkers: ['.factory'],
    homeMarkers: [join(HOME, '.factory')],
    project: { rulesDir: SHARED_RULES, skillsDir: SHARED_SKILLS, memoryFile: AGENTS_FILE },
    global: { rulesDir: join(HOME, '.factory/rules'), skillsDir: SHARED_GLOBAL_SKILLS, memoryFile: join(HOME, '.factory', AGENTS_FILE) },
  },
  pi: {
    label: 'Pi',
    ruleFormat: RULE_FORMAT.AGENTS,
    command: 'pi',
    projectMarkers: ['.pi'],
    homeMarkers: [join(HOME, '.pi/agent')],
    project: { rulesDir: SHARED_RULES, skillsDir: SHARED_SKILLS, memoryFile: AGENTS_FILE },
    global: { rulesDir: join(HOME, '.pi/agent/rules'), skillsDir: SHARED_GLOBAL_SKILLS, memoryFile: join(HOME, '.pi/agent', AGENTS_FILE) },
  },
};

export const HARNESS_IDS = Object.keys(HARNESSES);

export const getHarness = (id) => {
  const harness = HARNESSES[id];
  if (!harness) throw new Error(`Unknown harness "${id}". Known: ${HARNESS_IDS.join(', ')}`);
  return harness;
};

export const getScopePaths = (id, global) => getHarness(id)[global ? 'global' : 'project'];
