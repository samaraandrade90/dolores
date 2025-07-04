/**
 * Utilitários para logging seguro que evitam expor dados sensíveis
 */

interface User {
  id?: string;
  email?: string;
  [key: string]: any;
}

interface Session {
  user?: User;
  access_token?: string;
  refresh_token?: string;
  [key: string]: any;
}

/**
 * Log seguro de informações do usuário sem expor dados sensíveis
 */
export const logUserSafely = (user: User | null | undefined, context?: string) => {
  if (!user) {
    console.log(`${context ? `[${context}] ` : ''}❌ No user found`);
    return;
  }

  console.log(`${context ? `[${context}] ` : ''}✅ User authenticated`, {
    hasId: !!user.id,
    hasEmail: !!user.email,
    emailDomain: user.email ? user.email.split('@')[1] : 'unknown',
    userMetadataKeys: user.user_metadata ? Object.keys(user.user_metadata) : []
  });
};

/**
 * Log seguro de informações da sessão sem expor tokens
 */
export const logSessionSafely = (session: Session | null | undefined, context?: string) => {
  if (!session) {
    console.log(`${context ? `[${context}] ` : ''}❌ No session found`);
    return;
  }

  console.log(`${context ? `[${context}] ` : ''}✅ Session active`, {
    hasUser: !!session.user,
    hasAccessToken: !!session.access_token,
    hasRefreshToken: !!session.refresh_token,
    tokenType: session.token_type || 'unknown',
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
  });

  if (session.user) {
    logUserSafely(session.user, context);
  }
};

/**
 * Log seguro de erros de autenticação sem expor detalhes sensíveis
 */
export const logAuthErrorSafely = (error: any, context?: string) => {
  if (!error) return;

  const safeError = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    status: error.status || error.statusCode || 'unknown',
    hasStack: !!error.stack
  };

  console.error(`${context ? `[${context}] ` : ''}❌ Auth error:`, safeError);
};

import { isDevelopment as envIsDevelopment } from './environment.js';

/**
 * Verificar se estamos em modo desenvolvimento
 */
export const isDevelopment = envIsDevelopment;

/**
 * Log condicional apenas em desenvolvimento
 */
export const devLog = (message: string, data?: any) => {
  if (isDevelopment()) {
    console.log(`[DEV] ${message}`, data);
  }
};

/**
 * Log seguro do fluxo OAuth
 */
export const logOAuthFlowSafely = (step: string, success: boolean, error?: any) => {
  if (success) {
    console.log(`✅ OAuth ${step} successful`);
  } else {
    console.error(`❌ OAuth ${step} failed`);
    if (error) {
      logAuthErrorSafely(error, `OAuth ${step}`);
    }
  }
};

/**
 * Sanitizar objetos para remover dados sensíveis antes do logging
 */
export const sanitizeForLogging = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sensitiveKeys = [
    'access_token',
    'refresh_token',
    'authorization',
    'bearer',
    'api_key',
    'apikey',
    'secret',
    'password',
    'token',
    'key'
  ];

  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
};