import { render, screen } from '@testing-library/react';
import MetricCard from '@/components/ui/MetricCard';


describe('MetricCard', () => {
  const defaultProps = {
    label: 'Total Lots',
    value: '248',
    trend: '↑ +12 ce mois',
    icon: <svg data-testid="icon" />,
  };

  it('renders the label', () => {
    render(<MetricCard {...defaultProps} />);
    expect(screen.getByText('Total Lots')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<MetricCard {...defaultProps} />);
    expect(screen.getByText('248')).toBeInTheDocument();
  });

  it('renders the trend text', () => {
    render(<MetricCard {...defaultProps} />);
    expect(screen.getByText('↑ +12 ce mois')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<MetricCard {...defaultProps} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies dark variant styling', () => {
    const { container } = render(<MetricCard {...defaultProps} variant="dark" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-espresso-800');
  });

  it('applies green variant background', () => {
    const { container } = render(<MetricCard {...defaultProps} variant="green" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-[#1E5220]');
  });

  it('applies alert variant styling', () => {
    const { container } = render(<MetricCard {...defaultProps} variant="alert" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-parchment-0');
  });

  it('defaults to light variant', () => {
    const { container } = render(<MetricCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-parchment-0');
  });
});
