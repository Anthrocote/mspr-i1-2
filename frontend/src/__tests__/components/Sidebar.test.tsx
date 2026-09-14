import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';
import { LanguageProvider } from '@/contexts/LanguageContext';


let mockPathname = '/';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockPathname = '/';
  });

  it('renders FutureKawa logo text', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('FutureKawa')).toBeInTheDocument();
  });

  it('renders the jargon-free subtitle', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Suivi des stocks')).toBeInTheDocument();
  });

  it('renders all menu navigation items', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Lots')).toBeInTheDocument();
    expect(screen.getByText('Suivi des entrepôts')).toBeInTheDocument();
    expect(screen.getByText('Alertes')).toBeInTheDocument();
    expect(screen.getByText('Exploitations')).toBeInTheDocument();
    expect(screen.getByText('Analytique')).toBeInTheDocument();
  });

  it('renders Paramètres in the general section', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
  });

  it('shows 248 badge on Gestion des Lots', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('248')).toBeInTheDocument();
  });

  it('shows 7 badge on Alertes', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('no longer shows the hardcoded conformity widget', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.queryByText('Conformité globale')).not.toBeInTheDocument();
    expect(screen.queryByText('70%')).not.toBeInTheDocument();
  });

  it('renders Menu and Général section headers', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Général')).toBeInTheDocument();
  });

  it('renders navigation links with correct href', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');

    const lotsLink = screen.getByText('Gestion des Lots').closest('a');
    expect(lotsLink).toHaveAttribute('href', '/lots');
  });
});
