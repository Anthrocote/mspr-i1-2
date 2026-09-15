import { render, screen, fireEvent } from '@testing-library/react';
import AlertesPage from '@/app/alertes/page';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';


describe('AlertesPage', () => {
  it('renders all 7 alerts by default', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText('Toutes · 7')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-EC-2023-00045')).toBeInTheDocument();
    expect(screen.getByText('Température hors plage — Quito B')).toBeInTheDocument();
    expect(screen.getByText('Humidité élevée — Bogotá C')).toBeInTheDocument();
    expect(screen.getByText('Capteur dégradé — Guayaquil A')).toBeInTheDocument();
  });

  it('renders filter chips with counts', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText('Critiques · 2')).toBeInTheDocument();
    expect(screen.getByText('Avertissements · 5')).toBeInTheDocument();
  });

  it('filters to only critiques when clicking Critiques filter', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    fireEvent.click(screen.getByText('Critiques · 2'));
    expect(screen.getByText('Lot périmé — LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('Lot périmé — LOT-EC-2023-00045')).toBeInTheDocument();
    expect(screen.queryByText('Température hors plage — Quito B')).not.toBeInTheDocument();
    expect(screen.queryByText('Capteur dégradé — Guayaquil A')).not.toBeInTheDocument();
  });

  it('filters to only avertissements when clicking Avertissements filter', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    fireEvent.click(screen.getByText('Avertissements · 5'));
    expect(screen.queryByText('Lot périmé — LOT-BR-2023-00018')).not.toBeInTheDocument();
    expect(screen.getByText('Température hors plage — Quito B')).toBeInTheDocument();
    expect(screen.getByText('Humidité élevée — Bogotá C')).toBeInTheDocument();
    expect(screen.getByText('Capteur dégradé — Guayaquil A')).toBeInTheDocument();
  });

  it('shows alert descriptions', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText(/387 j de stockage/)).toBeInTheDocument();
    expect(screen.getByText(/34°C relevé/)).toBeInTheDocument();
  });

  it('shows alert times', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    expect(screen.getByText('il y a 5 min')).toBeInTheDocument();
    expect(screen.getByText('il y a 40 min')).toBeInTheDocument();
  });

  it('shows severity badges', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    const critiqueBadges = screen.getAllByText('Critique');
    expect(critiqueBadges.length).toBe(2);
    const alerteBadges = screen.getAllByText('Alerte');
    expect(alerteBadges.length).toBe(5);
  });

  it('exposes no write action (read-only siège view)', () => {
    render(<LanguageProvider><SearchProvider><AlertesPage /></SearchProvider></LanguageProvider>);
    expect(screen.queryByText('Traiter →')).not.toBeInTheDocument();
    expect(screen.queryByText(/Résoudre/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reporter/)).not.toBeInTheDocument();
    // Only the three filter chips remain interactive; no per-alert button.
    expect(screen.getAllByRole('button').length).toBe(3);
  });
});
