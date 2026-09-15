import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import DinoRunner from '@/components/game/DinoRunner';

function renderGame() {
  return render(
    <LanguageProvider>
      <DinoRunner />
    </LanguageProvider>
  );
}

describe('DinoRunner', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the ready screen with score and instructions before starting', () => {
    renderGame();
    expect(screen.getByRole('button', { name: 'dino-game' })).toBeInTheDocument();
    expect(screen.getAllByText(/Score: 0/).length).toBeGreaterThan(0);
    expect(screen.getByText('Cliquez ou appuyez sur Espace pour sauter')).toBeInTheDocument();
  });

  it('hides the instructions overlay once the game starts', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    expect(screen.queryByText('Cliquez ou appuyez sur Espace pour sauter')).not.toBeInTheDocument();
  });

  it('increments the score over time while playing', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(1050);
    });
    expect(screen.getByText(/Score: 10/)).toBeInTheDocument();
  });

  it('jumps over an obstacle on Space without ending the game', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(screen.queryByText('Partie terminée')).not.toBeInTheDocument();
    (Math.random as jest.Mock).mockRestore();
  });

  it('ends the game on collision and records the best score', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(4500);
    });
    expect(screen.getByText('Partie terminée')).toBeInTheDocument();
    expect(localStorage.getItem('dino-best-score')).not.toBeNull();
    (Math.random as jest.Mock).mockRestore();
  });

  it('shows the previous best score on the ready screen after a reload', () => {
    localStorage.setItem('dino-best-score', '42');
    renderGame();
    expect(screen.getAllByText(/Meilleur score: 42/).length).toBeGreaterThan(0);
  });

  it('falls back to 0 when the stored best score is not a number', () => {
    localStorage.setItem('dino-best-score', 'abc');
    renderGame();
    expect(screen.getAllByText(/Meilleur score: 0/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
