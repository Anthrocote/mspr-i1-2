import { getWarehouses, getWarehouseById } from '@/services/warehouseService';
import { WAREHOUSES } from '@/data/mock';

describe('warehouseService', () => {
  describe('getWarehouses', () => {
    it('returns all warehouses from mock data', async () => {
      const warehouses = await getWarehouses();
      expect(warehouses).toEqual(WAREHOUSES);
      expect(warehouses.length).toBe(6);
    });

    it('includes warehouses from all 3 countries', async () => {
      const warehouses = await getWarehouses();
      const countries = new Set(warehouses.map((w) => w.countryCode));
      expect(countries.has('br')).toBe(true);
      expect(countries.has('ec')).toBe(true);
      expect(countries.has('co')).toBe(true);
    });
  });

  describe('getWarehouseById', () => {
    it('returns the correct warehouse for a valid ID', async () => {
      const warehouse = await getWarehouseById('wh-sp-a');
      expect(warehouse).toBeDefined();
      expect(warehouse?.name).toBe('São Paulo A');
      expect(warehouse?.country).toBe('Brésil');
    });

    it('returns undefined for an unknown ID', async () => {
      const warehouse = await getWarehouseById('wh-unknown');
      expect(warehouse).toBeUndefined();
    });

    it('returns warehouse with IoT data', async () => {
      const warehouse = await getWarehouseById('wh-qt-b');
      expect(warehouse?.temp).toBe('34°C');
      expect(warehouse?.hum).toBe('61%');
      expect(warehouse?.tempNum).toBe(34);
      expect(warehouse?.tempRange).toEqual([28, 34]);
    });
  });
});
