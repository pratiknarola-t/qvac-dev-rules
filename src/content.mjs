import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';

const RULES_DIR = 'rules';
const SKILLS_DIR = 'skills';
const SKILL_FILE = 'SKILL.md';
const RULE_EXTENSION = '.md';
const GLOB_SEPARATOR = ',';

const listDirectories = async (path) => {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
};

const listRuleFiles = async (path) => {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(RULE_EXTENSION)).map((entry) => entry.name);
};

const splitGlobs = (value) => {
  if (!value) return [];
  return String(value).split(GLOB_SEPARATOR).map((glob) => glob.trim()).filter(Boolean);
};

const readRule = async (root, pack, file) => {
  const path = join(root, RULES_DIR, pack, file);
  const { data, body } = parseFrontmatter(await readFile(path, 'utf8'));
  return {
    name: data.name,
    description: data.description || '',
    globs: splitGlobs(data.globs),
    alwaysApply: data.alwaysApply === true,
    pack,
    body,
  };
};

const readPackRules = async (root, pack) => {
  const files = await listRuleFiles(join(root, RULES_DIR, pack));
  return Promise.all(files.sort().map((file) => readRule(root, pack, file)));
};

const readSkill = async (root, pack, name) => {
  const dir = join(root, SKILLS_DIR, pack, name);
  const { data } = parseFrontmatter(await readFile(join(dir, SKILL_FILE), 'utf8'));
  return { name: data.name || name, description: data.description || '', pack, dir };
};

const readPackSkills = async (root, pack) => {
  const names = await listDirectories(join(root, SKILLS_DIR, pack));
  return Promise.all(names.sort().map((name) => readSkill(root, pack, name)));
};

const flatten = (groups) => groups.flat();

export const loadContent = async (root) => {
  const packs = (await listDirectories(join(root, RULES_DIR))).sort();
  const rules = flatten(await Promise.all(packs.map((pack) => readPackRules(root, pack))));
  const skillPacks = (await listDirectories(join(root, SKILLS_DIR))).sort();
  const skills = flatten(await Promise.all(skillPacks.map((pack) => readPackSkills(root, pack))));
  return { packs, rules, skills };
};

export const filterByPacks = (content, packs) => ({
  packs,
  rules: content.rules.filter((rule) => packs.includes(rule.pack)),
  skills: content.skills.filter((skill) => packs.includes(skill.pack)),
});
