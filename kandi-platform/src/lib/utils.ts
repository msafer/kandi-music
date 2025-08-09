import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B'
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M'
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: string | number, decimals: number = 4): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (num >= 1) {
    return num.toFixed(2)
  }
  return num.toFixed(decimals)
}

/**
 * Format wallet address with ellipsis
 */
export function formatAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address) return ''
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Format token amount with symbol
 */
export function formatTokenAmount(amount: string | number, symbol: string, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${formatNumber(num)} ${symbol}`
}

/**
 * Calculate time remaining until a future timestamp
 */
export function getTimeRemaining(targetTimestamp: number): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const now = Date.now()
  const total = targetTimestamp - now

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, total }
}

/**
 * Convert Wei to Ether
 */
export function weiToEther(wei: string | number): number {
  const weiNum = typeof wei === 'string' ? BigInt(wei) : BigInt(Math.floor(wei))
  return Number(weiNum) / Math.pow(10, 18)
}

/**
 * Convert Ether to Wei
 */
export function etherToWei(ether: string | number): string {
  const etherNum = typeof ether === 'string' ? parseFloat(ether) : ether
  return (BigInt(Math.floor(etherNum * Math.pow(10, 18)))).toString()
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate random gradient colors for placeholders
 */
export function generateGradient(): string {
  const colors = [
    'from-indigo-500 to-purple-500',
    'from-purple-500 to-pink-500',
    'from-pink-500 to-rose-500',
    'from-rose-500 to-orange-500',
    'from-orange-500 to-yellow-500',
    'from-yellow-500 to-green-500',
    'from-green-500 to-teal-500',
    'from-teal-500 to-cyan-500',
    'from-cyan-500 to-blue-500',
    'from-blue-500 to-indigo-500'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Debounce function for search and input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Check if value is valid number
 */
export function isValidNumber(value: string): boolean {
  return !isNaN(Number(value)) && value.trim() !== ''
}

/**
 * Calculate APY from rate and period
 */
export function calculateAPY(rate: number, periodsPerYear: number = 365): number {
  return Math.pow(1 + rate, periodsPerYear) - 1
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}