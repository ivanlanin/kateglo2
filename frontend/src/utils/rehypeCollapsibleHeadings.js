/**
 * Rehype plugin: wrap h2/h3 sections in collapsible <details>/<summary>.
 * h2 sections wrap first; h3 subsections within h2 wrap recursively.
 * No markdown files need to be modified.
 */
export function rehypeCollapsibleHeadings() {
  return (tree) => {
    tree.children = groupSections(tree.children, [2, 3, 4]);
  };
}

function isHeadingLevel(node, level) {
  return node.type === 'element' && node.tagName === `h${level}`;
}

function isHeadingAtOrAbove(node, level) {
  for (let l = 1; l <= level; l++) {
    if (node.type === 'element' && node.tagName === `h${l}`) return true;
  }
  return false;
}

function makeDetails(headingNode, contentNodes) {
  return {
    type: 'element',
    tagName: 'details',
    properties: {},
    children: [
      {
        type: 'element',
        tagName: 'summary',
        properties: {},
        children: [headingNode],
      },
      ...contentNodes,
    ],
  };
}

function groupSections(children, levels) {
  if (!children || levels.length === 0) return children || [];

  const [currentLevel, ...remainingLevels] = levels;
  const result = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    if (isHeadingLevel(node, currentLevel)) {
      const contentNodes = [];
      i++;

      while (i < children.length) {
        if (isHeadingAtOrAbove(children[i], currentLevel)) break;
        contentNodes.push(children[i]);
        i++;
      }

      const processedContent = groupSections(contentNodes, remainingLevels);
      result.push(makeDetails(node, processedContent));
    } else {
      result.push(node);
      i++;
    }
  }

  return result;
}
