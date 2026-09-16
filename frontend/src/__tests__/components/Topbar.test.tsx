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
  // LanguageContext persists the choice in localStorage; clear it so the
  // language switcher test does not leak 'en' into the following cases.
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('renders a help button that calls onHelpClick', () => {
    const onHelpClick = jest.fn();
    render(
      <LanguageProvider>
        <SearchProvider>
          <Topbar title="Gestion des Lots" subtitle="x" onMenuClick={() => {}} onHelpClick={onHelpClick} />
        </SearchProvider>
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir l\'aide de cette page' }));
    expect(onHelpClick).toHaveBeenCalledTimes(1);
  });

  it('omits the help button when no onHelpClick is provided', () => {
    renderTopbar('Test', 'Sub');
    expect(screen.queryByRole('button', { name: 'Ouvrir l\'aide de cette page' })).not.toBeInTheDocument();
  });
});
