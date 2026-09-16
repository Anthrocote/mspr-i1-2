import type { HelpArticle, HelpSlug } from './types';
import { HELP_SLUGS } from './types';
import { priseEnMain } from './prise-en-main';
import { lots } from './lots';
import { courbes } from './courbes';
import { alertes } from './alertes';
import { exploitations } from './exploitations';
import { faq } from './faq';

const BY_SLUG: Record<HelpSlug, HelpArticle> = {
  'prise-en-main': priseEnMain,
  lots,
  courbes,
  alertes,
  exploitations,
  faq,
};

// Ordered for the table of contents; HELP_SLUGS is the single source of order.
export const HELP_ARTICLES: HelpArticle[] = HELP_SLUGS.map((slug) => BY_SLUG[slug]);

export function getArticle(slug: HelpSlug): HelpArticle | undefined {
  return BY_SLUG[slug];
}

export { HELP_SLUGS } from './types';
export type { HelpArticle, HelpSlug, HelpBlock } from './types';
