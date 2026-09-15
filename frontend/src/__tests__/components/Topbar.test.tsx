import { render, screen, fireEvent } from '@testing-library/react';
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

  it('keeps the functional search input', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.getByPlaceholderText('Rechercher…')).toBeInTheDocument();
  });

  it('renders the mobile menu button', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.getByLabelText('Ouvrir le menu')).toBeInTheDocument();
  });

  it('drops the decorative bell and the fake user', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.queryByText('Marina Joaquim')).not.toBeInTheDocument();
    expect(screen.queryByText('MJ')).not.toBeInTheDocument();
  });

  it('hosts the language switcher moved out of the deleted settings page', () => {
    renderTopbar('Test', 'Sub');
    const select = screen.getByLabelText('Langue');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'en' } });
    expect((select as HTMLSelectElement).value).toBe('en');
  });
});
