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
    localStorage.clear();
  });

  it('renders FutureKawa logo text', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('FutureKawa')).toBeInTheDocument();
  });

  it('renders the jargon-free subtitle', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Suivi des stocks')).toBeInTheDocument();
  });

  it('translates the subtitle to the active language', () => {
    localStorage.setItem('app-language', 'es');
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Seguimiento de stocks')).toBeInTheDocument();
  });

  it('renders all menu navigation items', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gestion des Lots')).toBeInTheDocument();
    expect(screen.getByText('Suivi des entrepôts')).toBeInTheDocument();
    expect(screen.getByText('Alertes')).toBeInTheDocument();
    expect(screen.getByText('Exploitations')).toBeInTheDocument();
    expect(screen.queryByText('Analytique')).not.toBeInTheDocument();
  });

  it('links to the help center', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Aide')).toBeInTheDocument();
  });

  it('no longer links to the removed Paramètres page', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.queryByText('Paramètres')).not.toBeInTheDocument();
  });

  it('no longer shows a hardcoded lots count badge', () => {
    // The sidebar is pure navigation chrome and does not fetch; the honest lots
    // total lives on the lots page, sourced from the siège.
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.queryByText('248')).not.toBeInTheDocument();
  });

  it('no longer shows a hardcoded alerts count badge', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('no longer shows the hardcoded conformity widget', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.queryByText('Conformité globale')).not.toBeInTheDocument();
    expect(screen.queryByText('70%')).not.toBeInTheDocument();
  });

  it('renders the Menu section header and drops the now-empty Général section', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.queryByText('Général')).not.toBeInTheDocument();
  });

  it('renders navigation links with correct href', () => {
    render(<LanguageProvider><Sidebar /></LanguageProvider>);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');

    const lotsLink = screen.getByText('Gestion des Lots').closest('a');
    expect(lotsLink).toHaveAttribute('href', '/lots');
  });
});
