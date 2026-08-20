import type { Urgency } from '@/types'

export interface UrgencyColorConfig {
  label: string
  color: string
  barBg: string
  barBorder: string
  barText: string
  lightBg: string
  lightBorder: string
  lightText: string
  labelBg: string
  labelBorder: string
  labelText: string
  dot: string
}

export const URGENCY_CONFIG: Record<Urgency, UrgencyColorConfig> = {
  urgent: {
    label: '紧急',
    color: '#F43F5E',
    barBg: 'bg-rose-100',
    barBorder: 'border-rose-300',
    barText: 'text-rose-800',
    lightBg: 'bg-rose-50',
    lightBorder: 'border-rose-200/80',
    lightText: 'text-rose-600',
    labelBg: 'bg-rose-50',
    labelBorder: 'border-rose-200/80',
    labelText: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  high: {
    label: '高',
    color: '#8B5CF6',
    barBg: 'bg-violet-100',
    barBorder: 'border-violet-300',
    barText: 'text-violet-800',
    lightBg: 'bg-violet-50',
    lightBorder: 'border-violet-200/60',
    lightText: 'text-violet-600',
    labelBg: 'bg-violet-50',
    labelBorder: 'border-violet-200/60',
    labelText: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  medium: {
    label: '中',
    color: '#3B82F6',
    barBg: 'bg-blue-100',
    barBorder: 'border-blue-300',
    barText: 'text-blue-800',
    lightBg: 'bg-blue-50',
    lightBorder: 'border-blue-100',
    lightText: 'text-blue-500',
    labelBg: 'bg-blue-50',
    labelBorder: 'border-blue-100',
    labelText: 'text-blue-500',
    dot: 'bg-blue-400',
  },
  low: {
    label: '低',
    color: '#94A3B8',
    barBg: 'bg-slate-100',
    barBorder: 'border-slate-300',
    barText: 'text-slate-700',
    lightBg: 'bg-slate-100',
    lightBorder: 'border-slate-200/80',
    lightText: 'text-slate-500',
    labelBg: 'bg-slate-100',
    labelBorder: 'border-slate-200/80',
    labelText: 'text-slate-500',
    dot: 'bg-slate-400',
  },
}

export const POSTPONE_COLORS = {
  bg: 'bg-amber-100',
  border: 'border-l border-dashed border-amber-400',
  text: 'text-amber-800',
}

export const URGENCY_OPTIONS: Urgency[] = ['urgent', 'high', 'medium', 'low']
