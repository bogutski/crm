import { NextRequest } from 'next/server';
import { auth } from '@/modules/user';
import { verifyApiToken, ApiTokenResponse } from '@/modules/api-token';

export interface ApiAuthResult {
  type: 'session' | 'api-token';
  userId?: string;
  apiToken?: ApiTokenResponse;
}

/**
 * Проверяет авторизацию для API запроса.
 * Поддерживает:
 * - Session-based auth (cookies)
 * - API Token auth (Bearer token)
 *
 * Порядок проверки:
 * 1. Если есть Bearer token в заголовке Authorization — проверяем API токен
 * 2. Иначе проверяем сессию через NextAuth
 */
export async function apiAuth(request: NextRequest): Promise<ApiAuthResult | null> {
  const authHeader = request.headers.get('authorization');

  // Проверяем Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Если токен начинается с crm_sk_, это API токен
    if (token.startsWith('crm_sk_')) {
      const apiToken = await verifyApiToken(token);
      if (apiToken) {
        return {
          type: 'api-token',
          apiToken,
        };
      }
      // API token provided but invalid - don't fall through to session check
      return null;
    }

    // Unknown Bearer token format - don't fall through to session check
    return null;
  }

  // Проверяем сессию (only when no Bearer token is provided)
  const session = await auth();
  if (session?.user?.id) {
    return {
      type: 'session',
      userId: session.user.id,
    };
  }

  return null;
}

/**
 * Проверяет только API токен (без fallback на сессию)
 */
export async function apiTokenAuth(request: NextRequest): Promise<ApiTokenResponse | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyApiToken(token);
}
