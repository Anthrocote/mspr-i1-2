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
      { kind: 'qa', q: 'Puis-je modifier ou ajouter des données depuis cette interface ?', a: 'Non. L\'interface du siège sert à consulter : les lots, les mesures et les alertes remontent automatiquement depuis chaque pays. Vous ne saisissez rien ici.' },
      { kind: 'qa', q: 'Que signifie un lot « en transit » ?', a: 'Un lot en transit est parti d\'un entrepôt mais n\'est pas encore arrivé dans le suivant : son transfert est en cours. Il n\'a pas d\'entrepôt courant tant que son arrivée n\'est pas enregistrée.' },
      { kind: 'qa', q: 'Que signifie la durée affichée d\'un lot ?', a: 'C\'est le temps écoulé depuis la première mise en stock du lot, pas depuis son arrivée dans l\'entrepôt actuel. Un transfert entre entrepôts ne remet donc pas ce compteur à zéro. Au-delà de 365 jours, le lot est marqué périmé.' },
      { kind: 'qa', q: 'Qu\'arrive-t-il à un lot marqué périmé ?', a: 'Rien automatiquement : le lot reste affiché et signalé par une alerte, pour que vous décidiez de l\'expédier ou de le traiter. Il n\'est pas retiré tout seul.' },
      { kind: 'qa', q: 'Pourquoi je ne vois pas de mesures pour un entrepôt ?', a: 'Le capteur de cet entrepôt ne remonte plus de relevés : il est peut-être hors ligne. L\'absence de mesures ne veut pas dire que le stockage est mauvais, seulement qu\'on ne le mesure pas pour l\'instant.' },
      { kind: 'qa', q: 'Pourquoi un pays n\'affiche-t-il aucune donnée ?', a: 'Ce pays n\'a pas encore d\'entrepôt ni de lot remontés, ou son site local n\'envoie pas encore de données au siège. Ses cartes restent alors à zéro.' },
      { kind: 'qa', q: 'Pourquoi cette alerte ne se résout pas ?', a: 'Une alerte de conditions ne se ferme que lorsque la température et l\'humidité reviennent dans la plage tolérée du pays. Tant que la dérive dure, l\'alerte reste ouverte. Une alerte de lot périmé se résout à l\'expédition du lot.' },
      { kind: 'qa', q: 'Comment changer la langue ?', a: 'Utilisez le sélecteur en haut à droite. L\'interface bascule aussitôt entre français, anglais et espagnol, et votre choix est mémorisé sur ce poste.' },
    ],
    en: [
      { kind: 'qa', q: 'Can I edit or add data from this interface?', a: 'No. The headquarters interface is for viewing: lots, measurements and alerts flow up automatically from each country. You do not enter anything here.' },
      { kind: 'qa', q: 'What does a lot "in transit" mean?', a: 'A lot in transit has left one warehouse but has not yet arrived at the next: its transfer is under way. It has no current warehouse until its arrival is recorded.' },
      { kind: 'qa', q: 'What does a lot\'s displayed duration mean?', a: 'It is the time since the lot first went into storage, not since it arrived at the current warehouse. A transfer between warehouses therefore does not reset the counter. Past 365 days, the lot is marked expired.' },
      { kind: 'qa', q: 'What happens to a lot marked expired?', a: 'Nothing automatically: the lot stays listed and flagged by an alert, so you can decide to ship or handle it. It is not removed on its own.' },
      { kind: 'qa', q: 'Why don\'t I see readings for a warehouse?', a: 'That warehouse\'s sensor is no longer reporting readings: it may be offline. Missing measurements do not mean storage is bad, only that we are not measuring it for now.' },
      { kind: 'qa', q: 'Why does a country show no data?', a: 'That country has no warehouse or lot reported yet, or its local site is not sending data to headquarters yet. Its cards then stay at zero.' },
      { kind: 'qa', q: 'Why won\'t this alert resolve?', a: 'A condition alert only closes when temperature and humidity return within the country\'s tolerated range. As long as the drift lasts, the alert stays open. An expired-lot alert resolves when the lot is shipped.' },
      { kind: 'qa', q: 'How do I change the language?', a: 'Use the selector in the top right. The interface switches immediately between French, English and Spanish, and your choice is remembered on this device.' },
    ],
    es: [
      { kind: 'qa', q: '¿Puedo modificar o añadir datos desde esta interfaz?', a: 'No. La interfaz de la sede es de consulta: los lotes, las mediciones y las alertas suben automáticamente desde cada país. Usted no introduce nada aquí.' },
      { kind: 'qa', q: '¿Qué significa un lote «en tránsito»?', a: 'Un lote en tránsito ha salido de un almacén pero aún no ha llegado al siguiente: su transferencia está en curso. No tiene almacén actual hasta que se registra su llegada.' },
      { kind: 'qa', q: '¿Qué significa la duración mostrada de un lote?', a: 'Es el tiempo transcurrido desde que el lote entró por primera vez en almacenamiento, no desde su llegada al almacén actual. Una transferencia entre almacenes no reinicia el contador. Pasados 365 días, el lote se marca como caducado.' },
      { kind: 'qa', q: '¿Qué ocurre con un lote marcado como caducado?', a: 'Nada automáticamente: el lote permanece listado y señalado por una alerta, para que usted decida expedirlo o gestionarlo. No se retira por sí solo.' },
      { kind: 'qa', q: '¿Por qué no veo mediciones de un almacén?', a: 'El sensor de ese almacén ya no envía lecturas: puede estar fuera de línea. La ausencia de mediciones no significa que el almacenamiento sea malo, solo que no lo estamos midiendo por ahora.' },
      { kind: 'qa', q: '¿Por qué un país no muestra ningún dato?', a: 'Ese país todavía no tiene almacén ni lote reportados, o su sitio local aún no envía datos a la sede. Sus tarjetas se quedan entonces a cero.' },
      { kind: 'qa', q: '¿Por qué no se resuelve esta alerta?', a: 'Una alerta de condiciones solo se cierra cuando la temperatura y la humedad vuelven al rango tolerado del país. Mientras dure la desviación, la alerta permanece abierta. Una alerta de lote caducado se resuelve cuando el lote se expide.' },
      { kind: 'qa', q: '¿Cómo cambio el idioma?', a: 'Use el selector de la parte superior derecha. La interfaz cambia de inmediato entre francés, inglés y español, y su elección se guarda en este equipo.' },
    ],
  },
};
