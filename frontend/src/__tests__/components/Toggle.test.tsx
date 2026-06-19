import { render, screen, fireEvent } from '@testing-library/react';
import Toggle from '@/components/ui/Toggle';


describe('Toggle', () => {
  it('renders a button', () => {
    render(<Toggle enabled={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies enabled styling when on', () => {
    render(<Toggle enabled={true} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-espresso-600');
  });

  it('applies disabled styling when off', () => {
    render(<Toggle enabled={false} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-[#D9C9B8]');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<Toggle enabled={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
