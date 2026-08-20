import {
  eachDayOfInterval,
  format,
  isWithinInterval,
  differenceInDays,
  isSameDay,
  nextFriday,
  isFriday,
  parseISO,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end })
}

export function formatDay(date: Date): string {
  return format(date, 'd')
}

export function formatWeekday(date: Date): string {
  return format(date, 'EEE', { locale: zhCN })
}

export function formatFullDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function fromDateString(str: string): Date {
  return parseISO(str)
}

export function formatDateChinese(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

export function getDefaultEndDate(): string {
  const today = new Date()
  if (isFriday(today)) {
    return toDateString(today)
  }
  return toDateString(nextFriday(today))
}

export function getTaskPosition(
  taskStart: string,
  taskEnd: string,
  viewStart: Date,
  viewEnd: Date,
  totalDays: number,
): { left: number; width: number; visible: boolean } {
  const tStart = fromDateString(taskStart)
  const tEnd = fromDateString(taskEnd)

  const rangeStart = viewStart
  const rangeEnd = viewEnd

  const taskOverlapsView =
    isWithinInterval(tStart, { start: rangeStart, end: rangeEnd }) ||
    isWithinInterval(tEnd, { start: rangeStart, end: rangeEnd }) ||
    (tStart <= rangeStart && tEnd >= rangeEnd)

  if (!taskOverlapsView) {
    return { left: 0, width: 0, visible: false }
  }

  const effectiveStart = tStart < rangeStart ? rangeStart : tStart
  const effectiveEnd = tEnd > rangeEnd ? rangeEnd : tEnd

  const startOffset = differenceInDays(effectiveStart, rangeStart)
  const duration = differenceInDays(effectiveEnd, effectiveStart) + 1

  const dayWidth = 100 / totalDays
  return {
    left: startOffset * dayWidth,
    width: duration * dayWidth,
    visible: true,
  }
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export { isSameDay, differenceInDays, isFriday, parseISO, format }
