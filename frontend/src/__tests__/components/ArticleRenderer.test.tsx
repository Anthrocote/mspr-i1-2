import { render, screen } from '@testing-library/react';
import ArticleRenderer from '@/components/help/ArticleRenderer';
import type { HelpBlock } from '@/content/help/types';

const blocks: HelpBlock[] = [
  { kind: 'heading', text: 'Titre section' },
  { kind: 'paragraph', text: 'Un paragraphe.' },
  { kind: 'list', items: ['Item A', 'Item B'] },
  { kind: 'steps', items: ['Étape 1', 'Étape 2'] },
  { kind: 'callout', tone: 'warning', text: 'Attention.' },
  { kind: 'image', src: '/help/lots/fr/liste.png', alt: 'Liste des lots' },
  { kind: 'qa', q: 'Une question ?', a: 'Une réponse.' },
];

describe('ArticleRenderer', () => {
  it('renders a heading as a level-2 heading', () => {
    render(<ArticleRenderer blocks={blocks} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Titre section' })).toBeInTheDocument();
  });

  it('renders list and steps items', () => {
    render(<ArticleRenderer blocks={blocks} />);
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Étape 1')).toBeInTheDocument();
  });

  it('renders the callout text and the image with its alt', () => {
    render(<ArticleRenderer blocks={blocks} />);
    expect(screen.getByText('Attention.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Liste des lots' })).toBeInTheDocument();
  });

  it('renders a qa block as a question and answer pair', () => {
    render(<ArticleRenderer blocks={blocks} />);
    expect(screen.getByText('Une question ?')).toBeInTheDocument();
    expect(screen.getByText('Une réponse.')).toBeInTheDocument();
  });
});
