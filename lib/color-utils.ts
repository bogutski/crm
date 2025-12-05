/**
 * Парсит HEX цвет в RGB компоненты
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');

  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map((c) => c + c).join('');
  }

  if (fullHex.length !== 6) {
    return null;
  }

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Конвертирует RGB в HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Смешивает цвет с белым (осветляет)
 */
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount
  );
}

/**
 * Смешивает цвет с чёрным (затемняет)
 */
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return rgbToHex(
    rgb.r * (1 - amount),
    rgb.g * (1 - amount),
    rgb.b * (1 - amount)
  );
}

/**
 * Генерирует стили для бейджа в стиле Flowbite на основе базового цвета
 * Возвращает: светлый фон, бордер средней насыщенности, насыщенный текст
 */
export function getBadgeColors(baseColor: string): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} {
  return {
    backgroundColor: lighten(baseColor, 0.9),  // Очень светлый фон
    borderColor: lighten(baseColor, 0.85),     // Чуть темнее фона
    textColor: darken(baseColor, 0.2),         // Насыщенный текст
  };
}

/**
 * Генерирует стили для бейджа в тёмной теме
 */
export function getBadgeColorsDark(baseColor: string): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} {
  return {
    backgroundColor: darken(baseColor, 0.7),   // Тёмный фон
    borderColor: darken(baseColor, 0.4),       // Средний бордер
    textColor: lighten(baseColor, 0.4),        // Светлый текст
  };
}

/**
 * Определяет контрастный цвет текста (белый или чёрный) для заданного фона
 * @deprecated Используйте getBadgeColors для стиля Flowbite
 */
export function getContrastTextColor(backgroundColor: string): '#ffffff' | '#000000' {
  const rgb = hexToRgb(backgroundColor);

  if (!rgb) {
    return '#ffffff';
  }

  const luminance = 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
