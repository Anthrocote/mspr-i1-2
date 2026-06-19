import { render, screen } from '@testing-library/react';
import CountryTag from '@/components/ui/CountryTag';

describe('CountryTag', () => {
  it('renders children', () => {
    render(<CountryTag countryCode="br">🇧🇷 Brésil</CountryTag>);
    expect(screen.getByText('🇧🇷 Brésil')).toBeInTheDocument();
  });

  it('applies Brazil colors', () => {
    render(<CountryTag countryCode="br">Brésil</CountryTag>);
    const el = screen.getByText('Brésil');
    expect(el.className).toContain('bg-[#EFF7EF]');
    expect(el.className).toContain('text-[#1A4D1C]');
    expect(el.className).toContain('border-[#A5D6A7]');
  });

  it('applies Ecuador colors', () => {
    render(<CountryTag countryCode="ec">Équateur</CountryTag>);
    const el = screen.getByText('Équateur');
    expect(el.className).toContain('bg-[#FEF9E7]');
    expect(el.className).toContain('text-[#7A4B00]');
    expect(el.className).toContain('border-[#F6D860]');
  });

  it('applies Colombia colors', () => {
    render(<CountryTag countryCode="co">Colombie</CountryTag>);
    const el = screen.getByText('Colombie');
    expect(el.className).toContain('bg-[#FEF0F0]');
    expect(el.className).toContain('text-[#7A1E1E]');
    expect(el.className).toContain('border-[#FCA5A5]');
  });

  it('renders as a span element', () => {
    render(<CountryTag countryCode="br">Test</CountryTag>);
    expect(screen.getByText('Test').tagName).toBe('SPAN');
  });
});
