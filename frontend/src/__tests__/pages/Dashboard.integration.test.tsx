import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/page';
import { LanguageProvider } from '@/contexts/LanguageContext';
import * as queries from '@/lib/api/queries';

jest.mock('@/lib/api/queries');

const mockedQueries = queries as jest.Mocked<typeof queries>;

function renderPage() {
  return render(
    <LanguageProvider>
      <DashboardPage />
    </LanguageProvider>,
  );
}

describe('DashboardPage container', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches, adapts and renders the dashboard from the API', async () => {
    mockedQueries.fetchConsolidatedSummary.mockResolvedValue({
      totalLots: 3,
      distribution: { conforme: 2, alerte: 1, perime: 0 },
    });
    mockedQueries.fetchWarehouseConditions.mockResolvedValue([]);
    mockedQueries.fetchRecentAlerts.mockResolvedValue([
      {
        id: 'a-1',
        severity: 'critique',
        icon: '⛔',
        bgColor: '#FEF2F2',
        borderColor: '#9B1C1C',
        type: 'expired_lot',
        subject: 'LOT-BRA-2025-001',
        status: 'active',
        triggeredAt: '2025-01-05T09:00:00.000Z',
        resolvedAt: null,
      },
    ]);

    renderPage();

    // KPI + conformity come from the consolidated summary.
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('Statut des Lots')).toBeInTheDocument();
    // The adapted alert surfaces in the recent-alerts preview.
    expect(screen.getByText('Lot périmé — LOT-BRA-2025-001')).toBeInTheDocument();
    // enTransit has no API source -> rendered as 0, never a placeholder dash.
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('shows an error state when the API fails', async () => {
    mockedQueries.fetchConsolidatedSummary.mockRejectedValue(new Error('boom'));
    mockedQueries.fetchWarehouseConditions.mockResolvedValue([]);
    mockedQueries.fetchRecentAlerts.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Impossible de charger les données/)).toBeInTheDocument();
  });
});
