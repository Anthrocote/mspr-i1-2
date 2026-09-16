import { render, screen } from '@testing-library/react';
import IoTPage from '@/app/iot/page';
import type { Warehouse } from '@/types';
import type { ApiMeasurement } from '@/lib/api/types';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';
import * as queries from '@/lib/api/queries';

jest.mock('@/lib/api/queries');

const mockedQueries = queries as jest.Mocked<typeof queries>;

function warehouse(over: Partial<Warehouse> & { id: string; name: string; countryCode: Warehouse['countryCode'] }): Warehouse {
  return {
    flag: '🇧🇷',
    temp: '29°C', hum: '55%', tempNum: 29, humNum: 55, tempRange: [26, 32], humRange: [53, 57],
    idealTemp: '29°C ±3', idealHum: '55% ±2', lots: 10,
    ...over,
  };
}

const WAREHOUSES: Warehouse[] = [
  warehouse({ id: 'wh-sp', name: 'São Paulo A', countryCode: 'br' }),
  // Humidity beyond its band -> worst derived deviation -> default selection.
  warehouse({ id: 'wh-rio', name: 'Rio C', countryCode: 'br', humNum: 59 }),
  warehouse({ id: 'wh-qt', name: 'Quito B', countryCode: 'ec', flag: '🇪🇨', tempRange: [28, 34], humRange: [57, 63], tempNum: 31, humNum: 60 }),
  warehouse({ id: 'wh-md', name: 'Medellín D', countryCode: 'co', flag: '🇨🇴', tempRange: [23, 29], humRange: [77, 83], tempNum: 25, humNum: 80 }),
];

// One breaching humidity reading for the default warehouse (Rio C, band 53–57).
const MEASUREMENTS: ApiMeasurement[] = [
  { uuid: 'm-1', warehouseUuid: 'wh-rio', temperature: 27, humidity: 59, measuredAt: '2025-01-01T08:00:00Z', syncedAt: '2025-01-01T08:00:00Z' },
];

function renderIoT() {
  return render(
    <LanguageProvider>
      <SearchProvider>
        <IoTPage />
      </SearchProvider>
    </LanguageProvider>
  );
}

describe('IoTPage container', () => {
  beforeEach(() => {
    mockedQueries.fetchWarehouseConditions.mockResolvedValue(WAREHOUSES);
    mockedQueries.fetchWarehouseMeasurements.mockResolvedValue(MEASUREMENTS);
  });

  afterEach(() => jest.clearAllMocks());

  it('drives the charts from a grouped warehouse selector', async () => {
    renderIoT();
    expect(await screen.findByLabelText('Entrepôt')).toBeInTheDocument();
    // Every warehouse is reachable as an option.
    expect(screen.getByRole('option', { name: 'São Paulo A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Quito B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medellín D' })).toBeInTheDocument();
  });

  it('defaults to the warehouse with the worst derived deviation', async () => {
    renderIoT();
    // Rio C's humidity is furthest out of band, so it leads.
    expect(await screen.findByText('Température · Rio C')).toBeInTheDocument();
    expect(screen.getByText('Humidité · Rio C')).toBeInTheDocument();
  });

  it('flags the out-of-band metric from the real readings', async () => {
    renderIoT();
    // Rio C: humidity reading (59) out of range -> the chart flags it once the
    // measurements have loaded.
    const flags = await screen.findAllByText(/Hors plage/);
    expect(flags.length).toBeGreaterThanOrEqual(1);
  });

  it('offers time-range controls', async () => {
    renderIoT();
    expect(await screen.findByRole('button', { name: '24 h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 j' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 j' })).toBeInTheDocument();
  });

  it('replaces the condition badge with the sensor badge when the sensor is silent', async () => {
    // A silent sensor makes the last reading stale, so the control bar must show
    // the sensor state INSTEAD of a (misleading) "Hors plage"/"Conforme" badge.
    const silent = warehouse({
      id: 'wh-silent', name: 'Quito B', countryCode: 'ec', flag: '🇪🇨',
      tempRange: [28, 34], humRange: [57, 63], tempNum: 40, humNum: 60, sensorStatus: 'sensor_error',
    });
    mockedQueries.fetchWarehouseConditions.mockResolvedValue([silent]);
    mockedQueries.fetchWarehouseMeasurements.mockResolvedValue([]);
    renderIoT();

    expect(await screen.findByText(/Capteur en erreur/)).toBeInTheDocument();
    // The out-of-band reading would otherwise raise a control-bar "Hors plage"
    // badge; with no measurements loaded and the sensor silent, none is shown.
    expect(screen.queryByText('Hors plage')).not.toBeInTheDocument();
    expect(screen.queryByText('Conforme')).not.toBeInTheDocument();
  });

  it('shows an error state when the warehouse fetch fails', async () => {
    mockedQueries.fetchWarehouseConditions.mockRejectedValue(new Error('boom'));
    renderIoT();
    expect(await screen.findByText(/Impossible de charger les données/)).toBeInTheDocument();
  });
});
