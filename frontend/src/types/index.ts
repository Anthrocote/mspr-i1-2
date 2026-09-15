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
  lots: number;
}

// One warehouse stay in a lot's history. `sortie` is null while the lot is
// still in that warehouse. The read-only siège consults this history; the
// entries themselves are recorded by the local country tier.
export interface WarehouseStay {
  warehouse: string;
  entree: string;
  sortie: string | null;
}

export interface Lot {
  id: string;
  countryCode: CountryCode;
  country: string;
  flag: string;
  warehouse: string;
  exploitationId: string;
  // Date the lot was constituted at the exploitation. Distinct from a warehouse
  // entry date: duration is counted from here, not from the current storage.
  constitutedAt: string;
  storageDate: string;
  stays: WarehouseStay[];
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
  id: string;
  name: string;
  countryCode: CountryCode;
  country: string;
  flag: string;
  lots: number;
  certification: string;
  certVariant: BadgeVariant;
}

export interface StatusDistribution {
  conforme: number;
  alerte: number;
  perime: number;
}

// Aggregates the siège holds after querying each country backend. The siège
// frontend is read-only, so it consumes these counts rather than recomputing
// them from individual lots (which live in the local country tier).
export interface ConsolidatedSummary {
  totalLots: number;
  enTransit: number;
  distribution: StatusDistribution;
}

export type PageId =
  | 'dashboard'
  | 'lots'
  | 'iot'
  | 'alertes'
  | 'exploitations';

export interface PageMeta {
  title: string;
  subtitle: string;
}

export const PAGE_META: Record<PageId, PageMeta> = {
  dashboard:     { title: 'Dashboard',         subtitle: 'Vue globale · 3 pays · 248 lots en stock' },
  lots:          { title: 'Gestion des Lots',   subtitle: 'Traçabilité & rotation des stocks' },
  iot:           { title: 'Surveillance IoT',   subtitle: 'Capteurs température & humidité en temps réel' },
  alertes:       { title: 'Alertes',            subtitle: '7 alertes actives nécessitant une action' },
  exploitations: { title: 'Exploitations',      subtitle: 'Brésil · Équateur · Colombie' },
};
