import { describe, expect, it } from 'vitest';
import { rehypeCollapsibleHeadings } from '../../src/utils/rehypeCollapsibleHeadings';

describe('rehypeCollapsibleHeadings', () => {
  it('membungkus heading bertingkat menjadi details dan mempertahankan node non-heading', () => {
    const tree = {
      type: 'root',
      children: [
        { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Pembuka' }] },
        { type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'Bab' }] },
        { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Isi' }] },
        { type: 'element', tagName: 'h3', properties: {}, children: [{ type: 'text', value: 'Subbab' }] },
        { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Rincian' }] },
        { type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'Bab 2' }] },
      ],
    };

    rehypeCollapsibleHeadings({ defaultOpen: true })(tree);

    expect(tree.children[0].tagName).toBe('p');
    expect(tree.children[1].tagName).toBe('details');
    expect(tree.children[1].properties).toEqual({ open: true });
    expect(tree.children[1].children[0].tagName).toBe('summary');
    expect(tree.children[1].children[1].tagName).toBe('p');
    expect(tree.children[1].children[2].tagName).toBe('details');
    expect(tree.children[2].tagName).toBe('details');
  });

  it('aman untuk tree kosong, children null, dan heading yang tidak cocok level', () => {
    const treeKosong = { type: 'root', children: null };
    rehypeCollapsibleHeadings()(treeKosong);
    expect(treeKosong.children).toEqual([]);

    const treeTertutup = {
      type: 'root',
      children: [
        { type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'Bab' }] },
        { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Isi' }] },
      ],
    };

    rehypeCollapsibleHeadings({ defaultOpen: false })(treeTertutup);
    expect(treeTertutup.children[0].properties).toEqual({});

    const treeTanpaHeading = {
      type: 'root',
      children: [
        { type: 'element', tagName: 'h1', properties: {}, children: [{ type: 'text', value: 'Judul' }] },
        { type: 'element', tagName: 'p', properties: {}, children: [{ type: 'text', value: 'Isi' }] },
      ],
    };

    rehypeCollapsibleHeadings({ defaultOpen: false })(treeTanpaHeading);

    expect(treeTanpaHeading.children[0].tagName).toBe('h1');
    expect(treeTanpaHeading.children[1].tagName).toBe('p');
  });
});