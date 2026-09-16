import type { HelpArticle } from './types';

export const lots: HelpArticle = {
  slug: 'lots',
  title: {
    fr: 'Gérer les lots',
    en: 'Managing lots',
    es: 'Gestión de lotes',
  },
  blocks: {
    fr: [
      { kind: 'heading', text: 'À quoi sert la page Lots' },
      { kind: 'paragraph', text: 'La page Gestion des Lots liste tous vos lots de café vert, du plus ancien au plus récent. Elle sert la traçabilité (d\'où vient chaque lot, où il est stocké) et la rotation des stocks : on expédie en priorité les lots entrés le plus tôt.' },
      { kind: 'image', src: '/help/lots/fr/liste.png', alt: 'Liste des lots avec pays, entrepôt, durée et statut' },
      { kind: 'heading', text: 'Trier et filtrer' },
      { kind: 'list', items: [
        'Filtrer par pays et par entrepôt pour se concentrer sur un site.',
        'Filtrer par statut : conforme, en alerte, périmé.',
        'Filtrer par ancienneté de stockage : moins de 90 jours, 90 à 180, 180 à 365, plus de 365.',
        'Le tri par défaut place le lot le plus ancien en premier : c\'est celui à expédier en priorité.',
      ] },
      { kind: 'heading', text: 'Les statuts d\'un lot' },
      { kind: 'list', items: [
        'Conforme : le lot est stocké dans des conditions dans la plage tolérée.',
        'En alerte : l\'entrepôt qui abrite le lot est en conditions hors plage.',
        'Périmé : le lot est en stockage depuis plus de 365 jours.',
      ] },
      { kind: 'heading', text: 'Ouvrir le détail d\'un lot' },
      { kind: 'steps', items: [
        'Cliquez sur une ligne de la liste.',
        'Consultez l\'historique de stockage : chaque entrepôt traversé, avec ses dates d\'entrée et de sortie.',
        'Lisez les courbes de température et d\'humidité relevées pendant le stockage du lot.',
      ] },
      { kind: 'callout', tone: 'info', text: 'Règle FIFO : expédiez d\'abord les lots les plus anciens. C\'est le sens du tri par défaut et de l\'alerte « périmé ».' },
    ],
    en: [
      { kind: 'heading', text: 'What the Lots page is for' },
      { kind: 'paragraph', text: 'The Lot management page lists all your green coffee lots, oldest first. It serves traceability (where each lot comes from, where it is stored) and stock rotation: the lots that entered earliest are shipped first.' },
      { kind: 'image', src: '/help/lots/en/liste.png', alt: 'Lot list with country, warehouse, duration and status' },
      { kind: 'heading', text: 'Sorting and filtering' },
      { kind: 'list', items: [
        'Filter by country and by warehouse to focus on one site.',
        'Filter by status: compliant, in alert, expired.',
        'Filter by storage age: under 90 days, 90 to 180, 180 to 365, over 365.',
        'The default sort puts the oldest lot first: that is the one to ship first.',
      ] },
      { kind: 'heading', text: 'A lot\'s statuses' },
      { kind: 'list', items: [
        'Compliant: the lot is stored in conditions within the tolerated range.',
        'In alert: the warehouse holding the lot is in out-of-range conditions.',
        'Expired: the lot has been in storage for more than 365 days.',
      ] },
      { kind: 'heading', text: 'Opening a lot\'s details' },
      { kind: 'steps', items: [
        'Click a row in the list.',
        'Review the storage history: each warehouse it went through, with entry and exit dates.',
        'Read the temperature and humidity charts recorded while the lot was stored.',
      ] },
      { kind: 'callout', tone: 'info', text: 'FIFO rule: ship the oldest lots first. That is what the default sort and the "expired" alert are for.' },
    ],
    es: [
      { kind: 'heading', text: 'Para qué sirve la página de Lotes' },
      { kind: 'paragraph', text: 'La página de Gestión de lotes enumera todos sus lotes de café verde, del más antiguo al más reciente. Sirve para la trazabilidad (de dónde viene cada lote, dónde está almacenado) y la rotación de existencias: se expiden primero los lotes que entraron antes.' },
      { kind: 'image', src: '/help/lots/es/liste.png', alt: 'Lista de lotes con país, almacén, duración y estado' },
      { kind: 'heading', text: 'Ordenar y filtrar' },
      { kind: 'list', items: [
        'Filtrar por país y por almacén para centrarse en un sitio.',
        'Filtrar por estado: conforme, en alerta, caducado.',
        'Filtrar por antigüedad de almacenamiento: menos de 90 días, de 90 a 180, de 180 a 365, más de 365.',
        'El orden predeterminado coloca el lote más antiguo primero: es el que debe expedirse primero.',
      ] },
      { kind: 'heading', text: 'Los estados de un lote' },
      { kind: 'list', items: [
        'Conforme: el lote se almacena en condiciones dentro del rango tolerado.',
        'En alerta: el almacén que alberga el lote está en condiciones fuera de rango.',
        'Caducado: el lote lleva almacenado más de 365 días.',
      ] },
      { kind: 'heading', text: 'Abrir el detalle de un lote' },
      { kind: 'steps', items: [
        'Haga clic en una fila de la lista.',
        'Consulte el historial de almacenamiento: cada almacén por el que pasó, con sus fechas de entrada y salida.',
        'Lea las curvas de temperatura y humedad registradas durante el almacenamiento del lote.',
      ] },
      { kind: 'callout', tone: 'info', text: 'Regla FIFO: expida primero los lotes más antiguos. Ese es el sentido del orden predeterminado y de la alerta «caducado».' },
    ],
  },
};
