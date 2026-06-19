import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge variant="ok">Conforme</Badge>);
    expect(screen.getByText('Conforme')).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    render(<Badge variant="ok">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies ok variant classes', () => {
    render(<Badge variant="ok">OK</Badge>);
    const el = screen.getByText('OK');
    expect(el.className).toContain('bg-[#EDF7EE]');
    expect(el.className).toContain('text-[#2E7D32]');
    expect(el.className).toContain('border-[#A5D6A7]');
  });

  it('applies warn variant classes', () => {
    render(<Badge variant="warn">Warning</Badge>);
    const el = screen.getByText('Warning');
    expect(el.className).toContain('bg-[#FEF3E2]');
    expect(el.className).toContain('text-[#B45309]');
  });

  it('applies err variant classes', () => {
    render(<Badge variant="err">Error</Badge>);
    const el = screen.getByText('Error');
    expect(el.className).toContain('bg-[#FEF2F2]');
    expect(el.className).toContain('text-[#9B1C1C]');
  });

  it('applies info variant classes', () => {
    render(<Badge variant="info">Info</Badge>);
    const el = screen.getByText('Info');
    expect(el.className).toContain('bg-[#EFF6FF]');
    expect(el.className).toContain('text-[#1E4D8C]');
  });

  it('applies neutral variant classes', () => {
    render(<Badge variant="neutral">Neutral</Badge>);
    const el = screen.getByText('Neutral');
    expect(el.className).toContain('text-[#7A5C40]');
  });

  it('has pill shape (rounded-full)', () => {
    render(<Badge variant="ok">Pill</Badge>);
    const el = screen.getByText('Pill');
    expect(el.className).toContain('rounded-full');
    expect(el.className).toContain('inline-flex');
  });

  it('accepts additional className', () => {
    render(<Badge variant="ok" className="custom-class">Custom</Badge>);
    const el = screen.getByText('Custom');
    expect(el.className).toContain('custom-class');
  });
});
