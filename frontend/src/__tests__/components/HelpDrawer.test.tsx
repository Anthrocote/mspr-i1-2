import { render, screen } from '@testing-library/react';
import HelpDrawer from '@/components/help/HelpDrawer';
import { LanguageProvider } from '@/contexts/LanguageContext';

describe('HelpDrawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <LanguageProvider><HelpDrawer slug="lots" open={false} onClose={() => {}} /></LanguageProvider>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows the page article and a link to the full help center when open', () => {
    render(
      <LanguageProvider><HelpDrawer slug="lots" open onClose={() => {}} /></LanguageProvider>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gérer les lots')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ouvrir dans le centre d\'aide' }))
      .toHaveAttribute('href', '/aide/lots');
  });
});
