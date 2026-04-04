import { Fragment } from 'react';

function parseInlineMarkdown(text = '') {
  const source = String(text || '');
  const pattern = /(\*[^*\n]+\*|_[^_\n]+_)/g;
  const parts = [];
  let lastIndex = 0;
  let match = pattern.exec(source);

  while (match) {
    const [token] = match;
    const start = match.index;

    if (start > lastIndex) {
      parts.push({ text: source.slice(lastIndex, start), italic: false });
    }

    parts.push({ text: token.slice(1, -1), italic: true });
    lastIndex = start + token.length;
    match = pattern.exec(source);
  }

  if (lastIndex < source.length) {
    parts.push({ text: source.slice(lastIndex), italic: false });
  }

  return parts;
}

export function stripInlineMarkdown(text = '') {
  return parseInlineMarkdown(text).map((item) => item.text).join('');
}

export function renderInlineMarkdown(text = '') {
  return parseInlineMarkdown(text).map((item, index) => (
    item.italic
      ? <em key={`${item.text}-${index}`}>{item.text}</em>
      : <Fragment key={`${item.text}-${index}`}>{item.text}</Fragment>
  ));
}

function TeksMarkdownInline({ as: Component = 'span', text = '', className }) {
  return <Component className={className}>{renderInlineMarkdown(text)}</Component>;
}

export default TeksMarkdownInline;