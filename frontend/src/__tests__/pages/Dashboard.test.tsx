import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/page';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderDashboard() {
  return render(<LanguageProvider><DashboardPage /></LanguageProvider>);
}

describe('DashboardPage', () => {
  it('renders the Total Lots KPI with the consolidated value', () => {
    renderDashboard();
    expect(screen.getByText('Total Lots')).toBeInTheDocument();
    expect(screen.getByText('248')).toBeInTheDocument();
  });

  it('renders the En Transit KPI with its value', () => {
    renderDashboard();
    expect(screen.getByText('En Transit')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('states conformity once via the conformity bar (rate + distribution)', () => {
    renderDashboard();
    expect(screen.getByText('Statut des Lots')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('174')).toBeInTheDocument();
  });

  it('renders the watchlist with warehouses over their threshold', () => {
    renderDashboard();
    expect(screen.getByText('À surveiller')).toBeInTheDocument();
    // Quito B (temp at tolerance edge) and Guayaquil A (humidity over range)
    // are derived exceptions, so they must surface here.
    expect(screen.getByText('Quito B')).toBeInTheDocument();
    expect(screen.getByText('Guayaquil A')).toBeInTheDocument();
  });

  it('renders recent alerts, most severe first', () => {
    renderDashboard();
    expect(screen.getByText('Alertes récentes')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-CO-2023-00018')).toBeInTheDocument();
  });

  it('signals the alerts beyond the preview with a +N link', () => {
    renderDashboard();
    // 7 alerts, 4 previewed -> "+3 autres alertes"
    expect(screen.getByText(/\+3 autres alertes/)).toBeInTheDocument();
  });
});
