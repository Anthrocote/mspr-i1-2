import { render, screen, fireEvent } from '@testing-library/react';
import LotsPage from '@/app/lots/page';

describe('LotsPage', () => {
  it('renders filter chips', () => {
    render(<LotsPage />);
    expect(screen.getByRole('button', { name: 'Tous les lots' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🇧🇷 Brésil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🇪🇨 Équateur' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🇨🇴 Colombie' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alertes actives' })).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<LotsPage />);
    expect(screen.getByText('Filtrer')).toBeInTheDocument();
    expect(screen.getByText('Nouveau Lot')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<LotsPage />);
    expect(screen.getByText('ID Lot')).toBeInTheDocument();
    expect(screen.getByText('Entrepôt')).toBeInTheDocument();
    expect(screen.getByText('Stocké le')).toBeInTheDocument();
  });

  it('renders all lot IDs', () => {
    render(<LotsPage />);
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
    expect(screen.getByText('LOT-EC-2024-00107')).toBeInTheDocument();
    expect(screen.getByText('LOT-CO-2024-00342')).toBeInTheDocument();
    expect(screen.getByText('LOT-BR-2024-00992')).toBeInTheDocument();
  });

  it('shows detail view when clicking a lot row', () => {
    render(<LotsPage />);
    const lotRow = screen.getByText('LOT-BR-2023-00018').closest('[class*="cursor-pointer"]');
    if (lotRow) fireEvent.click(lotRow);
    expect(screen.getByText('Retour aux lots')).toBeInTheDocument();
    expect(screen.getByText('Traçabilité FIFO')).toBeInTheDocument();
  });

  it('detail view shows lot IoT conditions', () => {
    render(<LotsPage />);
    const lotRow = screen.getByText('LOT-BR-2023-00018').closest('[class*="cursor-pointer"]');
    if (lotRow) fireEvent.click(lotRow);
    expect(screen.getByText('Conditions actuelles (IoT)')).toBeInTheDocument();
    expect(screen.getByText('Température')).toBeInTheDocument();
    expect(screen.getByText('Humidité')).toBeInTheDocument();
  });

  it('detail view shows action buttons', () => {
    render(<LotsPage />);
    const lotRow = screen.getByText('LOT-BR-2023-00018').closest('[class*="cursor-pointer"]');
    if (lotRow) fireEvent.click(lotRow);
    expect(screen.getByText('Valider conforme')).toBeInTheDocument();
    expect(screen.getByText('Marquer en transit')).toBeInTheDocument();
  });

  it('returns to list when clicking back button', () => {
    render(<LotsPage />);
    const lotRow = screen.getByText('LOT-BR-2023-00018').closest('[class*="cursor-pointer"]');
    if (lotRow) fireEvent.click(lotRow);
    expect(screen.getByText('Retour aux lots')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Retour aux lots'));
    expect(screen.getByRole('button', { name: 'Tous les lots' })).toBeInTheDocument();
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
  });

  it('filters lots by country', () => {
    render(<LotsPage />);
    fireEvent.click(screen.getByRole('button', { name: '🇨🇴 Colombie' }));
    expect(screen.getByText('LOT-CO-2024-00342')).toBeInTheDocument();
    expect(screen.queryByText('LOT-BR-2023-00018')).not.toBeInTheDocument();
  });

  it('filters alertes actives', () => {
    render(<LotsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Alertes actives' }));
    expect(screen.queryByText('LOT-CO-2024-00342')).not.toBeInTheDocument();
    expect(screen.getByText('LOT-BR-2023-00018')).toBeInTheDocument();
  });

  it('detail view shows FIFO timeline steps', () => {
    render(<LotsPage />);
    const lotRow = screen.getByText('LOT-BR-2023-00018').closest('[class*="cursor-pointer"]');
    if (lotRow) fireEvent.click(lotRow);
    expect(screen.getByText('Récolté')).toBeInTheDocument();
    expect(screen.getByText('Stocké')).toBeInTheDocument();
    expect(screen.getByText('Surveillance en cours')).toBeInTheDocument();
  });
});
