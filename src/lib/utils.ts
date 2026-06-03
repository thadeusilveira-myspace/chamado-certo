import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...opts,
  })
}
