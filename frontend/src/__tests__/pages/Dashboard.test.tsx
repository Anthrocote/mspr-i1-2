import { render, screen } from '@testing-library/react';
import DashboardView from '@/app/DashboardView';
import type { Alert, Warehouse } from '@/types';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Inline presentation fixtures: the same adapted shape the queries produce at
// runtime, built here so the view test needs neither the network nor the mock
// data module. The container's fetch wiring is covered in
// Dashboard.integration.test.tsx.
const WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-sp', name: 'São Paulo A', country: 'Brésil', countryCode: 'br', flag: '🇧🇷',
    temp: '29°C', hum: '55%', tempNum: 29, humNum: 55, tempRange: [26, 32], humRange: [53, 57],
    idealTemp: '29°C ±3', idealHum: '55% ±2', lots: 48,
  },
  {
    // Temperature sits at the tolerance edge -> derived exception.
    id: 'wh-qt', name: 'Quito B', country: 'Équateur', countryCode: 'ec', flag: '🇪🇨',
    temp: '34°C', hum: '60%', tempNum: 34, humNum: 60, tempRange: [28, 34], humRange: [57, 63],
    idealTemp: '31°C ±3', idealHum: '60% ±3', lots: 37,
  },
  {
    // Humidity beyond its band -> derived exception.
    id: 'wh-gy', name: 'Guayaquil A', country: 'Équateur', countryCode: 'ec', flag: '🇪🇨',
    temp: '30°C', hum: '64%', tempNum: 30, humNum: 64, tempRange: [28, 34], humRange: [57, 63],
    idealTemp: '31°C ±3', idealHum: '60% ±3', lots: 21,
  },
];

function alert(id: string, severity: Alert['severity'], title: string): Alert {
  const p = severity === 'critique'
    ? { level: 'Critique', icon: '⛔', variant: 'err' as const, bgColor: '#FEF2F2', borderColor: '#9B1C1C' }
    : { level: 'Alerte', icon: '🌡️', variant: 'warn' as const, bgColor: '#FEF3E2', borderColor: '#B45309' };
  const [typeLabel, subject] = title.split(' — ');
  const type = typeLabel === 'Lot périmé' ? 'expired_lot'
    : typeLabel === 'Capteur hors ligne' ? 'sensor_offline'
    : 'out_of_range';
  return {
    id, severity, title, description: 'Déclenchée le 5 jan. 2025', time: '5 jan. 2025',
    type, typeLabel, subject: subject ?? '—', status: 'active' as const,
    dateTime: '5 jan. 2025 09:00', resolvedDateTime: null,
    ...p,
  };
}

const ALERTS: Alert[] = [
  alert('a1', 'critique', 'Lot périmé — LOT-BR-2023-00018'),
  alert('a2', 'critique', 'Lot périmé — LOT-EC-2023-00045'),
  alert('a3', 'alerte', 'Condition hors plage — Quito B'),
  alert('a4', 'alerte', 'Condition hors plage — Bogotá C'),
  alert('a5', 'alerte', 'Condition hors plage — Guayaquil A'),
  alert('a6', 'alerte', 'Lot périmé — LOT-CO-2023-00077'),
  alert('a7', 'alerte', 'Lot périmé — LOT-BR-2024-00760'),
];

function renderDashboard() {
  return render(
    <LanguageProvider>
      <DashboardView
        totalLots={248}
        enTransit={14}
        distribution={{ conforme: 174, alerte: 72, perime: 2 }}
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

  it('renders 0 for En Transit when the value is unavailable', () => {
    render(
      <LanguageProvider>
        <DashboardView
          totalLots={10}
          enTransit={null}
          distribution={{ conforme: 8, alerte: 2, perime: 1 }}
          warehouses={[]}
          alerts={[]}
        />
      </LanguageProvider>,
    );
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
