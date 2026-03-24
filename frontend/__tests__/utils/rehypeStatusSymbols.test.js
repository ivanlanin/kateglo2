import { describe, expect, it } from 'vitest';
import { rehypeStatusSymbols } from '../../src/utils/rehypeStatusSymbols';

describe('rehypeStatusSymbols', () => {
  it('mengubah simbol status menjadi span dan mempertahankan teks lain', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [
            { type: 'text', value: '✓ aman ✗ gagal ✕ batal' },
          ],
        },
      ],
    };

    rehypeStatusSymbols()(tree);

    const children = tree.children[0].children;
    expect(children[0].tagName).toBe('span');
    expect(children[0].properties.className).toEqual(['status-symbol-yes']);
    expect(children[2].properties.className).toEqual(['status-symbol-no']);
    expect(children[4].properties.className).toEqual(['status-symbol-no']);
    expect(children[1].value).toContain(' aman ');
  });

  it('mengabaikan simbol di dalam code/pre serta node tanpa children', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          children: [
            {
              type: 'element',
              tagName: 'code',
              children: [{ type: 'text', value: '✓ tetap mentah' }],
            },
          ],
        },
        { type: 'element', tagName: 'span' },
        null,
      ],
    };

    rehypeStatusSymbols()(tree);

    expect(tree.children[0].children[0].children[0].value).toBe('✓ tetap mentah');
    expect(tree.children[1].tagName).toBe('span');
  });
});