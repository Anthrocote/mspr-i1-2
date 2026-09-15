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

  it('defaults to the warehouse with the worst derived deviation', () => {
    renderIoT();
    // Rio C's humidity is furthest out of band (ratio 1.5), so it leads.
    expect(screen.getByText('Température · Rio C')).toBeInTheDocument();
    expect(screen.getByText('Humidité · Rio C')).toBeInTheDocument();
  });

  it('flags the out-of-band metric, not the on-target one', () => {
    renderIoT();
    // Rio C: humidity out of range, temperature on target — only humidity flags.
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
