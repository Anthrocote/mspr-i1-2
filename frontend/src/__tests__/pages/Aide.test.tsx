import { render, screen } from '@testing-library/react';
import AideArticleView from '@/app/aide/[slug]/AideArticleView';
import { LanguageProvider } from '@/contexts/LanguageContext';

jest.mock('next/navigation', () => ({ usePathname: () => '/aide/lots' }));

describe('Aide article view', () => {
  it('renders the table of contents as links to the six sections', () => {
    render(<LanguageProvider><AideArticleView slug="lots" /></LanguageProvider>);
    // TOC entries are links; the active article title also appears as the h1,
    // so query the nav by link role to keep the two occurrences unambiguous.
    expect(screen.getByRole('link', { name: 'Prise en main' })).toHaveAttribute('href', '/aide/prise-en-main');
    expect(screen.getByRole('link', { name: 'Gérer les lots' })).toHaveAttribute('href', '/aide/lots');
    expect(screen.getByRole('link', { name: 'FAQ & dépannage' })).toHaveAttribute('href', '/aide/faq');
  });

  it('renders the selected article title as the main heading', () => {
    render(<LanguageProvider><AideArticleView slug="lots" /></LanguageProvider>);
    expect(screen.getByRole('heading', { level: 1, name: 'Gérer les lots' })).toBeInTheDocument();
  });
});
