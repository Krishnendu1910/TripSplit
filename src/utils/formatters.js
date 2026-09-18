import { format, parseISO, isValid } from 'date-fns'

/**
 * Format a monetary amount with currency symbol
 * @param {number} amount
 * @param {string} currencyCode
 * @returns {string}
 */
export function formatCurrency(amount, currencyCode = 'INR') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0'
  }

  const symbolMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    THB: '฿',
    AED: 'AED ',
    JPY: '¥',
    AUD: 'A$',
  }

  const symbol = symbolMap[currencyCode] || `${currencyCode} `
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)

  return `${symbol}${formattedNumber}`
}

/**
 * Format date range in a friendly travel format e.g. "15–18 September 2026"
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Dates pending'

  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    if (!isValid(start)) return 'Dates pending'

    if (!endDate) {
      return format(start, 'dd MMM yyyy')
    }

    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    if (!isValid(end)) return format(start, 'dd MMM yyyy')

    const sameMonth = format(start, 'MMM yyyy') === format(end, 'MMM yyyy')
    if (sameMonth) {
      return `${format(start, 'd')}–${format(end, 'd MMMM yyyy')}`
    }

    return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
  } catch {
    return 'Dates pending'
  }
}
