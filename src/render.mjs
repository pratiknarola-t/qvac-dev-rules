import { withFrontmatter } from './frontmatter.mjs';

const GLOB_SEPARATOR = ',';
const TRIGGER = { ALWAYS: 'always', SCOPED: 'scoped', ON_DEMAND: 'on-demand' };

export const triggerOf = (rule) => {
  if (rule.alwaysApply) return TRIGGER.ALWAYS;
  return rule.globs.length > 0 ? TRIGGER.SCOPED : TRIGGER.ON_DEMAND;
};

export const isAlways = (rule) => triggerOf(rule) === TRIGGER.ALWAYS;

export const renderClaudeRule = (rule) => {
  if (triggerOf(rule) !== TRIGGER.SCOPED) return `${rule.body.trimEnd()}\n`;
  return withFrontmatter({ paths: rule.globs }, rule.body);
};

const cursorFields = (rule) => {
  if (triggerOf(rule) !== TRIGGER.SCOPED) {
    return { description: rule.description, alwaysApply: rule.alwaysApply };
  }
  return { description: rule.description, globs: rule.globs.join(GLOB_SEPARATOR), alwaysApply: false };
};

export const renderCursorRule = (rule) => withFrontmatter(cursorFields(rule), rule.body);

export const renderAgentsRule = (rule) => `${rule.body.trimEnd()}\n`;

const asCode = (value) => `\`${value}\``;

const triggerColumn = (rule) => {
  if (triggerOf(rule) === TRIGGER.SCOPED) return rule.globs.map(asCode).join(', ');
  return rule.description;
};

const tableRow = (rule, linkOf) => `| ${triggerColumn(rule)} | ${asCode(linkOf(rule))} |`;

const renderTable = (rules, linkOf) => [
  '| When | Read first |',
  '|---|---|',
  ...rules.map((rule) => tableRow(rule, linkOf)),
].join('\n');

const REFERENCED_HEADING = '# Rules to read on demand';
const REFERENCED_INTRO = 'Read the matching rule file before you work on something it covers.';

const renderReferenced = (rules, linkOf) => {
  if (rules.length === 0) return '';
  return [REFERENCED_HEADING, '', REFERENCED_INTRO, '', renderTable(rules, linkOf)].join('\n');
};

const renderInlined = (rules) => rules.map((rule) => rule.body.trim()).join('\n\n');

export const renderAgentsBody = (rules, linkOf) => {
  const inlined = renderInlined(rules.filter(isAlways));
  const referenced = renderReferenced(rules.filter((rule) => !isAlways(rule)), linkOf);
  return [inlined, referenced].filter(Boolean).join('\n\n');
};
