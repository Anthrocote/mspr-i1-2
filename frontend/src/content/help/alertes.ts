import type { HelpArticle } from './types';

export const alertes: HelpArticle = {
  slug: 'alertes',
  title: {
    fr: 'Comprendre les alertes',
    en: 'Understanding alerts',
    es: 'Entender las alertas',
  },
  blocks: {
    fr: [
      { kind: 'heading', text: 'Deux familles d\'alertes' },
      { kind: 'paragraph', text: 'La page Alertes regroupe les situations à risque détectées automatiquement. Elles se répartissent en deux familles : les conditions de stockage hors plage, et les lots trop anciens.' },
      { kind: 'image', src: '/help/alertes/fr/liste.png', alt: 'Liste des alertes avec type, sujet et statut' },
      { kind: 'heading', text: 'Conditions hors plage' },
      { kind: 'paragraph', text: 'Quand la température ou l\'humidité d\'un entrepôt sort des seuils de son pays (tolérance comprise), une alerte s\'ouvre et un email part au destinataire configuré pour ce pays. L\'alerte se résout d\'elle-même quand les conditions reviennent dans la plage, et un second email signale ce retour à la normale.' },
      { kind: 'heading', text: 'Lot trop ancien' },
      { kind: 'paragraph', text: 'Un lot en stockage depuis plus de 365 jours est marqué périmé et déclenche une alerte. Elle se résout quand le lot quitte le circuit (expédition).' },
      { kind: 'heading', text: 'Que faire' },
      { kind: 'steps', items: [
        'Identifiez l\'entrepôt ou le lot concerné par l\'alerte.',
        'Vérifiez les conditions sur place (température, humidité, état du lot).',
        'Agissez sur le stockage : l\'alerte de conditions se résout automatiquement une fois les valeurs revenues dans la plage.',
      ] },
      { kind: 'callout', tone: 'info', text: 'Le destinataire configuré pour le pays reçoit un email à l\'ouverture d\'une alerte de conditions et un autre à sa résolution.' },
    ],
    en: [
      { kind: 'heading', text: 'Two families of alerts' },
      { kind: 'paragraph', text: 'The Alerts page gathers the risk situations detected automatically. They fall into two families: out-of-range storage conditions, and lots that are too old.' },
      { kind: 'image', src: '/help/alertes/en/liste.png', alt: 'Alert list with type, subject and status' },
      { kind: 'heading', text: 'Out-of-range conditions' },
      { kind: 'paragraph', text: 'When a warehouse\'s temperature or humidity leaves its country\'s thresholds (tolerance included), an alert opens and an email goes to the recipient configured for that country. The alert resolves itself when conditions return within range, and a second email reports that return to normal.' },
      { kind: 'heading', text: 'Lot too old' },
      { kind: 'paragraph', text: 'A lot in storage for more than 365 days is marked expired and raises an alert. It resolves when the lot leaves the circuit (shipping).' },
      { kind: 'heading', text: 'What to do' },
      { kind: 'steps', items: [
        'Identify the warehouse or lot the alert concerns.',
        'Check the conditions on site (temperature, humidity, lot condition).',
        'Act on storage: the condition alert resolves automatically once the values are back within range.',
      ] },
      { kind: 'callout', tone: 'info', text: 'The recipient configured for the country receives an email when a condition alert opens and another when it resolves.' },
    ],
    es: [
      { kind: 'heading', text: 'Dos familias de alertas' },
      { kind: 'paragraph', text: 'La página de Alertas reúne las situaciones de riesgo detectadas automáticamente. Se dividen en dos familias: las condiciones de almacenamiento fuera de rango y los lotes demasiado antiguos.' },
      { kind: 'image', src: '/help/alertes/es/liste.png', alt: 'Lista de alertas con tipo, asunto y estado' },
      { kind: 'heading', text: 'Condiciones fuera de rango' },
      { kind: 'paragraph', text: 'Cuando la temperatura o la humedad de un almacén sale de los umbrales de su país (tolerancia incluida), se abre una alerta y se envía un correo al destinatario configurado para ese país. La alerta se resuelve por sí sola cuando las condiciones vuelven al rango, y un segundo correo señala ese regreso a la normalidad.' },
      { kind: 'heading', text: 'Lote demasiado antiguo' },
      { kind: 'paragraph', text: 'Un lote almacenado durante más de 365 días se marca como caducado y genera una alerta. Se resuelve cuando el lote sale del circuito (expedición).' },
      { kind: 'heading', text: 'Qué hacer' },
      { kind: 'steps', items: [
        'Identifique el almacén o el lote al que se refiere la alerta.',
        'Compruebe las condiciones en el sitio (temperatura, humedad, estado del lote).',
        'Actúe sobre el almacenamiento: la alerta de condiciones se resuelve automáticamente cuando los valores vuelven al rango.',
      ] },
      { kind: 'callout', tone: 'info', text: 'El destinatario configurado para el país recibe un correo cuando se abre una alerta de condiciones y otro cuando se resuelve.' },
    ],
  },
};
