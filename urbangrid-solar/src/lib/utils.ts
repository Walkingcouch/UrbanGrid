import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(new Date(date))
}

export function formatKwh(kwh: number) {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`
  return `${kwh.toFixed(2)} kWh`
}

export function formatKw(kw: number) {
  if (kw >= 1000) return `${(kw / 1000).toFixed(2)} MW`
  return `${kw.toFixed(2)} kW`
}
