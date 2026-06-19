import { getLots, getLotById } from '@/services/lotsService';
import { LOTS } from '@/data/mock';

describe('lotsService', () => {
  describe('getLots', () => {
    it('returns all lots from mock data', async () => {
      const lots = await getLots();
      expect(lots).toEqual(LOTS);
      expect(lots.length).toBe(10);
    });

    it('returns lots with correct structure', async () => {
      const lots = await getLots();
      const lot = lots[0];
      expect(lot).toHaveProperty('id');
      expect(lot).toHaveProperty('country');
      expect(lot).toHaveProperty('warehouse');
      expect(lot).toHaveProperty('status');
      expect(lot).toHaveProperty('duration');
    });
  });

  describe('getLotById', () => {
    it('returns the correct lot for a valid ID', async () => {
      const lot = await getLotById('LOT-BR-2023-00018');
      expect(lot).toBeDefined();
      expect(lot?.id).toBe('LOT-BR-2023-00018');
      expect(lot?.country).toBe('Brésil');
      expect(lot?.warehouse).toBe('São Paulo A');
    });

    it('returns undefined for an unknown ID', async () => {
      const lot = await getLotById('LOT-XX-9999-00000');
      expect(lot).toBeUndefined();
    });

    it('returns lot with all expected fields', async () => {
      const lot = await getLotById('LOT-EC-2024-00107');
      expect(lot?.countryCode).toBe('ec');
      expect(lot?.flag).toBe('🇪🇨');
      expect(lot?.statusVariant).toBe('warn');
      expect(lot?.temp).toBe('34°C');
    });
  });
});
