/**
 * Formatting utilities for French real estate simulations
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)} %`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumberWithDecimals(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatSquareMeters(value: number): string {
  return `${formatNumber(value)} m²`;
}
