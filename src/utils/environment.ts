/**
 * Utilidades de ambiente simplificadas
 * Agora que o Supabase usa constantes embutidas, mantemos apenas as funções úteis
 */

export interface EnvironmentInfo {
  isDevelopment: boolean;
  isProduction: boolean;
  mode: string;
  hasImportMeta: boolean;
}

/**
 * Detectar se estamos em modo desenvolvimento
 */
export const isDevelopment = (): boolean => {
  try {
    // Verificação básica do import.meta se disponível
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const mode = import.meta.env.MODE;
      const isProd = import.meta.env.PROD;
      
      if (mode === 'development') return true;
      if (isProd === false) return true;
      if (mode === 'production' || isProd === true) return false;
    }
    
    // Verificação Node.js
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.NODE_ENV === 'development') return true;
      if (process.env.NODE_ENV === 'production') return false;
    }
    
    // Verificação baseada em URL (navegador)
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost') return true;
      if (window.location.hostname === '127.0.0.1') return true;
      if (window.location.port === '3000') return true;
      if (window.location.port === '5173') return true; // Vite
      if (window.location.hostname.includes('.local')) return true;
      if (window.location.hostname.includes('dev.')) return true;
    }
    
    // Padrão: produção para segurança
    return false;
    
  } catch (error) {
    return false;
  }
};

/**
 * Detectar se estamos em modo produção
 */
export const isProduction = (): boolean => {
  return !isDevelopment();
};

/**
 * Obter modo do ambiente como string
 */
export const getEnvironmentMode = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
      return import.meta.env.MODE;
    }
    
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    
    return isDevelopment() ? 'development' : 'production';
  } catch (error) {
    return 'production';
  }
};

/**
 * Obter informações completas do ambiente
 */
export const getEnvironmentInfo = (): EnvironmentInfo => {
  const hasImportMeta = typeof import.meta !== 'undefined';
  const dev = isDevelopment();
  
  return {
    isDevelopment: dev,
    isProduction: !dev,
    mode: getEnvironmentMode(),
    hasImportMeta
  };
};

/**
 * Log apenas em desenvolvimento
 */
export const devLog = (message: string, ...args: any[]): void => {
  if (isDevelopment()) {
    console.log(`[DEV] ${message}`, ...args);
  }
};

/**
 * Log informações do ambiente (apenas em desenvolvimento)
 */
export const logEnvironmentInfo = (): void => {
  if (isDevelopment()) {
    const info = getEnvironmentInfo();
    console.log('🔧 Environment Info:', info);
  }
};

export default {
  isDevelopment,
  isProduction,
  getEnvironmentMode,
  getEnvironmentInfo,
  devLog,
  logEnvironmentInfo
};