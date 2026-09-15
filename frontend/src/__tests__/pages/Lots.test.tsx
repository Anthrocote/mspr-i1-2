import { useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LotsView from '@/app/lots/LotsView';
import type { BadgeVariant, CountryCode, Farm, Lot } from '@/types';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';

// Inline presentation fixtures: the same adapted shape the queries produce, so
// the view test needs neither the network nor the mock data module. The
// container's fetch wiring is covered in Lots.integration.test.tsx.
const COUNTRY_LABEL: Record<CountryCode, string> = { br: 'Brésil', ec: 'Équateur', co: 'Colombie' };
const COUNTRY_FLAG: Record<CountryCode, string> = { br: '🇧🇷', ec: '🇪🇨', co: '🇨🇴' };

function lot(over: Partial<Lot> & { id: string; countryCode: CountryCode; warehouse: string }): Lot {
  const { countryCode } = over;
  return {
    country: COUNTRY_LABEL[countryCode],
    flag: COUNTRY_FLAG[countryCode],
    exploitationId: '',
    constitutedAt: '5 jan. 2023',
    storageDate: '12 jan. 2023',
    stays: [],
    duration: '90 j',
    durationDays: 90,
    status: 'Conforme',
    statusVariant: 'ok' as BadgeVariant,
    durationVariant: '',
    temp: '',
    hum: '',
    idealTemp: '',
    idealHum: '',
    ...over,
  };
}

const LOTS: Lot[] = [
  lot({
    id: 'LOT-BR-2023-00018', countryCode: 'br', warehouse: 'São Paulo A', exploitationId: 'br-santa-lucia',
    constitutedAt: '5 jan. 2023', duration: '387 j', durationDays: 387, status: 'Périmé', statusVariant: 'err', durationVariant: 'err',
    temp: '31°C', hum: '56%', idealTemp: '29°C ±3', idealHum: '55% ±2',
    stays: [
      { warehouse: 'Rio C', entree: '12 jan. 2023', sortie: '20 juin 2023' },
      { warehouse: 'São Paulo A', entree: '21 juin 2023', sortie: null },
    ],
  }),
  lot({ id: 'LOT-EC-2024-00107', countryCode: 'ec', warehouse: 'Quito B', duration: '240 j', durationDays: 240, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn' }),
  lot({ id: 'LOT-CO-2024-00342', countryCode: 'co', warehouse: 'Bogotá C', duration: '134 j', durationDays: 134 }),
  lot({ id: 'LOT-BR-2024-00891', countryCode: 'br', warehouse: 'Rio C' }),
  lot({ id: 'LOT-EC-2024-00204', countryCode: 'ec', warehouse: 'Guayaquil A', duration: '52 j', durationDays: 52 }),
  lot({ id: 'LOT-CO-2023-00077', countryCode: 'co', warehouse: 'Bogotá C', duration: '360 j', durationDays: 360, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn' }),
  lot({ id: 'LOT-BR-2024-00992', countryCode: 'br', warehouse: 'São Paulo A', duration: '32 j', durationDays: 32 }),
  lot({ id: 'LOT-EC-2023-00045', countryCode: 'ec', warehouse: 'Quito B', duration: '372 j', durationDays: 372, status: 'Périmé', statusVariant: 'err', durationVariant: 'err' }),
  lot({ id: 'LOT-CO-2024-00501', countryCode: 'co', warehouse: 'Medellín D', duration: '96 j', durationDays: 96 }),
  lot({ id: 'LOT-BR-2024-00760', countryCode: 'br', warehouse: 'Rio C', duration: '128 j', durationDays: 128, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn' }),
];

const FARMS: Farm[] = [
  { id: 'br-santa-lucia', name: 'Fazenda Santa Lúcia', countryCode: 'br', country: 'Brésil', flag: '🇧🇷', lots: 42, certification: '—', certVariant: 'neutral' },
];

function renderLots() {
  return render(
    <LanguageProvider>
      <SearchProvider>
        <LotsView lots={LOTS} farms={FARMS} />
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
      return <LotsView lots={LOTS} farms={FARMS} />;
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
