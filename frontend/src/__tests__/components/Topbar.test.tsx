import { render, screen } from '@testing-library/react';
import Topbar from '@/components/layout/Topbar';


describe('Topbar', () => {
  it('renders the title', () => {
    render(<Topbar title="Dashboard" subtitle="Vue globale" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<Topbar title="Dashboard" subtitle="Vue globale" />);
    expect(screen.getByText('Vue globale')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Topbar title="Test" subtitle="Sub" />);
    expect(screen.getByPlaceholderText('Rechercher un lot, un entrepôt…')).toBeInTheDocument();
  });

  it('renders notification bell button', () => {
    render(<Topbar title="Test" subtitle="Sub" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders user name Marina Joaquim', () => {
    render(<Topbar title="Test" subtitle="Sub" />);
    expect(screen.getByText('Marina Joaquim')).toBeInTheDocument();
  });

  it('renders user role', () => {
    render(<Topbar title="Test" subtitle="Sub" />);
    expect(screen.getByText('Responsable Qualité')).toBeInTheDocument();
  });

  it('renders user initials MJ', () => {
    render(<Topbar title="Test" subtitle="Sub" />);
    expect(screen.getByText('MJ')).toBeInTheDocument();
  });
});
