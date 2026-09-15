import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlertesPage from '@/app/alertes/page';
import type { Alert } from '@/types';
import type { AlertsPageResult } from '@/lib/api/queries';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';
import * as queries from '@/lib/api/queries';

jest.mock('@/lib/api/queries');

const mockedQueries = queries as jest.Mocked<typeof queries>;

function alert(over: Partial<Alert> & { id: string; typeLabel: string; subject: string }): Alert {
  return {
    severity: 'alerte',
    level: 'Alerte',
    icon: '🌡️',
    variant: 'warn',
    title: `${over.typeLabel} — ${over.subject}`,
    description: '',
    time: '5 jan. 2026',
    bgColor: '#FEF3E2',
    borderColor: '#B45309',
    status: 'active',
    dateTime: '5 jan. 2026 14:32',
    resolvedDateTime: null,
    ...over,
  };
}

const ALERTS: Alert[] = [
  alert({ id: 'a1', typeLabel: 'Capteur hors ligne', subject: 'Entrepôt Équateur', icon: '📡', dateTime: '15 sep. 2026 23:13', status: 'resolved', resolvedDateTime: '15 sep. 2026 23:15' }),
  alert({ id: 'a2', typeLabel: 'Condition hors plage', subject: 'Quito B', dateTime: '15 sep. 2026 22:25' }),
];

function pageResult(over: Partial<AlertsPageResult> = {}): AlertsPageResult {
  return { alerts: ALERTS, page: 1, pages: 1, total: ALERTS.length, ...over };
}

function renderPage() {
  return render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
}

describe('AlertesPage container', () => {
  beforeEach(() => {
    mockedQueries.fetchAlertsPage.mockResolvedValue(pageResult());
  });

  afterEach(() => jest.clearAllMocks());

  it('renders the current page of the alert history as a table', async () => {
    renderPage();
    expect(await screen.findByText('Capteur hors ligne')).toBeInTheDocument();
    expect(screen.getByText('Condition hors plage')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt Équateur')).toBeInTheDocument();
    expect(screen.getByText('Quito B')).toBeInTheDocument();
    // Date AND time are shown.
    expect(screen.getByText('15 sep. 2026 23:13')).toBeInTheDocument();
  });

  it('shows the total alert count', async () => {
    renderPage();
    expect(await screen.findByText('2 alertes')).toBeInTheDocument();
  });

  it('shows the resolution status of each alert', async () => {
    renderPage();
    await screen.findByText('Capteur hors ligne');
    expect(screen.getByText('Résolue')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    // The resolved alert shows its resolution time; the active one shows a dash.
    expect(screen.getByText('15 sep. 2026 23:15')).toBeInTheDocument();
  });

  it('defaults to the full history (status=all)', async () => {
    renderPage();
    await screen.findByText('Capteur hors ligne');
    expect(mockedQueries.fetchAlertsPage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'all', page: 1 }),
      expect.anything(),
    );
  });

  it('refetches with the chosen status when the filter changes', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Filtrer'));
    const select = screen.getByDisplayValue('Tous les statuts');
    fireEvent.change(select, { target: { value: 'resolved' } });
    await waitFor(() =>
      expect(mockedQueries.fetchAlertsPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'resolved', page: 1 }),
        expect.anything(),
      ),
    );
  });

  it('drives pagination from the server metadata', async () => {
    mockedQueries.fetchAlertsPage.mockResolvedValue(pageResult({ page: 1, pages: 3, total: 30 }));
    renderPage();
    fireEvent.click(await screen.findByText('Suivant'));
    await waitFor(() =>
      expect(mockedQueries.fetchAlertsPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ page: 2 }),
        expect.anything(),
      ),
    );
  });

  it('shows an error state when the fetch fails', async () => {
    mockedQueries.fetchAlertsPage.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText(/Impossible de charger les données/)).toBeInTheDocument();
  });
});
