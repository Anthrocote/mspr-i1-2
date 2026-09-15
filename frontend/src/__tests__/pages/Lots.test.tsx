import { useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LotsPage from '@/app/lots/page';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';

function renderLots() {
  return render(
    <LanguageProvider>
      <SearchProvider>
        <LotsPage />
      </SearchProvider>
    </LanguageProvider>
  );
}

function openRow(id: string) {
  const row = screen.getByText(id).closest('[class*="cursor-pointer"]');
  if (row) fireEvent.click(row);
}

describe('LotsPage', () => {
  // setLanguage() persists to localStorage; keep language state from leaking
  // between tests.
  afterEach(() => localStorage.clear());

  it('renders the single Filtrer control and no create/quick-chip affordances', () => {
    renderLots();
    expect(screen.getByText('Filtrer')).toBeInTheDocument();
    expect(screen.queryByText('Nouveau Lot')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tous les lots' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alertes actives' })).not.toBeInTheDocument();
  });

  it('renders table headers including the constitution date', () => {
    renderLots();
    expect(screen.getByText('ID Lot')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt')).toBeInTheDocument();
    expect(screen.getByText('Constitué le')).toBeInTheDocument();
    expect(screen.queryByText('Stocké le')).not.toBeInTheDocument();
  });

  it('paginates: first page holds 8 lots, page 2 reveals the rest', () => {
    renderLots();
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
    // 10 lots, page size 8 -> the last two are on page 2.
    expect(screen.queryByText('LOT-BR-2024-00760')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Suivant'));
    expect(screen.getByText('LOT-BR-2024-00760')).toBeInTheDocument();
    expect(screen.queryByText('LOT-BR-2023-00018')).not.toBeInTheDocument();
  });

  it('filters by location through the consolidated Localisation select', () => {
    renderLots();
    fireEvent.click(screen.getByText('Filtrer'));
    const locationSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(locationSelect, { target: { value: 'country:co' } });
    expect(screen.getByText('LOT-CO-2024-00342')).toBeInTheDocument();
    expect(screen.queryByText('LOT-BR-2023-00018')).not.toBeInTheDocument();
  });

  it('opens a read-only detail view with the lot journey', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    expect(screen.getByText('Retour aux lots')).toBeInTheDocument();
    expect(screen.getByText('Parcours du lot')).toBeInTheDocument();
    // No write action on the detail view.
    expect(screen.queryByText('Valider conforme')).not.toBeInTheDocument();
    expect(screen.queryByText('Marquer en transit')).not.toBeInTheDocument();
  });

  it('detail view shows the exploitation link and warehouse-stay history', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    // exploitationId br-santa-lucia -> Fazenda Santa Lúcia
    expect(screen.getByText(/Fazenda Santa Lúcia/)).toBeInTheDocument();
    expect(screen.getByText('Constitué')).toBeInTheDocument();
    // This lot moved: it has a São Paulo A stay in its history.
    expect(screen.getByText('Entreposé · São Paulo A')).toBeInTheDocument();
  });

  it('detail view shows current conditions', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    expect(screen.getByText('Conditions actuelles')).toBeInTheDocument();
    expect(screen.getByText('Température')).toBeInTheDocument();
    expect(screen.getByText('Humidité')).toBeInTheDocument();
  });

  it('searches on the translated labels the user actually sees', () => {
    function Harness() {
      const { setLanguage } = useLanguage();
      const { setSearchQuery } = useSearch();
      useEffect(() => {
        setLanguage('en');
        setSearchQuery('brazil');
      }, [setLanguage, setSearchQuery]);
      return <LotsPage />;
    }
    render(
      <LanguageProvider>
        <SearchProvider>
          <Harness />
        </SearchProvider>
      </LanguageProvider>
    );
    // In English the country renders as "Brazil"; searching it must find BR lots.
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.queryByText('LOT-EC-2024-00107')).not.toBeInTheDocument();
  });

  it('returns to the list from the detail view', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    fireEvent.click(screen.getByText('Retour aux lots'));
    expect(screen.getByText('Filtrer')).toBeInTheDocument();
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
  });
});
