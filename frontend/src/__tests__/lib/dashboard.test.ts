import { warehouseExceptions, sortAlertsBySeverity, conformityRate, warehouseStatus } from '@/lib/dashboard';
import type { Warehouse, Alert } from '@/types';

function warehouse(over: Partial<Warehouse>): Warehouse {
  return {
    id: 'w', name: 'W', countryCode: 'br', flag: '🇧🇷',
    temp: '29°C', hum: '55%', tempNum: 29, humNum: 55,
    tempRange: [26, 32], humRange: [53, 57],
    idealTemp: '29°C ±3', idealHum: '55% ±2', lots: 10,
    ...over,
  };
}

describe('conformityRate', () => {
  it('is the conforme share, rounded', () => {
    expect(conformityRate({ conforme: 174, alerte: 72, perime: 2 })).toBe(70);
  });

  it('is 0 when there is nothing to rate', () => {
    expect(conformityRate({ conforme: 0, alerte: 0, perime: 0 })).toBe(0);
  });
});

describe('warehouseExceptions', () => {
  it('keeps only warehouses at or beyond their tolerance band', () => {
    const inband = warehouse({ id: 'ok', tempNum: 29, humNum: 55 });
    const overHum = warehouse({ id: 'hot', humNum: 60 }); // 60 > 57
    const result = warehouseExceptions([inband, overHum]);
    expect(result.map((e) => e.warehouse.id)).toEqual(['hot']);
  });

  it('ranks by how far the worst reading drifted, regardless of unit', () => {
    const mild = warehouse({ id: 'mild', humNum: 58 }); // ratio 1.5 on tol 2
    const severe = warehouse({ id: 'severe', tempNum: 40 }); // ratio ~3.7 on tol 3
    const result = warehouseExceptions([mild, severe]);
    expect(result.map((e) => e.warehouse.id)).toEqual(['severe', 'mild']);
  });
});

describe('warehouseStatus', () => {
  it('is ok inside the bands', () => {
    expect(warehouseStatus(warehouse({ tempNum: 29, humNum: 55 }))).toBe('ok');
  });

  it('is warn at the tolerance edge', () => {
    // hum 57 on [53,57]: ratio |57-55|/2 = 1.0
    expect(warehouseStatus(warehouse({ humNum: 57 }))).toBe('warn');
  });

  it('is err well past the band', () => {
    // hum 58 on [53,57]: ratio |58-55|/2 = 1.5
    expect(warehouseStatus(warehouse({ humNum: 58 }))).toBe('err');
  });
});

describe('sortAlertsBySeverity', () => {
  it('puts critical alerts before regular ones without mutating the input', () => {
    const input = [
      { id: '1', severity: 'alerte' } as Alert,
      { id: '2', severity: 'critique' } as Alert,
    ];
    const sorted = sortAlertsBySeverity(input);
    expect(sorted.map((a) => a.id)).toEqual(['2', '1']);
    expect(input.map((a) => a.id)).toEqual(['1', '2']);
  });
});
