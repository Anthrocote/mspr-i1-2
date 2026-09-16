import type { Language } from '@/translations';
import type { PageId } from '@/types';

export type HelpBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: string[] }
  | { kind: 'callout'; tone: 'info' | 'warning'; text: string }
  | { kind: 'image'; src: string; alt: string };

export type HelpSlug =
  | 'prise-en-main' | 'lots' | 'courbes' | 'alertes' | 'exploitations' | 'faq';

export interface HelpArticle {
  slug: HelpSlug;
  title: Record<Language, string>;
  blocks: Record<Language, HelpBlock[]>;
}

// Reading order of the help table of contents.
export const HELP_SLUGS: HelpSlug[] = [
  'prise-en-main', 'lots', 'courbes', 'alertes', 'exploitations', 'faq',
];

// Which help section the contextual "?" opens for each navigable page. The
// dashboard has no dedicated section, so it points to the getting-started one.
export const PAGE_TO_SLUG: Record<PageId, HelpSlug> = {
  dashboard: 'prise-en-main',
  lots: 'lots',
  iot: 'courbes',
  alertes: 'alertes',
  exploitations: 'exploitations',
};
