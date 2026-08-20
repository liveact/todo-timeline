import { useState } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toDateString, getDefaultEndDate } from '@/lib/date-utils'
import { URGENCY_CONFIG, URGENCY_OPTIONS } from '@/lib/urgency'
import { cn } from '@/lib/utils'
import type { Urgency } from '@/types'

interface HeaderProps {
  onAddTask: (name: string, isInserted: boolean, startDate: string, endDate: string, urgency: Urgency) => void
}

export function Header({ onAddTask }: HeaderProps) {
  const [inputValue, setInputValue] = useState('')
  const [isInserted, setIsInserted] = useState(false)
  const [startDate, setStartDate] = useState(() => toDateString(new Date()))
  const [endDate, setEndDate] = useState(() => getDefaultEndDate())
  const [urgency, setUrgency] = useState<Urgency>('low')

  const handleSubmit = () => {
    const name = inputValue.trim()
    if (!name) return
    onAddTask(name, isInserted, startDate, endDate, urgency)
    setInputValue('')
  }

  return (
    <header className="flex items-center gap-3 px-5 h-14 bg-white shrink-0">
      <Calendar className="h-5 w-5 text-rose-500 shrink-0" />
      <h1 className="text-base font-semibold whitespace-nowrap select-none tracking-tight text-foreground">
        待办
      </h1>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="添加待办..."
          className="h-8 w-44 text-sm bg-background/60"
        />

        <DatePicker
          value={startDate}
          onChange={setStartDate}
          placeholder="开始"
          className="h-8 w-28 text-xs"
        />
        <span className="text-xs text-muted-foreground select-none">→</span>
        <DatePicker
          value={endDate}
          onChange={setEndDate}
          placeholder="结束"
          className="h-8 w-28 text-xs"
        />

        <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
          <SelectTrigger size="sm" className="h-8 text-xs w-[72px] cursor-pointer">
            <span className="flex items-center gap-1.5 flex-1 text-left">
              <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_CONFIG[urgency].dot}`} />
              {URGENCY_CONFIG[urgency].label}
            </span>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[72px]">
            {URGENCY_OPTIONS.map(u => (
              <SelectItem key={u} value={u} className="text-xs cursor-pointer">
                <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_CONFIG[u].dot}`} />
                {URGENCY_CONFIG[u].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex rounded-full bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setIsInserted(false)}
            className={cn(
              'inline-flex items-center justify-center text-xs min-w-[42px] px-3 h-6 rounded-lg cursor-pointer transition-all select-none whitespace-nowrap',
              !isInserted
                ? 'bg-white shadow-sm border border-slate-200 text-foreground font-medium'
                : 'bg-transparent border border-transparent text-muted-foreground',
            )}
          >
            计划
          </button>
          <button
            type="button"
            onClick={() => setIsInserted(true)}
            className={cn(
              'inline-flex items-center justify-center text-xs min-w-[42px] px-3 h-6 rounded-lg cursor-pointer transition-all select-none whitespace-nowrap',
              isInserted
                ? 'bg-white shadow-sm border border-slate-200 text-foreground font-medium'
                : 'bg-transparent border border-transparent text-muted-foreground',
            )}
          >
            插入
          </button>
        </div>

        <Button size="sm" onClick={handleSubmit} disabled={!inputValue.trim()} className="gap-1 cursor-pointer bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="h-3.5 w-3.5" />
          添加
        </Button>
      </div>
    </header>
  )
}
