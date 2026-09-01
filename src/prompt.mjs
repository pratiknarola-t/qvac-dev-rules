import { createInterface } from 'node:readline/promises';

const LIST_SEPARATOR = ',';
const AFFIRMATIVE = ['y', 'yes'];

export const isInteractive = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const withReadline = async (run) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await run(rl);
  } finally {
    rl.close();
  }
};

const parseSelection = (answer, options, fallback) => {
  const trimmed = answer.trim();
  if (trimmed === '') return fallback;
  const indexes = trimmed.split(LIST_SEPARATOR).map((part) => Number.parseInt(part.trim(), 10));
  const picked = indexes.filter((index) => index >= 1 && index <= options.length).map((index) => options[index - 1].id);
  return picked.length > 0 ? picked : fallback;
};

const renderOption = (option, index, preselected) =>
  `  ${index + 1}) ${option.label}${preselected.includes(option.id) ? ' [detected]' : ''}`;

export const askMultiSelect = async ({ question, options, preselected }) => {
  const lines = options.map((option, index) => renderOption(option, index, preselected));
  const answer = await withReadline((rl) =>
    rl.question(`${question}\n${lines.join('\n')}\nEnter numbers separated by commas, or press Enter for the default: `),
  );
  return parseSelection(answer, options, preselected);
};

export const askConfirm = async (question) => {
  const answer = await withReadline((rl) => rl.question(`${question} [y/N] `));
  return AFFIRMATIVE.includes(answer.trim().toLowerCase());
};
