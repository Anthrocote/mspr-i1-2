import { render, screen } from '@testing-library/react';
import Topbar from '@/components/layout/Topbar';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';

function renderTopbar(title: string, subtitle: string) {
  return render(
    <LanguageProvider>
      <SearchProvider>
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => {}} />
      </SearchProvider>
    </LanguageProvider>
  );
}

describe('Topbar', () => {
  it('renders the title', () => {
    renderTopbar('Dashboard', 'Vue globale');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderTopbar('Dashboard', 'Vue globale');
    expect(screen.getByText('Vue globale')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.getByPlaceholderText('Rechercher…')).toBeInTheDocument();
  });

  it('renders notification bell button', () => {
    renderTopbar('Test', 'Sub');
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders user name Marina Joaquim', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.getByText('Marina Joaquim')).toBeInTheDocument();
  });

  it('renders user role', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.getByText('Responsable Qualité')).toBeInTheDocument();
  });

  it('renders user initials MJ', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.getByText('MJ')).toBeInTheDocument();
  });
});
