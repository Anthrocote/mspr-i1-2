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
  // Last sensor status from the local tier: 'online' | 'sensor_error' | 'offline'
  // | null. Drives the "sensor offline" indicator on the IoT page.
  sensorStatus?: string | null;
}

// One warehouse stay in a lot's history. `sortie` is null while the lot is
// still in that warehouse. The read-only siège consults this history; the
// entries themselves are recorded by the local country tier.
export interface WarehouseStay {
  warehouse: string;
  entree: string;
  sortie: string | null;
  // Raw ISO instants; views format them in the active language.
  entreeIso: string;
  sortieIso: string | null;
}

export interface Lot {
  id: string;
  // Siège lot uuid, used to fetch the lot detail. Absent on mock fixtures (which
  // key everything on the human-readable label `id`); never rendered.
  uuid?: string;
  countryCode: CountryCode;
  country: string;
  // Siège country id / current-warehouse uuid, used to drive the server-side
  // location filter (country_id / warehouse_id). Null when the relation is
  // unresolved at the source.
  countryId: number | null;
  warehouseId: string | null;
  flag: string;
  warehouse: string;
  exploitationId: string;
  // Date the lot was constituted at the exploitation. Distinct from a warehouse
  // entry date: duration is counted from here, not from the current storage.
  constitutedAt: string;
  // Raw ISO of the constitution date; views format it in the active language.
  constitutedAtIso: string | null;
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

export type AlertStatus = 'active' | 'resolved';

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
  // Raw wire alert type (out_of_range | expired_lot | sensor_offline). Views
  // translate it at render time via t('alert_type_' + type); `typeLabel`/`title`
  // hold the French canonical fallback.
  type: string;
  // Raw ISO instants; views format them in the active language (date + hour).
  triggeredAt: string;
  resolvedAt: string | null;
  // History-table fields (Alertes page). `title` bundles type + subject for the
  // dashboard card; the table keeps them apart.
  typeLabel: string;
  subject: string;
  status: AlertStatus;
}

export interface Farm {
  id: string;
  name: string;
  countryCode: CountryCode;
  country: string;
  flag: string;
  lots: number;
}

export interface StatusDistribution {
  conforme: number;
  alerte: number;
  perime: number;
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
  dashboard:     { title: 'Dashboard',         subtitle: 'Vue globale consolidée' },
  lots:          { title: 'Gestion des Lots',   subtitle: 'Traçabilité & rotation des stocks' },
  iot:           { title: 'Surveillance IoT',   subtitle: 'Capteurs température & humidité en temps réel' },
  alertes:       { title: 'Alertes',            subtitle: 'Alertes actives · vue consolidée' },
  exploitations: { title: 'Exploitations',      subtitle: 'Brésil · Équateur · Colombie' },
};
