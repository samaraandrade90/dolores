import { createClient } from '@supabase/supabase-js'

// Configuração Supabase - Constantes embutidas para máxima compatibilidade
const SUPABASE_URL = 'https://dhfeonwmmloxmbtajkpv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZmVvbndtbWxveG1idGFqa3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDU4NDMsImV4cCI6MjA2NTIyMTg0M30.LGiROktSom5GHc1uFPUYv4PuBZbOdC9e3G9FwJsbQTU'

// Criar cliente Supabase com configuração direta
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Exportar configuração para referência
export const supabaseConfig = {
  url: SUPABASE_URL,
  hasValidConfig: true
};

// Funções utilitárias de moeda
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00'
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Formatação de moeda em tempo real para input
export const formatCurrencyInput = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para centavos e depois para reais
  const amount = parseInt(numbers, 10) / 100;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Parse da string de moeda para número (mais flexível)
export const parseCurrencyToCents = (currencyString: string): number => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0
  }
  
  console.log('🔍 Parsing currency string:', currencyString);
  
  // Remove símbolos de moeda e espaços
  let cleanString = currencyString
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .trim();
  
  console.log('🧹 Clean string after currency removal:', cleanString);
  
  // Se string está vazia, retorna 0
  if (!cleanString) {
    return 0;
  }
  
  let numericValue: number;
  
  // Diferentes formatos suportados:
  // 1.234,56 (brasileiro com milhares)
  // 1234,56 (brasileiro simples)
  // 1,56 (brasileiro decimal)
  // 1234.56 (americano)
  // 1234 (inteiro)
  
  if (cleanString.includes(',') && cleanString.includes('.')) {
    // Formato brasileiro: 1.234,56
    const lastCommaIndex = cleanString.lastIndexOf(',');
    const lastDotIndex = cleanString.lastIndexOf('.');
    
    if (lastCommaIndex > lastDotIndex) {
      // Vírgula é o separador decimal
      const integerPart = cleanString.substring(0, lastCommaIndex).replace(/\./g, '');
      const decimalPart = cleanString.substring(lastCommaIndex + 1);
      numericValue = parseFloat(`${integerPart}.${decimalPart}`);
    } else {
      // Ponto é o separador decimal
      const integerPart = cleanString.substring(0, lastDotIndex).replace(/,/g, '');
      const decimalPart = cleanString.substring(lastDotIndex + 1);
      numericValue = parseFloat(`${integerPart}.${decimalPart}`);
    }
  } else if (cleanString.includes(',') && !cleanString.includes('.')) {
    // Formato brasileiro: 1234,56 ou 1,56
    const parts = cleanString.split(',');
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];
      numericValue = parseFloat(`${integerPart}.${decimalPart}`);
    } else {
      numericValue = parseFloat(cleanString.replace(',', '.'));
    }
  } else if (cleanString.includes('.') && !cleanString.includes(',')) {
    // Formato americano ou brasileiro sem milhares: 1234.56
    const parts = cleanString.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Provável decimal
      numericValue = parseFloat(cleanString);
    } else {
      // Provável separador de milhares
      numericValue = parseFloat(cleanString.replace(/\./g, ''));
    }
  } else {
    // Apenas números: 1234
    numericValue = parseFloat(cleanString);
  }
  
  console.log('🔢 Parsed numeric value:', numericValue);
  
  if (isNaN(numericValue)) {
    console.log('⚠️ Value is NaN, returning 0');
    return 0;
  }
  
  return numericValue;
}

// Nova função para validar entrada durante digitação
export const isValidCurrencyInput = (value: string): boolean => {
  if (!value) return true;
  
  // Permite apenas números, vírgulas, pontos, espaços, R$ e hífen
  const validPattern = /^[R$\s\d,.,-]*$/;
  return validPattern.test(value);
}

// Função para limpar entrada durante digitação (mais permissiva)
export const cleanCurrencyInput = (value: string): string => {
  if (!value) return '';
  
  // Remove caracteres inválidos mas mantém estrutura básica
  return value.replace(/[^R$\s\d,.,-]/g, '');
}

// Definições de tipos para melhor suporte TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          sort_order: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          sort_order?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          sort_order?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          completed: boolean
          date: string
          category_id: string | null
          user_id: string
          frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
          custom_frequency_months: number | null
          value: number | null
          time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          completed?: boolean
          date: string
          category_id?: string | null
          user_id: string
          frequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
          custom_frequency_months?: number | null
          value?: number | null
          time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          completed?: boolean
          date?: string
          category_id?: string | null
          user_id?: string
          frequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
          custom_frequency_months?: number | null
          value?: number | null
          time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      create_default_category_for_user: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      setup_new_user: {
        Args: {
          user_id: string
        }
        Returns: void
      }
    }
  }
}