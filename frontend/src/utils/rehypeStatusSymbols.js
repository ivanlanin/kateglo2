export function rehypeStatusSymbols() {
  return (tree) => {
    visitNode(tree, false);
  };
}

function visitNode(node, insideExcludedParent) {
  if (!node || !node.children) {
    return;
  }

  const isExcludedParent = insideExcludedParent || isExcludedElement(node);
  const nextChildren = [];

  for (const child of node.children) {
    if (child.type === 'text' && !isExcludedParent) {
      nextChildren.push(...splitStatusText(child.value));
      continue;
    }

    visitNode(child, isExcludedParent);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

function isExcludedElement(node) {
  return node.type === 'element' && ['code', 'pre'].includes(node.tagName);
}

function splitStatusText(value) {
  const parts = [];
  let buffer = '';

  for (const char of value) {
    if (char === '✓' || char === '✗' || char === '✕') {
      if (buffer) {
        parts.push({ type: 'text', value: buffer });
        buffer = '';
      }

      parts.push({
        type: 'element',
        tagName: 'span',
        properties: {
          className: [char === '✓' ? 'status-symbol-yes' : 'status-symbol-no'],
        },
        children: [{ type: 'text', value: char }],
      });
      continue;
    }

    buffer += char;
  }

  if (buffer) {
    parts.push({ type: 'text', value: buffer });
  }

  return parts;
}