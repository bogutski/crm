import crypto from 'crypto';

// Ключ шифрования из переменных окружения
// В production должен быть установлен PROVIDER_ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.PROVIDER_ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Шифрует объект конфигурации провайдера
 */
export function encryptConfig(config: Record<string, unknown>): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonString = JSON.stringify(config);
  let encrypted = cipher.update(jsonString, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Формат: iv:authTag:encryptedData (все в hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Расшифровывает конфигурацию провайдера
 */
export function decryptConfig(encryptedString: string): Record<string, unknown> {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Неверный формат зашифрованных данных');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Обновляет конфигурацию (partial update)
 */
export function updateEncryptedConfig(
  existingEncrypted: string,
  updates: Partial<Record<string, unknown>>
): string {
  const existing = decryptConfig(existingEncrypted);
  const merged = { ...existing, ...updates };
  return encryptConfig(merged);
}

/**
 * Маскирует чувствительные поля для отображения в UI
 */
export function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      // Маскируем все строки длиннее 8 символов
      if (value.length > 8) {
        masked[key] = value.substring(0, 4) + '****' + value.substring(value.length - 4);
      } else if (value.length > 4) {
        masked[key] = value.substring(0, 2) + '****';
      } else {
        masked[key] = '****';
      }
    } else {
      masked[key] = value;
    }
  }

  return masked;
}
