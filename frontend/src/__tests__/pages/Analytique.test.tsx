import { render, screen, act } from '@testing-library/react';
import AnalytiquePage from '@/app/analytique/page';


beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AnalytiquePage', () => {
  it('renders metric labels', () => {
    render(<AnalytiquePage />);
    expect(screen.getByText('Taux de conformité')).toBeInTheDocument();
    expect(screen.getByText('Durée moy. stockage')).toBeInTheDocument();
    expect(screen.getByText('Capteurs en ligne')).toBeInTheDocument();
    expect(screen.getByText('Pertes évitées')).toBeInTheDocument();
  });

  it('renders trend texts', () => {
    render(<AnalytiquePage />);
    expect(screen.getByText('↑ +4 pts vs mois dernier')).toBeInTheDocument();
    expect(screen.getByText('cible FIFO < 180 j')).toBeInTheDocument();
    expect(screen.getByText('2 dégradés')).toBeInTheDocument();
    expect(screen.getByText('grâce aux alertes IoT')).toBeInTheDocument();
  });

  it('animated numbers reach target values after animation', () => {
    render(<AnalytiquePage />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/70%/)).toBeInTheDocument();
    expect(screen.getByText(/142 j/)).toBeInTheDocument();
    expect(screen.getByText(/18\/20/)).toBeInTheDocument();
    expect(screen.getByText(/96%/)).toBeInTheDocument();
  });
});
