import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Utility functions for currency formatting
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100) // Convert cents to reais
}

export function parseCurrencyToCents(value: string): number {
  // Remove all non-numeric characters except comma and dot
  const cleanValue = value.replace(/[^\d,.-]/g, '')
  // Replace comma with dot for decimal separator
  const normalizedValue = cleanValue.replace(',', '.')
  // Parse as float and convert to cents
  const floatValue = parseFloat(normalizedValue) || 0
  return Math.round(floatValue * 100)
}

export function formatCurrencyInput(value: string): string {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '')
  
  if (!numericValue) return ''
  
  // Convert to number and format
  const cents = parseInt(numericValue)
  const reais = cents / 100
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(reais)
}

export function isValidCurrencyInput(value: string): boolean {
  const numericValue = value.replace(/[^\d,.-]/g, '')
  return !isNaN(parseFloat(numericValue.replace(',', '.')))
}

export function cleanCurrencyInput(value: string): string {
  return value.replace(/[^\d,.-]/g, '')
}

