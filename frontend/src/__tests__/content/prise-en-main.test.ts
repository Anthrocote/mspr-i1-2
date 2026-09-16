import { priseEnMain } from '@/content/help/prise-en-main';

describe('article prise-en-main', () => {
  it('carries the three languages for title and blocks', () => {
    for (const lang of ['fr', 'en', 'es'] as const) {
      expect(priseEnMain.title[lang].length).toBeGreaterThan(0);
      expect(priseEnMain.blocks[lang].length).toBeGreaterThan(0);
    }
  });

  it('opens with a heading block', () => {
    expect(priseEnMain.blocks.fr[0].kind).toBe('heading');
  });
});
