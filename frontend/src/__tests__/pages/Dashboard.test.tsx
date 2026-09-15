import { render, screen } from '@testing-library/react';
import DashboardView from '@/app/DashboardView';
import { CONSOLIDATED, WAREHOUSES, ALERTS } from '@/data/mock';
import { LanguageProvider } from '@/contexts/LanguageContext';

// The pure view is tested against the mock fixtures: same presentation data the
// adapters produce at runtime, without needing the network. The container's
// fetch wiring is covered in Dashboard.integration.test.tsx.
function renderDashboard() {
  return render(
    <LanguageProvider>
      <DashboardView
        totalLots={CONSOLIDATED.totalLots}
        enTransit={CONSOLIDATED.enTransit}
        distribution={CONSOLIDATED.distribution}
        warehouses={WAREHOUSES}
        alerts={ALERTS}
      />
    </LanguageProvider>,
  );
}

describe('DashboardView', () => {
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
    expect(screen.getByText('Lot périmé — LOT-BR-2023-00018')).toBeInTheDocument();
  });

  it('signals the alerts beyond the preview with a +N link', () => {
    renderDashboard();
    // 7 alerts, 4 previewed -> "+3 autres alertes"
    expect(screen.getByText(/\+3 autres alertes/)).toBeInTheDocument();
  });

  it('renders an em dash for En Transit when the value is unavailable', () => {
    render(
      <LanguageProvider>
        <DashboardView
          totalLots={10}
          enTransit={null}
          distribution={{ conforme: 8, alerte: 2, perime: 0 }}
          warehouses={[]}
          alerts={[]}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
