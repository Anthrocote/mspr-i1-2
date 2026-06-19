import { render, screen } from '@testing-library/react';
import IoTPage from '@/app/iot/page';

describe('IoTPage', () => {
  it('renders all 6 warehouse names in card headers', () => {
    render(<IoTPage />);
    expect(screen.getByText(/🇧🇷 São Paulo A/)).toBeInTheDocument();
    expect(screen.getByText(/🇧🇷 Rio C/)).toBeInTheDocument();
    expect(screen.getByText(/🇪🇨 Quito B/)).toBeInTheDocument();
    expect(screen.getByText(/🇪🇨 Guayaquil A/)).toBeInTheDocument();
    expect(screen.getByText(/🇨🇴 Bogotá C/)).toBeInTheDocument();
    expect(screen.getByText(/🇨🇴 Medellín D/)).toBeInTheDocument();
  });

  it('shows Temp. and Hum. labels in warehouse cards', () => {
    render(<IoTPage />);
    const tempLabels = screen.getAllByText('Temp.');
    expect(tempLabels.length).toBe(6);
    const humLabels = screen.getAllByText('Hum.');
    expect(humLabels.length).toBe(6);
  });

  it('shows warehouse status badges', () => {
    render(<IoTPage />);
    const conformes = screen.getAllByText('Conforme');
    expect(conformes.length).toBeGreaterThanOrEqual(4);
    const alertes = screen.getAllByText('En Alerte');
    expect(alertes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders live chart section', () => {
    render(<IoTPage />);
    expect(screen.getByText(/Flux temps réel — Quito B/)).toBeInTheDocument();
  });

  it('shows drift detected indicator', () => {
    render(<IoTPage />);
    expect(screen.getByText('Dérive détectée')).toBeInTheDocument();
  });

  it('renders time axis labels', () => {
    render(<IoTPage />);
    expect(screen.getByText('00 h')).toBeInTheDocument();
    expect(screen.getByText('12 h')).toBeInTheDocument();
    expect(screen.getByText('24 h')).toBeInTheDocument();
  });

  it('shows lots count for warehouses', () => {
    render(<IoTPage />);
    expect(screen.getByText('48 lots')).toBeInTheDocument();
    expect(screen.getByText('37 lots')).toBeInTheDocument();
  });

  it('shows ideal ranges for warehouses', () => {
    render(<IoTPage />);
    const ideals = screen.getAllByText(/Idéal/);
    expect(ideals.length).toBeGreaterThanOrEqual(6);
  });
});
