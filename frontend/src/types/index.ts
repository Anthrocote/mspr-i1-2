export type LotStatus = 'conforme' | 'alerte' | 'perime';
export type AlertSeverity = 'critique' | 'alerte';
export type BadgeVariant = 'ok' | 'warn' | 'err' | 'info' | 'neutral';
export type CountryCode = 'br' | 'ec' | 'co';

export interface Warehouse {
  id: string;
  name: string;
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
  // Raw ISO instants; views format them in the active language. `sortieIso` is
  // null while the lot is still in that warehouse.
  entreeIso: string;
  sortieIso: string | null;
}

export interface Lot {
  id: string;
  // Siège lot uuid, used to fetch the lot detail. Absent on mock fixtures (which
  // key everything on the human-readable label `id`); never rendered.
  uuid?: string;
  countryCode: CountryCode;
  // Siège current-warehouse uuid, used to drive the server-side location filter
  // (warehouse_id). Null when the relation is unresolved at the source.
  warehouseId: string | null;
  flag: string;
  warehouse: string;
  exploitationId: string;
  // Raw ISO of the constitution date (at the exploitation); views format it in
  // the active language. Duration is counted from here, not the current storage.
  constitutedAtIso: string | null;
  stays: WarehouseStay[];
  // Storage age in whole days; the view appends the localized unit (t('day_unit')).
  durationDays: number;
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
  // Presentation derived from severity/type: emoji icon + card colours.
  icon: string;
  bgColor: string;
  borderColor: string;
  // Raw wire alert type (out_of_range | expired_lot | sensor_offline). Views
  // translate it at render time via t('alert_type_' + type).
  type: string;
  // Raw ISO instants; views format them in the active language (date + hour).
  triggeredAt: string;
  resolvedAt: string | null;
  // Subject = lot label or warehouse name.
  subject: string;
  status: AlertStatus;
}

export interface Farm {
  id: string;
  name: string;
  countryCode: CountryCode;
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
  | 'exploitations'
  | 'aide';

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
  aide:          { title: 'Aide',               subtitle: 'Guide d\'utilisation' },
};
