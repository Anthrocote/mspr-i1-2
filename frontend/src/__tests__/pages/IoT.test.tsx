import { render, screen } from '@testing-library/react';
import IoTPage from '@/app/iot/page';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';

describe('IoTPage', () => {
  it('renders all 6 warehouse names in card headers', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText(/🇧🇷 São Paulo A/)).toBeInTheDocument();
    expect(screen.getByText(/🇧🇷 Rio C/)).toBeInTheDocument();
    expect(screen.getByText(/🇪🇨 Quito B/)).toBeInTheDocument();
    expect(screen.getByText(/🇪🇨 Guayaquil A/)).toBeInTheDocument();
    expect(screen.getByText(/🇨🇴 Bogotá C/)).toBeInTheDocument();
    expect(screen.getByText(/🇨🇴 Medellín D/)).toBeInTheDocument();
  });

  it('shows Temp. and Hum. labels in warehouse cards', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    const tempLabels = screen.getAllByText('Temp.');
    expect(tempLabels.length).toBe(6);
    const humLabels = screen.getAllByText('Hum.');
    expect(humLabels.length).toBe(6);
  });

  it('shows warehouse status badges', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    const conformes = screen.getAllByText('Conforme');
    expect(conformes.length).toBeGreaterThanOrEqual(4);
    const alertes = screen.getAllByText('En Alerte');
    expect(alertes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders live chart section', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText(/Flux temps réel — Quito B/)).toBeInTheDocument();
  });

  it('shows drift detected indicator', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText('Dérive détectée')).toBeInTheDocument();
  });

  it('renders time axis labels', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText('00 h')).toBeInTheDocument();
    expect(screen.getByText('12 h')).toBeInTheDocument();
    expect(screen.getByText('24 h')).toBeInTheDocument();
  });

  it('shows lots count for warehouses', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText('48 lots')).toBeInTheDocument();
    expect(screen.getByText('37 lots')).toBeInTheDocument();
  });

  it('shows ideal ranges for warehouses', () => {
    render(<LanguageProvider><SearchProvider><IoTPage /></SearchProvider></LanguageProvider>);
    const ideals = screen.getAllByText(/Idéal/);
    expect(ideals.length).toBeGreaterThanOrEqual(6);
  });
});
