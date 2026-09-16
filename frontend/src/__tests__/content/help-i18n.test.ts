import { translations } from '@/translations';
import { PAGE_META } from '@/types';

const KEYS = ['aide', 'aide_subtitle', 'help_open', 'help_open_full', 'help_close'];

describe('help i18n keys', () => {
  it('defines every help key in the three languages', () => {
    for (const lang of ['fr', 'en', 'es'] as const) {
      for (const key of KEYS) {
        expect(translations[lang][key]?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('registers the aide page in PAGE_META', () => {
    expect(PAGE_META.aide).toBeDefined();
  });
});
