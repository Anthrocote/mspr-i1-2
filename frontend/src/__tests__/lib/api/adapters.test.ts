import {
  adaptAlert,
  adaptExploitation,
  adaptLotSummary,
  adaptStays,
  adaptWarehouse,
  countryFlag,
  countryLabelFr,
  daysBetween,
  distributionFromCounts,
  formatDateFr,
  formatHumidity,
  formatTemperature,
  HUM_TOLERANCE,
  isoToCountryCode,
  lotStatusLabelFr,
  lotStatusToPresentation,
  lotStatusToVariant,
  TEMP_TOLERANCE,
  toleranceBand,
} from '@/lib/api/adapters';
import type {
  ApiAlert,
  ApiCountry,
  ApiExploitation,
  ApiLotSummary,
  ApiWarehouse,
} from '@/lib/api/types';

describe('country iso mapping', () => {
  it('maps 3-letter iso codes to 2-letter presentation codes', () => {
    expect(isoToCountryCode('BRA')).toBe('br');
    expect(isoToCountryCode('ECU')).toBe('ec');
    expect(isoToCountryCode('COL')).toBe('co');
  });

  it('is case-insensitive on the iso input', () => {
    expect(isoToCountryCode('bra')).toBe('br');
  });

  it('throws on an unknown iso code instead of guessing', () => {
    expect(() => isoToCountryCode('USA')).toThrow(/Unknown iso/);
  });

  it('exposes flag and French label per code', () => {
    expect(countryFlag('br')).toBe('🇧🇷');
    expect(countryFlag('ec')).toBe('🇪🇨');
    expect(countryFlag('co')).toBe('🇨🇴');
    expect(countryLabelFr('br')).toBe('Brésil');
    expect(countryLabelFr('ec')).toBe('Équateur');
    expect(countryLabelFr('co')).toBe('Colombie');
  });
});

describe('lot status enum mapping', () => {
  it('maps to badge variants', () => {
    expect(lotStatusToVariant('compliant')).toBe('ok');
    expect(lotStatusToVariant('in_alert')).toBe('warn');
    expect(lotStatusToVariant('expired')).toBe('err');
  });

  it('maps to presentation LotStatus', () => {
    expect(lotStatusToPresentation('compliant')).toBe('conforme');
    expect(lotStatusToPresentation('in_alert')).toBe('alerte');
    expect(lotStatusToPresentation('expired')).toBe('perime');
  });

  it('maps to French labels', () => {
    expect(lotStatusLabelFr('compliant')).toBe('Conforme');
    expect(lotStatusLabelFr('in_alert')).toBe('En Alerte');
    expect(lotStatusLabelFr('expired')).toBe('Périmé');
  });
});

describe('numeric formatting', () => {
  it('rounds temperature to whole degrees', () => {
    expect(formatTemperature(28.4)).toBe('28°C');
    expect(formatTemperature(28.6)).toBe('29°C');
    expect(formatTemperature(31)).toBe('31°C');
  });

  it('rounds humidity to whole percent', () => {
    expect(formatHumidity(55.2)).toBe('55%');
    expect(formatHumidity(59.9)).toBe('60%');
  });
});

describe('date formatting', () => {
  it('formats ISO 8601 to French short date (UTC calendar)', () => {
    expect(formatDateFr('2023-01-05T10:00:00+00:00')).toBe('5 jan. 2023');
    expect(formatDateFr('2024-02-25T00:00:00Z')).toBe('25 fév. 2024');
    expect(formatDateFr('2024-08-07T23:30:00Z')).toBe('7 août 2024');
    expect(formatDateFr('2024-12-31T12:00:00Z')).toBe('31 déc. 2024');
  });

  it('throws on an invalid date', () => {
    expect(() => formatDateFr('not-a-date')).toThrow(/Invalid ISO date/);
  });

  it('computes whole-day spans', () => {
    expect(daysBetween('2024-01-01T00:00:00Z', '2024-01-11T00:00:00Z')).toBe(10);
    // Never negative even if the range is inverted.
    expect(daysBetween('2024-01-11T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(10);
  });
});

describe('tolerance policy', () => {
  it('builds a symmetric band around the ideal', () => {
    expect(toleranceBand(29, TEMP_TOLERANCE)).toEqual([26, 32]);
    expect(toleranceBand(55, HUM_TOLERANCE)).toEqual([53, 57]);
  });
});

describe('distribution from counts', () => {
  it('maps status counts to the presentation distribution', () => {
    expect(distributionFromCounts({ compliant: 174, in_alert: 72, expired: 2 })).toEqual({
      conforme: 174,
      alerte: 72,
      perime: 2,
    });
  });
});

const COUNTRY_BR: ApiCountry = {
  id: 1,
  name: 'Brésil',
  isoCode: 'BRA',
  idealTemperature: 29,
  idealHumidity: 55,
  lastSyncedAt: null,
};

const WAREHOUSE_BR: ApiWarehouse = {
  uuid: 'wh-1',
  name: 'Entrepôt Manaus',
  streetNumber: 12,
  address: 'Rua das Acácias',
  postalCode: 69000,
  city: 'Manaus',
  active: true,
  status: 'online',
  statusAt: '2025-01-01T00:00:00Z',
  country: { id: 1, name: 'Brésil', isoCode: 'BRA' },
};

describe('warehouse composition', () => {
  it('joins warehouse + country thresholds + latest reading', () => {
    const w = adaptWarehouse({
      warehouse: WAREHOUSE_BR,
      country: COUNTRY_BR,
      latest: {
        uuid: 'm-1',
        warehouseUuid: 'wh-1',
        temperature: 31.2,
        humidity: 56.8,
        measuredAt: '2025-01-01T00:00:00Z',
        syncedAt: '2025-01-01T00:00:00Z',
      },
      lots: 48,
    });

    expect(w.id).toBe('wh-1');
    expect(w.name).toBe('Entrepôt Manaus');
    expect(w.countryCode).toBe('br');
    expect(w.flag).toBe('🇧🇷');
    expect(w.country).toBe('Brésil');
    expect(w.tempNum).toBe(31.2);
    expect(w.humNum).toBe(56.8);
    expect(w.temp).toBe('31°C');
    expect(w.hum).toBe('57%');
    expect(w.tempRange).toEqual([26, 32]);
    expect(w.humRange).toEqual([53, 57]);
    expect(w.idealTemp).toBe('29°C ±3');
    expect(w.idealHum).toBe('55% ±2');
    expect(w.lots).toBe(48);
    expect(w.sensorStatus).toBe('online');
  });

  it('falls back to the ideal when there is no measurement yet', () => {
    const w = adaptWarehouse({ warehouse: WAREHOUSE_BR, country: COUNTRY_BR, latest: null });
    expect(w.tempNum).toBe(29);
    expect(w.humNum).toBe(55);
    expect(w.lots).toBe(0);
  });
});

describe('alert adaptation', () => {
  const base = {
    uuid: 'a-1',
    triggeredAt: '2025-01-05T10:00:00Z',
    resolvedAt: null,
    warehouse: null,
  };

  it('derives critical severity + title for an expired lot', () => {
    const alert: ApiAlert = {
      ...base,
      type: 'expired_lot',
      lot: { uuid: 'l-1', label: 'LOT-BRA-2025-001' },
    };
    const a = adaptAlert(alert);
    expect(a.severity).toBe('critique');
    expect(a.variant).toBe('err');
    expect(a.title).toBe('Lot périmé — LOT-BRA-2025-001');
    expect(a.time).toBe('5 jan. 2025');
  });

  it('derives warning severity + title for an out-of-range condition', () => {
    const alert: ApiAlert = {
      ...base,
      type: 'out_of_range',
      lot: null,
      warehouse: { uuid: 'wh-1', name: 'Entrepôt Quito' },
    };
    const a = adaptAlert(alert);
    expect(a.severity).toBe('alerte');
    expect(a.variant).toBe('warn');
    expect(a.title).toBe('Condition hors plage — Entrepôt Quito');
  });

  it('derives a sensor-offline title and icon', () => {
    const alert: ApiAlert = {
      ...base,
      type: 'sensor_offline',
      lot: null,
      warehouse: { uuid: 'wh-1', name: 'Entrepôt Quito' },
    };
    const a = adaptAlert(alert);
    expect(a.severity).toBe('alerte');
    expect(a.title).toBe('Capteur hors ligne — Entrepôt Quito');
    expect(a.icon).toBe('📡');
  });

  it('splits type + subject and marks an active alert', () => {
    const a = adaptAlert({
      ...base,
      type: 'out_of_range',
      lot: null,
      warehouse: { uuid: 'wh-1', name: 'Entrepôt Quito' },
    });
    expect(a.type).toBe('out_of_range');
    expect(a.typeLabel).toBe('Condition hors plage');
    expect(a.subject).toBe('Entrepôt Quito');
    expect(a.status).toBe('active');
    expect(a.resolvedAt).toBeNull();
    // Raw ISO instant is exposed so views format it in the active language.
    expect(a.triggeredAt).toBe('2025-01-05T10:00:00Z');
  });

  it('marks a resolved alert and exposes its resolution time', () => {
    const a = adaptAlert({
      ...base,
      type: 'sensor_offline',
      resolvedAt: '2025-01-05T12:30:00Z',
      lot: null,
      warehouse: { uuid: 'wh-1', name: 'Entrepôt Quito' },
    });
    expect(a.status).toBe('resolved');
    expect(a.resolvedAt).toBe('2025-01-05T12:30:00Z');
  });
});

const ENRICHED_LOT: ApiLotSummary = {
  uuid: 'lot-uuid-1',
  label: 'LOT-BRA-2025-001',
  quantity: 500,
  status: 'compliant',
  syncedAt: '2026-09-15T10:00:00+00:00',
  product: { uuid: 'p-1', name: 'Arabica Minas Gerais' },
  currentWarehouse: { uuid: 'wh-1', name: 'Entrepôt Manaus' },
  country: { id: 1, name: 'Brésil', isoCode: 'BRA' },
  exploitation: { uuid: 'exp-1', name: 'Fazenda Serra Verde' },
  constitutedAt: '2026-07-17T00:00:00+00:00',
  arrivedAt: '2026-08-01T00:00:00+00:00',
  durationDays: 60,
};

describe('enriched lot adaptation', () => {
  it('maps every enriched field to the presentation lot', () => {
    const lot = adaptLotSummary(ENRICHED_LOT);
    expect(lot.id).toBe('LOT-BRA-2025-001');
    expect(lot.uuid).toBe('lot-uuid-1');
    expect(lot.countryCode).toBe('br');
    expect(lot.country).toBe('Brésil');
    expect(lot.flag).toBe('🇧🇷');
    expect(lot.warehouse).toBe('Entrepôt Manaus');
    expect(lot.exploitationId).toBe('exp-1');
    expect(lot.constitutedAt).toBe('17 juil. 2026');
    // storageDate comes from the warehouse arrival date, not the constitution.
    expect(lot.storageDate).toBe('1 août 2026');
    expect(lot.durationDays).toBe(60);
    expect(lot.duration).toBe('60 j');
    expect(lot.status).toBe('Conforme');
    expect(lot.statusVariant).toBe('ok');
    expect(lot.durationVariant).toBe('');
    // Conditions + stays are detail-only, never on the list summary.
    expect(lot.temp).toBe('');
    expect(lot.hum).toBe('');
    expect(lot.idealTemp).toBe('');
    expect(lot.idealHum).toBe('');
    expect(lot.stays).toEqual([]);
  });

  it('derives err/warn duration variants from the status', () => {
    expect(adaptLotSummary({ ...ENRICHED_LOT, status: 'expired' }).durationVariant).toBe('err');
    expect(adaptLotSummary({ ...ENRICHED_LOT, status: 'in_alert' }).durationVariant).toBe('warn');
  });

  it('falls back to the constitution date for storage when arrival is null', () => {
    const lot = adaptLotSummary({ ...ENRICHED_LOT, arrivedAt: null });
    expect(lot.storageDate).toBe('17 juil. 2026');
  });

  it('degrades gracefully when every nullable relation/date is null', () => {
    const lot = adaptLotSummary({
      ...ENRICHED_LOT,
      currentWarehouse: null,
      country: null,
      exploitation: null,
      constitutedAt: null,
      arrivedAt: null,
      durationDays: null,
    });
    // No country -> safe placeholder code but blank name/flag, nothing invented.
    expect(lot.countryCode).toBe('br');
    expect(lot.country).toBe('');
    expect(lot.flag).toBe('');
    expect(lot.warehouse).toBe('');
    expect(lot.exploitationId).toBe('');
    expect(lot.constitutedAt).toBe('');
    expect(lot.storageDate).toBe('');
    expect(lot.durationDays).toBe(0);
    expect(lot.duration).toBe('');
  });
});

describe('exploitation adaptation', () => {
  const api: ApiExploitation = {
    uuid: 'exp-1',
    name: 'Fazenda Serra Verde',
    country: { id: 1, name: 'Brésil', isoCode: 'BRA' },
    lotsCount: 7,
  };

  it('maps to the presentation farm with the API lot count', () => {
    const farm = adaptExploitation(api);
    expect(farm.id).toBe('exp-1');
    expect(farm.name).toBe('Fazenda Serra Verde');
    expect(farm.countryCode).toBe('br');
    expect(farm.country).toBe('Brésil');
    expect(farm.flag).toBe('🇧🇷');
    expect(farm.lots).toBe(7);
  });
});

describe('storage history adaptation', () => {
  it('maps entries and keeps a null departure as an open stay', () => {
    const stays = adaptStays([
      { warehouse: { uuid: 'w-1', name: 'Entrepôt Manaus' }, arrivedAt: '2026-07-17T00:00:00Z', departedAt: '2026-08-01T00:00:00Z' },
      { warehouse: { uuid: 'w-2', name: 'Entrepôt Rio' }, arrivedAt: '2026-08-02T00:00:00Z', departedAt: null },
    ]);
    expect(stays).toEqual([
      { warehouse: 'Entrepôt Manaus', entree: '17 juil. 2026', sortie: '1 août 2026', entreeIso: '2026-07-17T00:00:00Z', sortieIso: '2026-08-01T00:00:00Z' },
      { warehouse: 'Entrepôt Rio', entree: '2 août 2026', sortie: null, entreeIso: '2026-08-02T00:00:00Z', sortieIso: null },
    ]);
  });
});
