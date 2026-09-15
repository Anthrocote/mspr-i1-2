import { render, screen, fireEvent } from '@testing-library/react';
import LotsPage from '@/app/lots/page';
import type { Farm, Lot } from '@/types';
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
  flag: '🇧🇷',
  warehouse: 'Entrepôt Manaus',
  exploitationId: 'exp-1',
  constitutedAt: '17 juil. 2026',
  storageDate: '17 juil. 2026',
  stays: [],
  duration: '60 j',
  durationDays: 60,
  status: 'Conforme',
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
  certification: '—',
  certVariant: 'neutral',
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
  afterEach(() => jest.clearAllMocks());

  it('fetches lots + exploitations and renders the adapted table', async () => {
    mockedQueries.fetchLots.mockResolvedValue([LOT]);
    mockedQueries.fetchExploitations.mockResolvedValue([FARM]);

    renderPage();

    expect(await screen.findByText('LOT-BRA-2025-001')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt Manaus')).toBeInTheDocument();
    expect(screen.getByText('60 j')).toBeInTheDocument();
  });

  it('fetches the detail (stays + conditions) when a lot is opened', async () => {
    mockedQueries.fetchLots.mockResolvedValue([LOT]);
    mockedQueries.fetchExploitations.mockResolvedValue([FARM]);
    mockedQueries.fetchLotDetail.mockResolvedValue({
      lot: LOT,
      stays: [{ warehouse: 'Entrepôt Manaus', entree: '17 juil. 2026', sortie: null }],
      temp: 31,
      hum: 56,
    });

    renderPage();

    fireEvent.click(await screen.findByText('LOT-BRA-2025-001'));

    // Detail fetch fills the stay history and the current conditions.
    expect(await screen.findByText('Entreposé · Entrepôt Manaus')).toBeInTheDocument();
    expect(screen.getByText('31°C')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(mockedQueries.fetchLotDetail).toHaveBeenCalledWith(expect.anything(), 'lot-uuid-1');
  });

  it('shows an error state when the lots fetch fails', async () => {
    mockedQueries.fetchLots.mockRejectedValue(new Error('boom'));
    mockedQueries.fetchExploitations.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Impossible de charger les données/)).toBeInTheDocument();
  });
});
