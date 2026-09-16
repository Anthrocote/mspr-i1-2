import type { HelpArticle } from './types';

export const priseEnMain: HelpArticle = {
  slug: 'prise-en-main',
  title: {
    fr: 'Prise en main',
    en: 'Getting started',
    es: 'Primeros pasos',
  },
  blocks: {
    fr: [
      { kind: 'heading', text: 'À quoi sert FutureKawa' },
      { kind: 'paragraph', text: 'FutureKawa suit vos lots de café vert et les conditions de stockage de vos entrepôts au Brésil, en Équateur et en Colombie. Chaque entrepôt remonte automatiquement sa température et son humidité, et le siège consolide le tout dans cette interface.' },
      { kind: 'image', src: '/help/prise-en-main/fr/apercu.png', alt: 'Vue d\'ensemble du tableau de bord FutureKawa' },
      { kind: 'heading', text: 'Se repérer dans le menu' },
      { kind: 'list', items: [
        'Dashboard : la vue globale consolidée, tous pays confondus.',
        'Gestion des Lots : la liste des lots, triée par ancienneté de stockage.',
        'Suivi des entrepôts : les courbes de température et d\'humidité.',
        'Alertes : les situations à risque signalées automatiquement.',
        'Exploitations : les fermes partenaires par pays.',
      ] },
      { kind: 'heading', text: 'Changer de langue' },
      { kind: 'paragraph', text: 'Le sélecteur en haut à droite bascule l\'interface entre français, anglais et espagnol. Votre choix est mémorisé sur ce poste.' },
      { kind: 'callout', tone: 'info', text: 'Un bouton « ? » est disponible en haut de chaque page : il ouvre l\'aide de la page où vous êtes.' },
    ],
    en: [
      { kind: 'heading', text: 'What FutureKawa is for' },
      { kind: 'paragraph', text: 'FutureKawa tracks your green coffee lots and the storage conditions of your warehouses in Brazil, Ecuador and Colombia. Each warehouse reports its temperature and humidity automatically, and headquarters consolidates everything in this interface.' },
      { kind: 'image', src: '/help/prise-en-main/en/apercu.png', alt: 'Overview of the FutureKawa dashboard' },
      { kind: 'heading', text: 'Finding your way around the menu' },
      { kind: 'list', items: [
        'Dashboard: the consolidated overview across all countries.',
        'Lot management: the list of lots, sorted by storage age.',
        'Warehouse monitoring: the temperature and humidity charts.',
        'Alerts: risk situations flagged automatically.',
        'Farms: partner farms by country.',
      ] },
      { kind: 'heading', text: 'Changing the language' },
      { kind: 'paragraph', text: 'The selector in the top right switches the interface between French, English and Spanish. Your choice is remembered on this device.' },
      { kind: 'callout', tone: 'info', text: 'A "?" button sits at the top of every page: it opens the help for the page you are on.' },
    ],
    es: [
      { kind: 'heading', text: 'Para qué sirve FutureKawa' },
      { kind: 'paragraph', text: 'FutureKawa realiza el seguimiento de sus lotes de café verde y de las condiciones de almacenamiento de sus almacenes en Brasil, Ecuador y Colombia. Cada almacén informa automáticamente de su temperatura y humedad, y la sede consolida todo en esta interfaz.' },
      { kind: 'image', src: '/help/prise-en-main/es/apercu.png', alt: 'Vista general del panel de FutureKawa' },
      { kind: 'heading', text: 'Orientarse en el menú' },
      { kind: 'list', items: [
        'Dashboard: la vista global consolidada, todos los países.',
        'Gestión de lotes: la lista de lotes, ordenada por antigüedad de almacenamiento.',
        'Seguimiento de almacenes: las curvas de temperatura y humedad.',
        'Alertas: las situaciones de riesgo señaladas automáticamente.',
        'Explotaciones: las fincas asociadas por país.',
      ] },
      { kind: 'heading', text: 'Cambiar de idioma' },
      { kind: 'paragraph', text: 'El selector de la parte superior derecha cambia la interfaz entre francés, inglés y español. Su elección se guarda en este equipo.' },
      { kind: 'callout', tone: 'info', text: 'Un botón «?» está disponible en la parte superior de cada página: abre la ayuda de la página en la que se encuentra.' },
    ],
  },
};
