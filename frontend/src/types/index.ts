export type LotStatus = 'conforme' | 'alerte' | 'perime';
export type AlertSeverity = 'critique' | 'alerte';
export type BadgeVariant = 'ok' | 'warn' | 'err' | 'info' | 'neutral';
export type CountryCode = 'br' | 'ec' | 'co';

export interface Warehouse {
  id: string;
  name: string;
  country: string;
  countryCode: CountryCode;
  flag: string;
  temp: string;
  hum: string;
  tempNum: number;
  humNum: number;
  tempRange: [number, number];
  humRange: [number, number];
  idealTemp: string;
  idealHum: string;
  status: 'Conforme' | 'En Alerte';
  statusVariant: BadgeVariant;
  lots: number;
}

export interface Lot {
  id: string;
  countryCode: CountryCode;
  country: string;
  flag: string;
  warehouse: string;
  storageDate: string;
  duration: string;
  durationDays: number;
  status: string;
  statusVariant: BadgeVariant;
  durationVariant: '' | 'warn' | 'err';
  temp: string;
  hum: string;
  idealTemp: string;
  idealHum: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  level: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  variant: BadgeVariant;
  bgColor: string;
  borderColor: string;
}

export interface Country {
  countryCode: CountryCode;
  name: string;
  flag: string;
  farms: number;
  warehouses: number;
  lots: number;
  alerts: number;
  alertColor: string;
  ideal: string;
  banner: string;
  tempThreshold: string;
  humThreshold: string;
}

export interface Farm {
  name: string;
  countryCode: CountryCode;
  country: string;
  flag: string;
  lots: number;
  certification: string;
  certVariant: BadgeVariant;
}

export interface DashboardAlert {
  title: string;
  description: string;
  time: string;
  bgColor: string;
  borderColor: string;
}

export type PageId =
  | 'dashboard'
  | 'lots'
  | 'iot'
  | 'alertes'
  | 'exploitations'
  | 'analytique'
  | 'parametres';

export interface PageMeta {
  title: string;
  subtitle: string;
}

export const PAGE_META: Record<PageId, PageMeta> = {
  dashboard:     { title: 'Dashboard',         subtitle: 'Vue globale · 3 pays · 248 lots en stock' },
  lots:          { title: 'Gestion des Lots',   subtitle: 'Traçabilité & conformité FIFO' },
  iot:           { title: 'Surveillance IoT',   subtitle: 'Capteurs température & humidité en temps réel' },
  alertes:       { title: 'Alertes',            subtitle: '7 alertes actives nécessitant une action' },
  exploitations: { title: 'Exploitations',      subtitle: 'Brésil · Équateur · Colombie' },
  analytique:    { title: 'Analytique',         subtitle: 'Tendances & indicateurs de performance' },
  parametres:    { title: 'Paramètres',          subtitle: 'Seuils IoT, notifications & compte' },
};
