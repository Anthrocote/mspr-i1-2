import type { HelpArticle } from './types';

export const faq: HelpArticle = {
  slug: 'faq',
  title: {
    fr: 'FAQ & dépannage',
    en: 'FAQ & troubleshooting',
    es: 'FAQ y resolución',
  },
  blocks: {
    fr: [
      { kind: 'heading', text: 'Pourquoi je ne vois pas de mesures pour un entrepôt ?' },
      { kind: 'paragraph', text: 'Le capteur de cet entrepôt ne remonte plus de relevés : il est peut-être hors ligne. L\'absence de mesures ne veut pas dire que le stockage est mauvais, seulement qu\'on ne le mesure pas pour l\'instant.' },
      { kind: 'heading', text: 'Pourquoi cette alerte ne se résout pas ?' },
      { kind: 'paragraph', text: 'Une alerte de conditions ne se ferme que lorsque la température et l\'humidité reviennent dans la plage tolérée du pays. Tant que la dérive dure, l\'alerte reste ouverte. Une alerte de lot périmé se résout à l\'expédition du lot.' },
      { kind: 'heading', text: 'Un lot transféré a-t-il perdu son ancienneté ?' },
      { kind: 'paragraph', text: 'Non. L\'ancienneté d\'un lot se compte depuis sa première entrée en stockage, pas depuis son arrivée dans l\'entrepôt actuel. Un transfert entre entrepôts ne remet pas le compteur à zéro.' },
      { kind: 'heading', text: 'Comment changer la langue ?' },
      { kind: 'paragraph', text: 'Utilisez le sélecteur en haut à droite. L\'interface bascule aussitôt entre français, anglais et espagnol, et votre choix est mémorisé sur ce poste.' },
    ],
    en: [
      { kind: 'heading', text: 'Why don\'t I see readings for a warehouse?' },
      { kind: 'paragraph', text: 'That warehouse\'s sensor is no longer reporting readings: it may be offline. Missing measurements do not mean storage is bad, only that we are not measuring it for now.' },
      { kind: 'heading', text: 'Why won\'t this alert resolve?' },
      { kind: 'paragraph', text: 'A condition alert only closes when temperature and humidity return within the country\'s tolerated range. As long as the drift lasts, the alert stays open. An expired-lot alert resolves when the lot is shipped.' },
      { kind: 'heading', text: 'Does a transferred lot lose its age?' },
      { kind: 'paragraph', text: 'No. A lot\'s age is counted from its first entry into storage, not from its arrival in the current warehouse. A transfer between warehouses does not reset the counter.' },
      { kind: 'heading', text: 'How do I change the language?' },
      { kind: 'paragraph', text: 'Use the selector in the top right. The interface switches immediately between French, English and Spanish, and your choice is remembered on this device.' },
    ],
    es: [
      { kind: 'heading', text: '¿Por qué no veo mediciones de un almacén?' },
      { kind: 'paragraph', text: 'El sensor de ese almacén ya no envía lecturas: puede estar fuera de línea. La ausencia de mediciones no significa que el almacenamiento sea malo, solo que no lo estamos midiendo por ahora.' },
      { kind: 'heading', text: '¿Por qué no se resuelve esta alerta?' },
      { kind: 'paragraph', text: 'Una alerta de condiciones solo se cierra cuando la temperatura y la humedad vuelven al rango tolerado del país. Mientras dure la desviación, la alerta permanece abierta. Una alerta de lote caducado se resuelve cuando el lote se expide.' },
      { kind: 'heading', text: '¿Un lote transferido pierde su antigüedad?' },
      { kind: 'paragraph', text: 'No. La antigüedad de un lote se cuenta desde su primera entrada en almacenamiento, no desde su llegada al almacén actual. Una transferencia entre almacenes no reinicia el contador.' },
      { kind: 'heading', text: '¿Cómo cambio el idioma?' },
      { kind: 'paragraph', text: 'Use el selector de la parte superior derecha. La interfaz cambia de inmediato entre francés, inglés y español, y su elección se guarda en este equipo.' },
    ],
  },
};
