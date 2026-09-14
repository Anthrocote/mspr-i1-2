import type { Warehouse, Lot, Alert, Country, Farm, DashboardAlert } from '@/types';

export const WAREHOUSES: Warehouse[] = [
  { id: 'wh-sp-a',  name: 'São Paulo A',  country: 'Brésil',   countryCode: 'br', flag: '🇧🇷', temp: '29°C', hum: '55%', tempNum: 29, humNum: 55, tempRange: [26, 32], humRange: [53, 57], idealTemp: '29°C ±3', idealHum: '55% ±2', status: 'Conforme',  statusVariant: 'ok',   lots: 48 },
  { id: 'wh-rio-c', name: 'Rio C',        country: 'Brésil',   countryCode: 'br', flag: '🇧🇷', temp: '27°C', hum: '58%', tempNum: 27, humNum: 58, tempRange: [26, 32], humRange: [53, 57], idealTemp: '29°C ±3', idealHum: '55% ±2', status: 'Conforme',  statusVariant: 'ok',   lots: 33 },
  { id: 'wh-qt-b',  name: 'Quito B',      country: 'Équateur', countryCode: 'ec', flag: '🇪🇨', temp: '34°C', hum: '61%', tempNum: 34, humNum: 61, tempRange: [28, 34], humRange: [57, 63], idealTemp: '31°C ±3', idealHum: '60% ±3', status: 'En Alerte', statusVariant: 'err',  lots: 37 },
  { id: 'wh-gy-a',  name: 'Guayaquil A',  country: 'Équateur', countryCode: 'ec', flag: '🇪🇨', temp: '30°C', hum: '64%', tempNum: 30, humNum: 64, tempRange: [28, 34], humRange: [57, 63], idealTemp: '31°C ±3', idealHum: '60% ±3', status: 'Conforme',  statusVariant: 'ok',   lots: 21 },
  { id: 'wh-bg-c',  name: 'Bogotá C',     country: 'Colombie', countryCode: 'co', flag: '🇨🇴', temp: '26°C', hum: '83%', tempNum: 26, humNum: 83, tempRange: [23, 29], humRange: [77, 83], idealTemp: '26°C ±3', idealHum: '80% ±3', status: 'En Alerte', statusVariant: 'warn', lots: 29 },
  { id: 'wh-md-d',  name: 'Medellín D',   country: 'Colombie', countryCode: 'co', flag: '🇨🇴', temp: '25°C', hum: '78%', tempNum: 25, humNum: 78, tempRange: [23, 29], humRange: [77, 83], idealTemp: '26°C ±3', idealHum: '80% ±3', status: 'Conforme',  statusVariant: 'ok',   lots: 24 },
];

export const LOTS: Lot[] = [
  { id: 'LOT-BR-2023-00018', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'São Paulo A', storageDate: '12 jan. 2023', duration: '387 j', durationDays: 387, status: 'Périmé',    statusVariant: 'err',  durationVariant: 'err',  temp: '31°C', hum: '56%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
  { id: 'LOT-EC-2024-00107', countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', warehouse: 'Quito B',     storageDate: '3 mars 2024', duration: '240 j', durationDays: 240, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn', temp: '34°C', hum: '61%', idealTemp: '31°C ±3', idealHum: '60% ±3' },
  { id: 'LOT-CO-2024-00342', countryCode: 'co', country: 'Colombie', flag: '🇨🇴', warehouse: 'Bogotá C',    storageDate: '18 juin 2024', duration: '134 j', durationDays: 134, status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '26°C', hum: '82%', idealTemp: '26°C ±3', idealHum: '80% ±3' },
  { id: 'LOT-BR-2024-00891', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'Rio C',       storageDate: '2 oct. 2024', duration: '90 j',  durationDays: 90,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '27°C', hum: '58%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
  { id: 'LOT-EC-2024-00204', countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', warehouse: 'Guayaquil A', storageDate: '15 nov. 2024', duration: '52 j',  durationDays: 52,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '30°C', hum: '64%', idealTemp: '31°C ±3', idealHum: '60% ±3' },
  { id: 'LOT-CO-2023-00077', countryCode: 'co', country: 'Colombie', flag: '🇨🇴', warehouse: 'Bogotá C',    storageDate: '8 fév. 2023', duration: '360 j', durationDays: 360, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn', temp: '26°C', hum: '83%', idealTemp: '26°C ±3', idealHum: '80% ±3' },
  { id: 'LOT-BR-2024-00992', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'São Paulo A', storageDate: '5 déc. 2024', duration: '32 j',  durationDays: 32,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '29°C', hum: '55%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
  { id: 'LOT-EC-2023-00045', countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', warehouse: 'Quito B',     storageDate: '20 jan. 2023', duration: '372 j', durationDays: 372, status: 'Périmé',    statusVariant: 'err',  durationVariant: 'err',  temp: '33°C', hum: '62%', idealTemp: '31°C ±3', idealHum: '60% ±3' },
  { id: 'LOT-CO-2024-00501', countryCode: 'co', country: 'Colombie', flag: '🇨🇴', warehouse: 'Medellín D',  storageDate: '28 sep. 2024', duration: '96 j',  durationDays: 96,  status: 'Conforme',  statusVariant: 'ok',   durationVariant: '',     temp: '25°C', hum: '78%', idealTemp: '26°C ±3', idealHum: '80% ±3' },
  { id: 'LOT-BR-2024-00760', countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', warehouse: 'Rio C',       storageDate: '14 août 2024', duration: '128 j', durationDays: 128, status: 'En Alerte', statusVariant: 'warn', durationVariant: 'warn', temp: '32°C', hum: '59%', idealTemp: '29°C ±3', idealHum: '55% ±2' },
];

export const ALERTS: Alert[] = [
  { id: 'a1', severity: 'critique', level: 'Critique', icon: '⛔', variant: 'err',  title: 'Lot périmé — LOT-CO-2023-00018', description: '387 j de stockage · 22 j au-delà du seuil de 365 j · expédition urgente requise', time: 'il y a 5 min',  bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  { id: 'a2', severity: 'critique', level: 'Critique', icon: '⛔', variant: 'err',  title: 'Lot périmé — LOT-EC-2023-00045', description: '372 j de stockage · seuil 365 j dépassé',                                     time: 'il y a 40 min', bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  { id: 'a3', severity: 'alerte',   level: 'Alerte',   icon: '🌡️', variant: 'warn', title: 'Température hors plage — Quito B', description: '34°C relevé · seuil Équateur 31°C ±3 · email envoyé au responsable',     time: 'il y a 18 min', bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a4', severity: 'alerte',   level: 'Alerte',   icon: '💧', variant: 'warn', title: 'Humidité élevée — Bogotá C',       description: '83% relevé · seuil Colombie 80% ±3',                                     time: 'il y a 1 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a5', severity: 'alerte',   level: 'Alerte',   icon: '⏳', variant: 'warn', title: 'Péremption imminente — LOT-CO-2023-00077', description: '360 j de stockage · 5 j avant péremption',                                time: 'il y a 2 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a6', severity: 'alerte',   level: 'Alerte',   icon: '⏳', variant: 'warn', title: 'Stockage prolongé — LOT-BR-2024-00760', description: '128 j · température ponctuellement à 32°C',                               time: 'il y a 3 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
  { id: 'a7', severity: 'alerte',   level: 'Alerte',   icon: '📡', variant: 'warn', title: 'Capteur dégradé — Guayaquil A',     description: 'Latence MQTT élevée · dernière mesure il y a 22 min',                     time: 'il y a 4 h',   bgColor: '#FEF3E2', borderColor: '#B45309' },
];

export const DASHBOARD_ALERTS: DashboardAlert[] = [
  { title: 'Lot périmé — LOT-CO-2023-00018',       description: '387 j de stockage · 22 j au-delà du seuil de 365 j', time: 'il y a 5 min',  bgColor: '#FEF2F2', borderColor: '#9B1C1C' },
  { title: 'Température hors plage — Quito B',      description: '34°C relevé · seuil Équateur 31°C ±3',         time: 'il y a 18 min', bgColor: '#FEF3E2', borderColor: '#B45309' },
  { title: 'Humidité élevée — Bogotá C',            description: '83% relevé · seuil Colombie 80% ±3',           time: 'il y a 1 h',    bgColor: '#FEF3E2', borderColor: '#B45309' },
];

export const COUNTRIES: Country[] = [
  { countryCode: 'br', name: 'Brésil',   flag: '🇧🇷', farms: 6, warehouses: 4, lots: 118, alerts: 3, alertColor: '#B45309', ideal: '29°C · 55%', banner: 'linear-gradient(135deg, #EFF7EF, #C1EAC3)', tempThreshold: '29°C ±3', humThreshold: '55% ±2' },
  { countryCode: 'ec', name: 'Équateur', flag: '🇪🇨', farms: 3, warehouses: 2, lots: 72,  alerts: 3, alertColor: '#9B1C1C', ideal: '31°C · 60%', banner: 'linear-gradient(135deg, #FEF9E7, #F6D860)', tempThreshold: '31°C ±3', humThreshold: '60% ±3' },
  { countryCode: 'co', name: 'Colombie', flag: '🇨🇴', farms: 4, warehouses: 2, lots: 58,  alerts: 1, alertColor: '#B45309', ideal: '26°C · 80%', banner: 'linear-gradient(135deg, #FEF0F0, #FCA5A5)', tempThreshold: '26°C ±3', humThreshold: '80% ±3' },
];

export const FARMS: Farm[] = [
  { name: 'Fazenda Santa Lúcia',  countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', lots: 42, certification: 'Bio · Fair Trade', certVariant: 'ok' },
  { name: 'Sítio do Vale Verde',  countryCode: 'br', country: 'Brésil',   flag: '🇧🇷', lots: 38, certification: 'Rainforest',      certVariant: 'ok' },
  { name: 'Hacienda La Niebla',   countryCode: 'ec', country: 'Équateur', flag: '🇪🇨', lots: 31, certification: 'Bio',              certVariant: 'ok' },
  { name: 'Finca El Mirador',     countryCode: 'co', country: 'Colombie', flag: '🇨🇴', lots: 34, certification: 'Fair Trade',       certVariant: 'ok' },
  { name: 'Finca Buenavista',     countryCode: 'co', country: 'Colombie', flag: '🇨🇴', lots: 24, certification: 'En cours',         certVariant: 'warn' },
];
