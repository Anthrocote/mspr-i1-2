import { PAGE_TO_SLUG, HELP_SLUGS } from '@/content/help/types';

describe('help content model', () => {
  it('lists the six help slugs in reading order', () => {
    expect(HELP_SLUGS).toEqual([
      'prise-en-main', 'lots', 'courbes', 'alertes', 'exploitations', 'faq',
    ]);
  });

  it('maps every navigable page to an existing help slug', () => {
    for (const slug of Object.values(PAGE_TO_SLUG)) {
      expect(HELP_SLUGS).toContain(slug);
    }
  });

  it('maps the four content pages to their section', () => {
    expect(PAGE_TO_SLUG.lots).toBe('lots');
    expect(PAGE_TO_SLUG.iot).toBe('courbes');
    expect(PAGE_TO_SLUG.alertes).toBe('alertes');
    expect(PAGE_TO_SLUG.exploitations).toBe('exploitations');
    expect(PAGE_TO_SLUG.dashboard).toBe('prise-en-main');
  });
});
