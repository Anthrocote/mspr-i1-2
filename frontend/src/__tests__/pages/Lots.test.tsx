import { render, screen, fireEvent } from '@testing-library/react';
import LotsView from '@/app/lots/LotsView';
import type { BadgeVariant, CountryCode, Farm, Lot } from '@/types';
import type { LotFilterOptions } from '@/lib/api/queries';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Inline presentation fixtures: the same adapted shape the queries produce.
// LotsView is now a PURE view — the siège filters/sorts/paginates, so this test
// only checks rendering of the given page, the sort/filter/page callbacks, and
// the read-only detail. The fetch wiring lives in Lots.integration.test.tsx.
const COUNTRY_LABEL: Record<CountryCode, string> = { br: 'Brésil', ec: 'Équateur', co: 'Colombie' };
const COUNTRY_FLAG: Record<CountryCode, string> = { br: '🇧🇷', ec: '🇪🇨', co: '🇨🇴' };

function lot(over: Partial<Lot> & { id: string; countryCode: CountryCode; warehouse: string }): Lot {
  const { countryCode } = over;
  return {
    country: COUNTRY_LABEL[countryCode],
    countryId: 1,
    warehouseId: 'wh-uuid',
    flag: COUNTRY_FLAG[countryCode],
    exploitationId: '',
    constitutedAt: '5 jan. 2023',
    constitutedAtIso: '2023-01-05T00:00:00.000Z',
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
      { warehouse: 'Rio C', entree: '12 jan. 2023', sortie: '20 juin 2023', entreeIso: '2023-01-12T00:00:00.000Z', sortieIso: '2023-06-20T00:00:00.000Z' },
      { warehouse: 'São Paulo A', entree: '21 juin 2023', sortie: null, entreeIso: '2023-06-21T00:00:00.000Z', sortieIso: null },
    ],
  }),
  lot({ id: 'LOT-EC-2024-00107', countryCode: 'ec', warehouse: 'Quito B', duration: '240 j', durationDays: 240, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn' }),
  lot({ id: 'LOT-CO-2024-00342', countryCode: 'co', warehouse: 'Bogotá C', duration: '134 j', durationDays: 134 }),
];

const FARMS: Farm[] = [
  { id: 'br-santa-lucia', name: 'Fazenda Santa Lúcia', countryCode: 'br', country: 'Brésil', flag: '🇧🇷', lots: 42 },
];

const FILTER_OPTIONS: LotFilterOptions = {
  countries: [
    { id: 1, code: 'br', name: 'Brésil', flag: '🇧🇷' },
    { id: 2, code: 'co', name: 'Colombie', flag: '🇨🇴' },
  ],
  warehouses: [
    { id: 'wh-sp', name: 'São Paulo A', countryId: 1 },
    { id: 'wh-bo', name: 'Bogotá C', countryId: 2 },
  ],
};

function renderLots(overrides: Partial<React.ComponentProps<typeof LotsView>> = {}) {
  const props = {
    lots: LOTS,
    farms: FARMS,
    page: 1,
    pages: 1,
    total: LOTS.length,
    filterOptions: FILTER_OPTIONS,
    location: 'all',
    statusFilter: 'all' as const,
    ageFilter: 'all' as const,
    sortField: null,
    sortOrder: 'asc' as const,
    onLocation: jest.fn(),
    onStatus: jest.fn(),
    onAge: jest.fn(),
    onSort: jest.fn(),
    onReset: jest.fn(),
    onPage: jest.fn(),
    ...overrides,
  };
  render(
    <LanguageProvider>
      <LotsView {...props} />
    </LanguageProvider>
  );
  return props;
}

function openRow(id: string) {
  const row = screen.getByText(id).closest('[class*="cursor-pointer"]');
  if (row) fireEvent.click(row);
}

describe('LotsView', () => {
  afterEach(() => localStorage.clear());

  it('renders the current page of lots and the single Filtrer control', () => {
    renderLots();
    expect(screen.getByText('Filtrer')).toBeInTheDocument();
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('LOT-EC-2024-00107')).toBeInTheDocument();
    expect(screen.queryByText('Nouveau Lot')).not.toBeInTheDocument();
  });

  it('renders sortable table headers including the constitution date', () => {
    renderLots();
    expect(screen.getByText('ID Lot')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt')).toBeInTheDocument();
    expect(screen.getByText('Constitué le')).toBeInTheDocument();
    expect(screen.queryByText('Stocké le')).not.toBeInTheDocument();
  });

  it('reports a sort intent when a sortable header is clicked', () => {
    const props = renderLots();
    fireEvent.click(screen.getByText('Durée'));
    expect(props.onSort).toHaveBeenCalledWith('duration');
  });

  it('reports a location filter intent through the Localisation select', () => {
    const props = renderLots();
    fireEvent.click(screen.getByText('Filtrer'));
    const locationSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(locationSelect, { target: { value: 'country:2' } });
    expect(props.onLocation).toHaveBeenCalledWith('country:2');
  });

  it('renders server pagination metadata and reports page intent', () => {
    const props = renderLots({ page: 1, pages: 2, total: 12 });
    expect(screen.getByText('Page 1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Suivant'));
    expect(props.onPage).toHaveBeenCalled();
  });

  it('opens a read-only detail view with the lot journey', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    expect(screen.getByText('Retour aux lots')).toBeInTheDocument();
    expect(screen.getByText('Parcours du lot')).toBeInTheDocument();
    expect(screen.queryByText('Valider conforme')).not.toBeInTheDocument();
  });

  it('detail view shows the exploitation link and warehouse-stay history', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    expect(screen.getByText(/Fazenda Santa Lúcia/)).toBeInTheDocument();
    expect(screen.getByText('Constitué')).toBeInTheDocument();
    expect(screen.getByText('Entreposé · São Paulo A')).toBeInTheDocument();
  });

  it('detail view shows current conditions', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    expect(screen.getByText('Conditions actuelles')).toBeInTheDocument();
    expect(screen.getByText('Température')).toBeInTheDocument();
    expect(screen.getByText('Humidité')).toBeInTheDocument();
  });

  it('returns to the list from the detail view', () => {
    renderLots();
    openRow('LOT-BR-2023-00018');
    fireEvent.click(screen.getByText('Retour aux lots'));
    expect(screen.getByText('Filtrer')).toBeInTheDocument();
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
  });
});
