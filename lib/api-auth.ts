import { NextRequest } from 'next/server';
import { auth } from '@/modules/user';
import { verifyApiToken, ApiTokenResponse } from '@/modules/api-token';

export interface ApiAuthResult {
  type: 'session' | 'api-token' | 'internal';
  userId?: string;
  apiToken?: ApiTokenResponse;
}

/**
 * Проверяет авторизацию для API запроса.
 * Поддерживает:
 * - Session-based auth (cookies)
 * - API Token auth (Bearer token)
 * - Internal auth (X-Internal-User-Id header) - for server-to-server calls
 *
 * Порядок проверки:
 * 1. Если есть X-Internal-User-Id — это внутренний вызов (server-to-server)
 * 2. Если есть Bearer token в заголовке Authorization — проверяем API токен
 * 3. Иначе проверяем сессию через NextAuth
 */
export async function apiAuth(request: NextRequest): Promise<ApiAuthResult | null> {
  // Проверяем внутренний вызов (только для server-to-server)
  const internalUserId = request.headers.get('x-internal-user-id');
  const host = request.headers.get('host') || '';

  console.log('[apiAuth] Checking auth:', {
    hasInternalUserId: !!internalUserId,
    internalUserId,
    host,
  });

  if (internalUserId) {
    // Для безопасности, проверяем что запрос идёт с localhost
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

    if (isLocalhost) {
      console.log('[apiAuth] Internal auth successful for userId:', internalUserId);
      return {
        type: 'internal',
        userId: internalUserId,
      };
    }
    console.log('[apiAuth] Internal auth rejected - not localhost:', host);
    // If not localhost, ignore internal header and continue with normal auth
  }

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
