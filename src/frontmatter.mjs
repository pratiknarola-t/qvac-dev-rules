const DELIMITER = '---';
const LIST_ITEM_PREFIX = '- ';

const stripQuotes = (value) => value.replace(/^["'](.*)["']$/, '$1');

const parseScalar = (raw) => {
  const value = stripQuotes(raw.trim());
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const splitFieldLine = (line) => {
  const separator = line.indexOf(':');
  if (separator === -1) return null;
  return { key: line.slice(0, separator).trim(), raw: line.slice(separator + 1) };
};

const collectListItems = (lines, start) => {
  const items = [];
  let index = start;
  while (index < lines.length && lines[index].trimStart().startsWith(LIST_ITEM_PREFIX)) {
    items.push(parseScalar(lines[index].trimStart().slice(LIST_ITEM_PREFIX.length)));
    index += 1;
  }
  return { items, next: index };
};

const parseFields = (lines) => {
  const fields = {};
  let index = 0;
  while (index < lines.length) {
    const field = splitFieldLine(lines[index]);
    if (!field) {
      index += 1;
      continue;
    }
    index += 1;
    if (field.raw.trim() === '') {
      const list = collectListItems(lines, index);
      if (list.items.length > 0) {
        fields[field.key] = list.items;
        index = list.next;
        continue;
      }
      fields[field.key] = '';
      continue;
    }
    fields[field.key] = parseScalar(field.raw);
  }
  return fields;
};

const findClosingDelimiter = (lines) => {
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === DELIMITER) return index;
  }
  return -1;
};

export const parseFrontmatter = (text) => {
  const lines = text.split('\n');
  if (lines[0].trim() !== DELIMITER) return { data: {}, body: text };
  const closing = findClosingDelimiter(lines);
  if (closing === -1) return { data: {}, body: text };
  return {
    data: parseFields(lines.slice(1, closing)),
    body: lines.slice(closing + 1).join('\n').replace(/^\n+/, ''),
  };
};

const needsQuotes = (value) => /[:#*?{}[\]&!|>'"%@`,]/.test(value) || value.trim() !== value;

const formatScalar = (value) => {
  if (typeof value === 'boolean') return String(value);
  return needsQuotes(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
};

const formatField = ([key, value]) => {
  if (Array.isArray(value)) {
    return [`${key}:`, ...value.map((item) => `  ${LIST_ITEM_PREFIX}${formatScalar(item)}`)].join('\n');
  }
  return `${key}: ${formatScalar(value)}`;
};

export const withFrontmatter = (data, body) => {
  const fields = Object.entries(data).filter(([, value]) => value !== undefined);
  return [DELIMITER, ...fields.map(formatField), DELIMITER, '', body.replace(/\s*$/, '')].join('\n') + '\n';
};
