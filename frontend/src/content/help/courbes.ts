import type { HelpArticle } from './types';

export const courbes: HelpArticle = {
  slug: 'courbes',
  title: {
    fr: 'Lire les courbes',
    en: 'Reading the charts',
    es: 'Leer las curvas',
  },
  blocks: {
    fr: [
      { kind: 'heading', text: 'À quoi sert le suivi des entrepôts' },
      { kind: 'paragraph', text: 'La page Suivi des entrepôts affiche la température et l\'humidité relevées par les capteurs de chaque entrepôt. Chaque courbe montre l\'évolution dans le temps et la compare à la plage idéale du pays.' },
      { kind: 'heading', text: 'Les seuils par pays' },
      { kind: 'list', items: [
        'Brésil : 29 °C et 55 % d\'humidité.',
        'Équateur : 31 °C et 60 % d\'humidité.',
        'Colombie : 26 °C et 80 % d\'humidité.',
        'Tolérance appliquée à ces valeurs : ±3 °C sur la température, ±2 % sur l\'humidité.',
      ] },
      { kind: 'heading', text: 'Repérer une dérive' },
      { kind: 'paragraph', text: 'Tant que la courbe reste dans la plage tolérée, tout va bien. Dès qu\'une valeur sort de cette plage, une alerte de conditions s\'ouvre automatiquement pour l\'entrepôt concerné.' },
      { kind: 'callout', tone: 'warning', text: 'Un capteur « hors ligne » signifie l\'absence de relevés, pas forcément un problème de stockage : la mesure manque, la condition réelle reste peut-être bonne.' },
    ],
    en: [
      { kind: 'heading', text: 'What warehouse monitoring is for' },
      { kind: 'paragraph', text: 'The Warehouse monitoring page shows the temperature and humidity recorded by each warehouse\'s sensors. Each chart shows the change over time and compares it to the country\'s ideal range.' },
      { kind: 'heading', text: 'Thresholds by country' },
      { kind: 'list', items: [
        'Brazil: 29 °C and 55% humidity.',
        'Ecuador: 31 °C and 60% humidity.',
        'Colombia: 26 °C and 80% humidity.',
        'Tolerance applied to these values: ±3 °C on temperature, ±2% on humidity.',
      ] },
      { kind: 'heading', text: 'Spotting a drift' },
      { kind: 'paragraph', text: 'As long as the curve stays within the tolerated range, all is well. As soon as a value leaves that range, a condition alert opens automatically for the affected warehouse.' },
      { kind: 'callout', tone: 'warning', text: 'A sensor marked "offline" means readings are missing, not necessarily a storage problem: the measurement is absent, the actual conditions may still be fine.' },
    ],
    es: [
      { kind: 'heading', text: 'Para qué sirve el seguimiento de almacenes' },
      { kind: 'paragraph', text: 'La página de Seguimiento de almacenes muestra la temperatura y la humedad registradas por los sensores de cada almacén. Cada curva muestra la evolución en el tiempo y la compara con el rango ideal del país.' },
      { kind: 'heading', text: 'Los umbrales por país' },
      { kind: 'list', items: [
        'Brasil: 29 °C y 55% de humedad.',
        'Ecuador: 31 °C y 60% de humedad.',
        'Colombia: 26 °C y 80% de humedad.',
        'Tolerancia aplicada a estos valores: ±3 °C en temperatura, ±2% en humedad.',
      ] },
      { kind: 'heading', text: 'Detectar una desviación' },
      { kind: 'paragraph', text: 'Mientras la curva se mantenga dentro del rango tolerado, todo va bien. En cuanto un valor sale de ese rango, se abre automáticamente una alerta de condiciones para el almacén afectado.' },
      { kind: 'callout', tone: 'warning', text: 'Un sensor «fuera de línea» significa la ausencia de lecturas, no necesariamente un problema de almacenamiento: falta la medición, las condiciones reales pueden seguir siendo buenas.' },
    ],
  },
};
