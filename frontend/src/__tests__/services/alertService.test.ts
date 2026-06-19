import { getAlerts, getDashboardAlerts } from '@/services/alertService';
import { ALERTS, DASHBOARD_ALERTS } from '@/data/mock';

describe('alertService', () => {
  describe('getAlerts', () => {
    it('returns all alerts from mock data', async () => {
      const alerts = await getAlerts();
      expect(alerts).toEqual(ALERTS);
      expect(alerts.length).toBe(7);
    });

    it('includes both critique and alerte severities', async () => {
      const alerts = await getAlerts();
      const critiques = alerts.filter((a) => a.severity === 'critique');
      const avertissements = alerts.filter((a) => a.severity === 'alerte');
      expect(critiques.length).toBe(2);
      expect(avertissements.length).toBe(5);
    });

    it('has proper structure for each alert', async () => {
      const alerts = await getAlerts();
      const alert = alerts[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('description');
      expect(alert).toHaveProperty('time');
      expect(alert).toHaveProperty('borderColor');
    });
  });

  describe('getDashboardAlerts', () => {
    it('returns 3 dashboard alerts', async () => {
      const alerts = await getDashboardAlerts();
      expect(alerts).toEqual(DASHBOARD_ALERTS);
      expect(alerts.length).toBe(3);
    });

    it('has proper structure for dashboard alerts', async () => {
      const alerts = await getDashboardAlerts();
      const alert = alerts[0];
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('description');
      expect(alert).toHaveProperty('time');
      expect(alert).toHaveProperty('bgColor');
      expect(alert).toHaveProperty('borderColor');
    });
  });
});
