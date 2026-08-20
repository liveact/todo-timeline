import { formatDay, formatWeekday, isToday } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface DateHeaderProps {
  days: Date[]
  dayWidth: number
}

export function DateHeader({ days, dayWidth }: DateHeaderProps) {
  return (
    <div className="flex shrink-0 h-11 border-b border-border/30" style={{ width: days.length * dayWidth }}>
      {days.map((day, i) => {
        const isTodayDate = isToday(day)
        const isWeekend = day.getDay() === 0 || day.getDay() === 6
        const isFirstOfMonth = day.getDate() === 1
        return (
          <Tooltip key={i}>
            <TooltipTrigger
              render={
                <div
                  className={cn(
                    'flex flex-col items-center justify-center shrink-0 select-none border-r border-slate-100/50',
                    isWeekend && 'bg-slate-50/50',
                  )}
                  style={{ width: dayWidth }}
                />
              }
            >
              <span className={cn(
                'text-[11px] leading-none',
                isTodayDate ? 'text-rose-500 font-medium' : isWeekend ? 'text-muted-foreground/50' : 'text-muted-foreground/70',
              )}>
                {isFirstOfMonth ? `${day.getMonth() + 1}月` : formatWeekday(day)}
              </span>
              <span className={cn(
                'mt-0.5 w-5.5 h-5.5 flex items-center justify-center rounded-full text-xs leading-none',
                isTodayDate
                  ? 'bg-rose-500 text-white font-semibold'
                  : isWeekend ? 'text-muted-foreground/50' : 'text-foreground/70',
              )}>
                {formatDay(day)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-white border border-slate-200 text-foreground rounded-lg px-2.5 py-1 text-xs" arrowClassName="bg-white fill-white">
              {day.getFullYear()}.{String(day.getMonth() + 1).padStart(2, '0')}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
