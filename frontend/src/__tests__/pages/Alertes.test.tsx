import { render, screen, fireEvent } from '@testing-library/react';
import AlertesPage from '@/app/alertes/page';
import type { Alert } from '@/types';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';
import * as queries from '@/lib/api/queries';

jest.mock('@/lib/api/queries');

const mockedQueries = queries as jest.Mocked<typeof queries>;

function critique(id: string, title: string, description: string, time: string): Alert {
  return { id, severity: 'critique', level: 'Critique', icon: '⛔', variant: 'err', title, description, time, bgColor: '#FEF2F2', borderColor: '#9B1C1C' };
}
function alerte(id: string, title: string, description: string, time: string): Alert {
  return { id, severity: 'alerte', level: 'Alerte', icon: '🌡️', variant: 'warn', title, description, time, bgColor: '#FEF3E2', borderColor: '#B45309' };
}

const ALERTS: Alert[] = [
  critique('a1', 'Lot périmé — LOT-BR-2023-00018', '387 j de stockage · seuil dépassé', 'il y a 5 min'),
  critique('a2', 'Lot périmé — LOT-EC-2023-00045', '372 j de stockage', 'il y a 40 min'),
  alerte('a3', 'Température hors plage — Quito B', '34°C relevé · seuil 31°C ±3', 'il y a 18 min'),
  alerte('a4', 'Humidité élevée — Bogotá C', '83% relevé', 'il y a 1 h'),
  alerte('a5', 'Péremption imminente — LOT-CO-2023-00077', '360 j de stockage', 'il y a 2 h'),
  alerte('a6', 'Stockage prolongé — LOT-BR-2024-00760', '128 j', 'il y a 3 h'),
  alerte('a7', 'Capteur dégradé — Guayaquil A', 'latence élevée', 'il y a 4 h'),
];

function renderPage() {
  return render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
}

describe('AlertesPage container', () => {
  beforeEach(() => {
    mockedQueries.fetchRecentAlerts.mockResolvedValue(ALERTS);
  });

  afterEach(() => jest.clearAllMocks());

  it('renders all 7 alerts by default', async () => {
    renderPage();
    expect(await screen.findByText('Toutes · 7')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-EC-2023-00045')).toBeInTheDocument();
    expect(screen.getByText('Température hors plage — Quito B')).toBeInTheDocument();
    expect(screen.getByText('Humidité élevée — Bogotá C')).toBeInTheDocument();
    expect(screen.getByText('Capteur dégradé — Guayaquil A')).toBeInTheDocument();
  });

  it('renders filter chips with counts', async () => {
    renderPage();
    expect(await screen.findByText('Critiques · 2')).toBeInTheDocument();
    expect(screen.getByText('Avertissements · 5')).toBeInTheDocument();
  });

  it('filters to only critiques when clicking Critiques filter', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Critiques · 2'));
    expect(screen.getByText('Lot périmé — LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-EC-2023-00045')).toBeInTheDocument();
    expect(screen.queryByText('Température hors plage — Quito B')).not.toBeInTheDocument();
    expect(screen.queryByText('Capteur dégradé — Guayaquil A')).not.toBeInTheDocument();
  });

  it('filters to only avertissements when clicking Avertissements filter', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Avertissements · 5'));
    expect(screen.queryByText('Lot périmé — LOT-BR-2023-00018')).not.toBeInTheDocument();
    expect(screen.getByText('Température hors plage — Quito B')).toBeInTheDocument();
    expect(screen.getByText('Humidité élevée — Bogotá C')).toBeInTheDocument();
    expect(screen.getByText('Capteur dégradé — Guayaquil A')).toBeInTheDocument();
  });

  it('shows alert descriptions', async () => {
    renderPage();
    expect(await screen.findByText(/387 j de stockage/)).toBeInTheDocument();
    expect(screen.getByText(/34°C relevé/)).toBeInTheDocument();
  });

  it('shows alert times', async () => {
    renderPage();
    expect(await screen.findByText('il y a 5 min')).toBeInTheDocument();
    expect(screen.getByText('il y a 40 min')).toBeInTheDocument();
  });

  it('shows severity badges', async () => {
    renderPage();
    await screen.findByText('Toutes · 7');
    const critiqueBadges = screen.getAllByText('Critique');
    expect(critiqueBadges.length).toBe(2);
    const alerteBadges = screen.getAllByText('Alerte');
    expect(alerteBadges.length).toBe(5);
  });

  it('exposes no write action (read-only siège view)', async () => {
    renderPage();
    await screen.findByText('Toutes · 7');
    expect(screen.queryByText('Traiter →')).not.toBeInTheDocument();
    expect(screen.queryByText(/Résoudre/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reporter/)).not.toBeInTheDocument();
    // Only the three filter chips remain interactive; no per-alert button.
    expect(screen.getAllByRole('button').length).toBe(3);
  });
});
