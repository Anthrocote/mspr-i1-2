import { HELP_ARTICLES, getArticle } from '@/content/help';
import { HELP_SLUGS } from '@/content/help/types';

const LANGS = ['fr', 'en', 'es'] as const;

describe('help registry integrity', () => {
  it('exposes one article per slug, in reading order', () => {
    expect(HELP_ARTICLES.map((a) => a.slug)).toEqual(HELP_SLUGS);
  });

  it('every article has a non-empty title and blocks in all three languages', () => {
    for (const article of HELP_ARTICLES) {
      for (const lang of LANGS) {
        expect(article.title[lang].trim().length).toBeGreaterThan(0);
        expect(article.blocks[lang].length).toBeGreaterThan(0);
      }
    }
  });

  it('image blocks reference a src and alt', () => {
    for (const article of HELP_ARTICLES) {
      for (const lang of LANGS) {
        for (const block of article.blocks[lang]) {
          if (block.kind === 'image') {
            expect(block.src.length).toBeGreaterThan(0);
            expect(block.alt.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('getArticle returns the matching article and undefined for unknown slugs', () => {
    expect(getArticle('lots')?.slug).toBe('lots');
    // @ts-expect-error unknown slug is rejected at the type level
    expect(getArticle('nope')).toBeUndefined();
  });
});
