import { ChallengeState } from './types'

const TIMEZONE = 'Asia/Seoul'

export const CHALLENGE_START = new Date('2026-11-06T00:00:00+09:00')
export const CHALLENGE_END = new Date('2027-02-03T23:59:59+09:00')
export const CHALLENGE_TARGET_USD = 5000
export const LAST_SAFE_SIGNING = new Date('2027-01-12T23:59:59+09:00')

export function getTodaySeoul(): Date {
  const now = new Date()
  const seoulStr = now.toLocaleString('en-CA', { timeZone: TIMEZONE })
  // en-CA gives YYYY-MM-DD format
  const dateStr = seoulStr.split(',')[0]
  return new Date(dateStr + 'T00:00:00')
}

export function getChallengeState(receivedUsd: number = 0): ChallengeState {
  const today = getTodaySeoul()
  const start = new Date('2026-11-06T00:00:00')
  const end = new Date('2027-02-03T00:00:00')

  const msPerDay = 1000 * 60 * 60 * 24
  const dayNumber = Math.max(1, Math.floor((today.getTime() - start.getTime()) / msPerDay) + 1)
  const totalDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1
  const daysLeft = Math.max(0, Math.floor((end.getTime() - today.getTime()) / msPerDay) + 1)

  const weekNumber = Math.min(13, Math.ceil(dayNumber / 7))

  return {
    startDate: start,
    endDate: end,
    today,
    dayNumber: Math.min(dayNumber, totalDays),
    daysLeft,
    totalDays,
    targetUsd: CHALLENGE_TARGET_USD,
    receivedUsd,
    remaining: Math.max(0, CHALLENGE_TARGET_USD - receivedUsd),
    progressPct: Math.min(100, (receivedUsd / CHALLENGE_TARGET_USD) * 100),
    lastSafeSigningDate: new Date('2027-01-12'),
    weekNumber,
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getWeekDates(weekNumber: number): { start: Date; end: Date } {
  const start = new Date('2026-11-06')
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  // Cap at challenge end
  const end = new Date('2027-02-03')
  return { start: weekStart, end: weekEnd > end ? end : weekEnd }
}
