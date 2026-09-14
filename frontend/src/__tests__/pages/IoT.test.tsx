import { render, screen } from '@testing-library/react';
import IoTPage from '@/app/iot/page';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';

function renderIoT() {
  return render(
    <LanguageProvider>
      <SearchProvider>
        <IoTPage />
      </SearchProvider>
    </LanguageProvider>
  );
}

describe('IoTPage', () => {
  it('drives the charts from a grouped warehouse selector', () => {
    renderIoT();
    expect(screen.getByLabelText('Entrepôt')).toBeInTheDocument();
    // Every warehouse is reachable as an option.
    expect(screen.getByRole('option', { name: 'São Paulo A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Quito B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medellín D' })).toBeInTheDocument();
  });

  it('defaults to the first at-risk warehouse and shows both metric charts', () => {
    renderIoT();
    expect(screen.getByText('Température · Quito B')).toBeInTheDocument();
    expect(screen.getByText('Humidité · Quito B')).toBeInTheDocument();
  });

  it('flags the selected at-risk warehouse as out of range', () => {
    renderIoT();
    // Quito B drifts past its band, so both charts report it.
    expect(screen.getAllByText(/Hors plage/).length).toBeGreaterThanOrEqual(1);
  });

  it('offers time-range controls', () => {
    renderIoT();
    expect(screen.getByRole('button', { name: '24 h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 j' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 j' })).toBeInTheDocument();
  });

  it('drops the fake live-chart affordances', () => {
    renderIoT();
    expect(screen.queryByText('Dérive détectée')).not.toBeInTheDocument();
    expect(screen.queryByText(/Flux temps réel/)).not.toBeInTheDocument();
  });
});
