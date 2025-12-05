/**
 * Утилита для форматирования телефонов на сервере
 *
 * Примечание: react-international-phone предоставляет форматирование только через
 * React хук usePhoneInput, который нельзя использовать на сервере (Node.js).
 * Поэтому для бэкенда используем собственную реализацию.
 *
 * На фронтенде форматирование происходит автоматически через PhoneInput компонент,
 * который возвращает отформатированный inputValue.
 */

/**
 * Форматирует телефон в международный формат с пробелами
 * @param e164 - телефон в E.164 формате (например: +12133734253)
 * @returns отформатированный телефон (например: +1 213 373 4253)
 */
export function formatPhoneInternational(e164: string): string {
  if (!e164) return e164;

  // Если уже отформатирован (содержит пробелы), возвращаем как есть
  if (e164.includes(' ')) return e164;

  // Убираем всё кроме цифр и +
  const cleaned = e164.replace(/[^\d+]/g, '');
  const digits = cleaned.replace('+', '');

  if (digits.length < 4) return e164;

  // USA/Canada: +1 XXX XXX XXXX
  if (digits.startsWith('1') && digits.length === 11) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  // Russia: +7 XXX XXX XX XX
  if (digits.startsWith('7') && digits.length === 11) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  // UK: +44 XXXX XXXXXX
  if (digits.startsWith('44') && digits.length >= 11 && digits.length <= 13) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }

  // Germany: +49 XXX XXXXXXXX
  if (digits.startsWith('49') && digits.length >= 11 && digits.length <= 14) {
    return `+49 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  // Ukraine: +380 XX XXX XX XX
  if (digits.startsWith('380') && digits.length === 12) {
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }

  // France: +33 X XX XX XX XX
  if (digits.startsWith('33') && digits.length === 11) {
    return `+33 ${digits.slice(2, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  // Универсальный формат: разбиваем на группы
  const parts: string[] = [];
  let remaining = digits;

  // Определяем код страны
  if (digits.startsWith('1') || digits.startsWith('7')) {
    parts.push(`+${digits[0]}`);
    remaining = digits.slice(1);
  } else if (digits.length > 10) {
    // 3-значный код страны
    parts.push(`+${digits.slice(0, 3)}`);
    remaining = digits.slice(3);
  } else {
    // 2-значный код страны
    parts.push(`+${digits.slice(0, 2)}`);
    remaining = digits.slice(2);
  }

  // Разбиваем на группы по 3
  while (remaining.length > 0) {
    const chunkSize = remaining.length > 4 ? 3 : remaining.length;
    parts.push(remaining.slice(0, chunkSize));
    remaining = remaining.slice(chunkSize);
  }

  return parts.join(' ');
}

/**
 * Очищает телефон до E.164 формата
 * @param phone - телефон в любом формате
 * @returns телефон в E.164 формате
 */
export function cleanPhoneToE164(phone: string): string {
  if (!phone) return phone;

  // Убираем всё кроме цифр
  const digits = phone.replace(/\D/g, '');

  // Добавляем + если нет
  return digits.startsWith('+') ? digits : `+${digits}`;
}

type PhoneType = 'MOBILE' | 'FIXED_LINE' | 'UNKNOWN';

interface PhoneInput {
  e164: string;
  international?: string;
  country?: string;
  type?: PhoneType | string;
  isPrimary?: boolean;
  isVerified?: boolean;
  isSubscribed?: boolean;
  unsubscribedAt?: Date;
  lastSmsAt?: Date;
}

interface NormalizedPhone {
  e164: string;
  international: string;
  country: string;
  type: PhoneType;
  isPrimary: boolean;
  isVerified: boolean;
  isSubscribed: boolean;
  unsubscribedAt?: Date;
  lastSmsAt?: Date;
}

/**
 * Определяет страну по номеру телефона
 */
function detectCountry(e164: string): string {
  const digits = e164.replace(/\D/g, '');

  if (digits.startsWith('1')) return 'US';
  if (digits.startsWith('7')) return 'RU';
  if (digits.startsWith('44')) return 'GB';
  if (digits.startsWith('49')) return 'DE';
  if (digits.startsWith('33')) return 'FR';
  if (digits.startsWith('380')) return 'UA';
  if (digits.startsWith('375')) return 'BY';
  if (digits.startsWith('77')) return 'KZ';

  return 'US'; // default
}

/**
 * Нормализует данные телефона:
 * - Очищает e164
 * - Форматирует international
 * - Определяет country по номеру
 * - Заполняет остальные поля значениями по умолчанию
 */
export function normalizePhone(phone: PhoneInput): NormalizedPhone {
  const e164 = cleanPhoneToE164(phone.e164);
  const international = formatPhoneInternational(e164);
  const country = phone.country || detectCountry(e164);

  return {
    e164,
    international,
    country,
    type: (phone.type as PhoneType) || 'MOBILE',
    isPrimary: phone.isPrimary ?? false,
    isVerified: phone.isVerified ?? false,
    isSubscribed: phone.isSubscribed ?? true,
    ...(phone.unsubscribedAt && { unsubscribedAt: phone.unsubscribedAt }),
    ...(phone.lastSmsAt && { lastSmsAt: phone.lastSmsAt }),
  };
}
