import { dirname, join, relative, resolve } from 'node:path';
import { getScopePaths, getHarness, RULE_FORMAT } from './harnesses.mjs';
import { renderAgentsBody, renderAgentsRule, renderClaudeRule, renderCursorRule } from './render.mjs';
import { wrapBlock } from './managed-block.mjs';

const RULE_RENDERERS = {
  [RULE_FORMAT.CLAUDE]: { render: renderClaudeRule, extension: '.md' },
  [RULE_FORMAT.CURSOR]: { render: renderCursorRule, extension: '.mdc' },
  [RULE_FORMAT.AGENTS]: { render: renderAgentsRule, extension: '.md' },
};

const ruleFilePath = (rulesRoot, rule, extension) => join(rulesRoot, rule.pack, `${rule.name}${extension}`);

const ruleActions = (rulesRoot, rules, format) => {
  const renderer = RULE_RENDERERS[format];
  return rules.map((rule) => ({
    kind: 'file',
    path: ruleFilePath(rulesRoot, rule, renderer.extension),
    contents: renderer.render(rule),
  }));
};

const skillActions = (skillsRoot, skills) =>
  skills.map((skill) => ({ kind: 'skill', path: join(skillsRoot, skill.name), source: skill.dir }));

const blockAction = (memoryPath, rulesRoot, rules) => {
  const linkOf = (rule) => relative(dirname(memoryPath), ruleFilePath(rulesRoot, rule, '.md'));
  return { kind: 'block', path: memoryPath, block: wrapBlock(renderAgentsBody(rules, linkOf)) };
};

const harnessActions = (id, content, root, global) => {
  const harness = getHarness(id);
  const paths = getScopePaths(id, global);
  const rulesRoot = resolve(root, paths.rulesDir);
  const actions = [
    ...ruleActions(rulesRoot, content.rules, harness.ruleFormat),
    ...skillActions(resolve(root, paths.skillsDir), content.skills),
  ];
  if (!paths.memoryFile) return actions;
  return [...actions, blockAction(resolve(root, paths.memoryFile), rulesRoot, content.rules)];
};

const dedupeByPath = (actions) => {
  const seen = new Map();
  actions.forEach((action) => {
    if (!seen.has(action.path)) seen.set(action.path, action);
  });
  return [...seen.values()];
};

export const buildPlan = ({ content, harnessIds, root, global }) =>
  dedupeByPath(harnessIds.flatMap((id) => harnessActions(id, content, root, global)));
