import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/page';

describe('DashboardPage', () => {
  it('renders Total Lots metric with value 248', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Total Lots')).toBeInTheDocument();
    expect(screen.getByText('248')).toBeInTheDocument();
  });

  it('renders En Alerte metric label', () => {
    render(<DashboardPage />);
    const enAlerteElements = screen.getAllByText('En Alerte');
    expect(enAlerteElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Lots Périmés metric label', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Lots Périmés')).toBeInTheDocument();
  });

  it('renders En Transit metric with value 14', () => {
    render(<DashboardPage />);
    const transitLabels = screen.getAllByText('En Transit');
    expect(transitLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('renders all 4 metric labels', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Total Lots')).toBeInTheDocument();
    expect(screen.getAllByText('En Alerte').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Lots Périmés')).toBeInTheDocument();
    const transitLabels = screen.getAllByText('En Transit');
    expect(transitLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Entrepôts surveillés section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Entrepôts surveillés')).toBeInTheDocument();
  });

  it('renders warehouse names', () => {
    render(<DashboardPage />);
    expect(screen.getByText('São Paulo A')).toBeInTheDocument();
    expect(screen.getByText('Rio C')).toBeInTheDocument();
    expect(screen.getByText('Quito B')).toBeInTheDocument();
    expect(screen.getByText('Guayaquil A')).toBeInTheDocument();
  });

  it('renders Alertes récentes section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Alertes récentes')).toBeInTheDocument();
  });

  it('renders dashboard alert titles', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Lot périmé — LOT-CO-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('Température hors plage — Quito B')).toBeInTheDocument();
    expect(screen.getByText('Humidité élevée — Bogotá C')).toBeInTheDocument();
  });

  it('renders Voir tout links', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Voir tout →')).toBeInTheDocument();
    expect(screen.getByText('Tout voir →')).toBeInTheDocument();
  });
});
