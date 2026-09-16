import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LotsPage from '@/app/lots/page';
import type { Farm, Lot } from '@/types';
import type { LotFilterOptions } from '@/lib/api/queries';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';
import * as queries from '@/lib/api/queries';

jest.mock('@/lib/api/queries');

const mockedQueries = queries as jest.Mocked<typeof queries>;

const LOT: Lot = {
  id: 'LOT-BRA-2025-001',
  uuid: 'lot-uuid-1',
  countryCode: 'br',
  country: 'Brésil',
  warehouseId: 'wh-manaus',
  flag: '🇧🇷',
  warehouse: 'Entrepôt Manaus',
  exploitationId: 'exp-1',
  constitutedAtIso: '2026-07-17T00:00:00.000Z',
  stays: [],
  durationDays: 60,
  statusVariant: 'ok',
  durationVariant: '',
  temp: '',
  hum: '',
  idealTemp: '',
  idealHum: '',
};

const FARM: Farm = {
  id: 'exp-1',
  name: 'Fazenda Serra Verde',
  countryCode: 'br',
  country: 'Brésil',
  flag: '🇧🇷',
  lots: 7,
};

const FILTER_OPTIONS: LotFilterOptions = {
  countries: [
    { code: 'br', name: 'Brésil', flag: '🇧🇷' },
    { code: 'co', name: 'Colombie', flag: '🇨🇴' },
  ],
  warehouses: [{ id: 'wh-manaus', name: 'Entrepôt Manaus', countryCode: 'br' }],
};

function renderPage() {
  return render(
    <LanguageProvider>
      <SearchProvider>
        <LotsPage />
      </SearchProvider>
    </LanguageProvider>,
  );
}

describe('LotsPage container', () => {
  beforeEach(() => {
    mockedQueries.fetchExploitations.mockResolvedValue([FARM]);
    mockedQueries.fetchLotFilterOptions.mockResolvedValue(FILTER_OPTIONS);
    mockedQueries.fetchLotsServer.mockResolvedValue({ lots: [LOT], page: 1, pages: 1, total: 1 });
  });

  afterEach(() => jest.clearAllMocks());

  it('fetches the server page + filter options and renders the adapted table', async () => {
    renderPage();
    expect(await screen.findByText('LOT-BRA-2025-001')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt Manaus')).toBeInTheDocument();
    expect(screen.getByText('60 j')).toBeInTheDocument();
  });

  it('drives the server query from the location filter', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Filtrer'));
    const locationSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(locationSelect, { target: { value: 'country:co' } });
    await waitFor(() =>
      expect(mockedQueries.fetchLotsServer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ country: 'co', page: 1 }),
        expect.anything(),
      ),
    );
  });

  it('drives the server query from a column sort', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Durée'));
    await waitFor(() =>
      expect(mockedQueries.fetchLotsServer).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sort: 'duration', order: 'asc' }),
        expect.anything(),
      ),
    );
  });

  it('fetches the detail (stays + conditions) when a lot is opened', async () => {
    mockedQueries.fetchLotDetail.mockResolvedValue({
      lot: LOT,
      stays: [{ warehouse: 'Entrepôt Manaus', entreeIso: '2026-07-17T00:00:00.000Z', sortieIso: null }],
      temp: 31,
      hum: 56,
    });

    renderPage();

    fireEvent.click(await screen.findByText('LOT-BRA-2025-001'));

    expect(await screen.findByText('Entreposé · Entrepôt Manaus')).toBeInTheDocument();
    expect(screen.getByText('31°C')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(mockedQueries.fetchLotDetail).toHaveBeenCalledWith(expect.anything(), 'lot-uuid-1');
  });

  it('shows an error state when the lots fetch fails', async () => {
    mockedQueries.fetchLotsServer.mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText(/Impossible de charger les données/)).toBeInTheDocument();
  });
});
