import type { Warehouse, Lot, Alert, Country, Farm, DashboardAlert, ConsolidatedSummary } from '@/types';

// Consolidated at the siège from every country backend. The dashboard reads
// these authoritative counts instead of scattering the same numbers across
// hardcoded KPI tiles and a donut.
export const CONSOLIDATED: ConsolidatedSummary = {
  totalLots: 248,
  enTransit: 14,
  distribution: { conforme: 174, alerte: 72, perime: 2 },
};

export const WAREHOUSES: Warehouse[] = [
  { id: 'wh-sp-a',  name: 'São Paulo A',  country: 'Brésil',   countryCode: 'br', flag: '🇧🇷', temp: '29°C', hum: '55%', tempNum: 29, humNum: 55, tempRange: [26, 32], humRange: [53, 57], idealTemp: '29°C ±3', idealHum: '55% ±2', lots: 48 },
  { id: 'wh-rio-c', name: 'Rio C',        country: 'Brésil',   countryCode: 'br', flag: '🇧🇷', temp: '27°C', hum: '58%', tempNum: 27, humNum: 58, tempRange: [26, 32], humRange: [53, 57], idealTemp: '29°C ±3', idealHum: '55% ±2', lots: 33 },
  { id: 'wh-qt-b',  name: 'Quito B',      country: 'Équateur', countryCode: 'ec', flag: '🇪🇨', temp: '34°C', hum: '61%', tempNum: 34, humNum: 61, tempRange: [28, 34], humRange: [57, 63], idealTemp: '31°C ±3', idealHum: '60% ±3', lots: 37 },
  { id: 'wh-gy-a',  name: 'Guayaquil A',  country: 'Équateur', countryCode: 'ec', flag: '🇪🇨', temp: '30°C', hum: '64%', tempNum: 30, humNum: 64, tempRange: [28, 34], humRange: [57, 63], idealTemp: '31°C ±3', idealHum: '60% ±3', lots: 21 },
  { id: 'wh-bg-c',  name: 'Bogotá C',     country: 'Colombie', countryCode: 'co', flag: '🇨🇴', temp: '26°C', hum: '83%', tempNum: 26, humNum: 83, tempRange: [23, 29], humRange: [77, 83], idealTemp: '26°C ±3', idealHum: '80% ±3', lots: 29 },
  { id: 'wh-md-d',  name: 'Medellín D',   country: 'Colombie', countryCode: 'co', flag: '🇨🇴', temp: '25°C', hum: '78%', tempNum: 25, humNum: 78, tempRange: [23, 29], humRange: [77, 83], idealTemp: '26°C ±3', idealHum: '80% ±3', lots: 24 },
];

export const LOTS: Lot[] = [
  { id: 'LOT-BR-2023-00018', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'São Paulo A', exploitationId: 'br-santa-lucia', constitutedAt: '5 jan. 2023',  storageDate: '12 jan. 2023', stays: [{ warehouse: 'Rio C', entree: '12 jan. 2023', sortie: '20 juin 2023' }, { warehouse: 'São Paulo A', entree: '21 juin 2023', sortie: null }], duration: '387 j', durationDays: 387, status: 'Périmé',    statusVariant: 'err',  durationVariant: 'err',  temp: '31°C', hum: '56%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
  { id: 'LOT-EC-2024-00107', countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', warehouse: 'Quito B',     exploitationId: 'ec-la-niebla',   constitutedAt: '25 fév. 2024', storageDate: '3 mars 2024',  stays: [{ warehouse: 'Quito B', entree: '3 mars 2024', sortie: null }], duration: '240 j', durationDays: 240, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn', temp: '34°C', hum: '61%', idealTemp: '31°C ±3', idealHum: '60% ±3' },
  { id: 'LOT-CO-2024-00342', countryCode: 'co', country: 'Colombie', flag: '🇨🇴', warehouse: 'Bogotá C',    exploitationId: 'co-el-mirador',  constitutedAt: '12 juin 2024', storageDate: '18 juin 2024', stays: [{ warehouse: 'Bogotá C', entree: '18 juin 2024', sortie: null }], duration: '134 j', durationDays: 134, status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '26°C', hum: '82%', idealTemp: '26°C ±3', idealHum: '80% ±3' },
  { id: 'LOT-BR-2024-00891', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'Rio C',       exploitationId: 'br-vale-verde',  constitutedAt: '26 sep. 2024', storageDate: '2 oct. 2024',  stays: [{ warehouse: 'Rio C', entree: '2 oct. 2024', sortie: null }], duration: '90 j',  durationDays: 90,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '27°C', hum: '58%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
  { id: 'LOT-EC-2024-00204', countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', warehouse: 'Guayaquil A', exploitationId: 'ec-la-niebla',   constitutedAt: '9 nov. 2024',  storageDate: '15 nov. 2024', stays: [{ warehouse: 'Guayaquil A', entree: '15 nov. 2024', sortie: null }], duration: '52 j',  durationDays: 52,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '30°C', hum: '64%', idealTemp: '31°C ±3', idealHum: '60% ±3' },
  { id: 'LOT-CO-2023-00077', countryCode: 'co', country: 'Colombie', flag: '🇨🇴', warehouse: 'Bogotá C',    exploitationId: 'co-buenavista',  constitutedAt: '1 fév. 2023',  storageDate: '8 fév. 2023',  stays: [{ warehouse: 'Bogotá C', entree: '8 fév. 2023', sortie: null }], duration: '360 j', durationDays: 360, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn', temp: '26°C', hum: '83%', idealTemp: '26°C ±3', idealHum: '80% ±3' },
  { id: 'LOT-BR-2024-00992', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'São Paulo A', exploitationId: 'br-santa-lucia', constitutedAt: '29 nov. 2024', storageDate: '5 déc. 2024',  stays: [{ warehouse: 'São Paulo A', entree: '5 déc. 2024', sortie: null }], duration: '32 j',  durationDays: 32,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '29°C', hum: '55%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
  { id: 'LOT-EC-2023-00045', countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', warehouse: 'Quito B',     exploitationId: 'ec-la-niebla',   constitutedAt: '13 jan. 2023', storageDate: '20 jan. 2023', stays: [{ warehouse: 'Quito B', entree: '20 jan. 2023', sortie: null }], duration: '372 j', durationDays: 372, status: 'Périmé',    statusVariant: 'err',  durationVariant: 'err',  temp: '33°C', hum: '62%', idealTemp: '31°C ±3', idealHum: '60% ±3' },
  { id: 'LOT-CO-2024-00501', countryCode: 'co', country: 'Colombie', flag: '🇨🇴', warehouse: 'Medellín D',  exploitationId: 'co-el-mirador',  constitutedAt: '22 sep. 2024', storageDate: '28 sep. 2024', stays: [{ warehouse: 'Medellín D', entree: '28 sep. 2024', sortie: null }], duration: '96 j',  durationDays: 96,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '25°C', hum: '78%', idealTemp: '26°C ±3', idealHum: '80% ±3' },
  { id: 'LOT-BR-2024-00760', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'Rio C',       exploitationId: 'br-vale-verde',  constitutedAt: '7 août 2024',  storageDate: '14 août 2024', stays: [{ warehouse: 'São Paulo A', entree: '14 août 2024', sortie: '2 nov. 2024' }, { warehouse: 'Rio C', entree: '3 nov. 2024', sortie: null }], duration: '128 j', durationDays: 128, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn', temp: '32°C', hum: '59%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
];

export const ALERTS: Alert[] = [
  { id: 'a1', severity: 'critique', level: 'Critique', icon: '⛔', variant: 'err',  title: 'Lot périmé — LOT-BR-2023-00018', description: '387 j de stockage · 22 j au-delà du seuil de 365 j · expédition urgente requise', time: 'il y a 5 min',  bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  { id: 'a2', severity: 'critique', level: 'Critique', icon: '⛔', variant: 'err',  title: 'Lot périmé — LOT-EC-2023-00045', description: '372 j de stockage · seuil 365 j dépassé',                                     time: 'il y a 40 min', bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  { id: 'a3', severity: 'alerte',   level: 'Alerte',   icon: '🌡️', variant: 'warn', title: 'Température hors plage — Quito B', description: '34°C relevé · seuil Équateur 31°C ±3 · email envoyé au responsable',     time: 'il y a 18 min', bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a4', severity: 'alerte',   level: 'Alerte',   icon: '💧', variant: 'warn', title: 'Humidité élevée — Bogotá C',       description: '83% relevé · seuil Colombie 80% ±3',                                     time: 'il y a 1 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a5', severity: 'alerte',   level: 'Alerte',   icon: '⏳', variant: 'warn', title: 'Péremption imminente — LOT-CO-2023-00077', description: '360 j de stockage · 5 j avant péremption',                                time: 'il y a 2 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a6', severity: 'alerte',   level: 'Alerte',   icon: '⏳', variant: 'warn', title: 'Stockage prolongé — LOT-BR-2024-00760', description: '128 j · température ponctuellement à 32°C',                               time: 'il y a 3 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a7', severity: 'alerte',   level: 'Alerte',   icon: '📡', variant: 'warn', title: 'Capteur dégradé — Guayaquil A',     description: 'Latence de relevé élevée · dernière mesure il y a 22 min',                     time: 'il y a 4 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
];

export const DASHBOARD_ALERTS: DashboardAlert[] = [
  { title: 'Lot périmé — LOT-BR-2023-00018',       description: '387 j de stockage · 22 j au-delà du seuil de 365 j', time: 'il y a 5 min',  bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  { title: 'Température hors plage — Quito B',      description: '34°C relevé · seuil Équateur 31°C ±3',         time: 'il y a 18 min', bgColor: '#FEF3E2', borderColor: '#B45309' },
  { title: 'Humidité élevée — Bogotá C',            description: '83% relevé · seuil Colombie 80% ±3',           time: 'il y a 1 h',    bgColor: '#FEF3E2', borderColor: '#B45309' },
];

export const COUNTRIES: Country[] = [
  { countryCode: 'br', name: 'Brésil',   flag: '🇧🇷', farms: 2, warehouses: 2, lots: 118, alerts: 2, alertColor: '#B45309', ideal: '29°C · 55%', banner: 'linear-gradient(135deg, #EFF7EF, #C1EAC3)', tempThreshold: '29°C ±3', humThreshold: '55% ±2' },
  { countryCode: 'ec', name: 'Équateur', flag: '🇪🇨', farms: 1, warehouses: 2, lots: 72,  alerts: 3, alertColor: '#9B1C1C', ideal: '31°C · 60%', banner: 'linear-gradient(135deg, #FEF9E7, #F6D860)', tempThreshold: '31°C ±3', humThreshold: '60% ±3' },
  { countryCode: 'co', name: 'Colombie', flag: '🇨🇴', farms: 2, warehouses: 2, lots: 58,  alerts: 2, alertColor: '#B45309', ideal: '26°C · 80%', banner: 'linear-gradient(135deg, #FEF0F0, #FCA5A5)', tempThreshold: '26°C ±3', humThreshold: '80% ±3' },
];

export const FARMS: Farm[] = [
  { id: 'br-santa-lucia', name: 'Fazenda Santa Lúcia',  countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', lots: 42, certification: 'Bio · Fair Trade', certVariant: 'ok' },
  { id: 'br-vale-verde',  name: 'Sítio do Vale Verde',  countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', lots: 38, certification: 'Rainforest',      certVariant: 'ok' },
  { id: 'ec-la-niebla',   name: 'Hacienda La Niebla',   countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', lots: 31, certification: 'Bio',              certVariant: 'ok' },
  { id: 'co-el-mirador',  name: 'Finca El Mirador',     countryCode: 'co', country: 'Colombie', flag: '🇨🇴', lots: 34, certification: 'Fair Trade',       certVariant: 'ok' },
  { id: 'co-buenavista',  name: 'Finca Buenavista',     countryCode: 'co', country: 'Colombie', flag: '🇨🇴', lots: 24, certification: 'En cours',         certVariant: 'warn' },
];
