import { isToday } from '@/lib/date-utils'
import type { Task, Postponement } from '@/types'
import { TaskBar } from './TaskBar'

interface TimelineGridLinesProps {
  days: Date[]
  dayWidth: number
}

export function TimelineGridLines({ days, dayWidth }: TimelineGridLinesProps) {
  const todayIndex = days.findIndex(d => isToday(d))

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {days.map((_day, i) => (
        <div
          key={`dsep-${i}`}
          className="absolute top-0 bottom-0 w-px bg-slate-200/50"
          style={{ left: (i + 1) * dayWidth }}
        />
      ))}

      {days.map((day, i) => {
        const dow = day.getDay()
        if (dow === 0 || dow === 6) {
          return (
            <div
              key={`wkend-${i}`}
              className="absolute top-0 bottom-0 bg-slate-50/50"
              style={{ left: i * dayWidth, width: dayWidth }}
            />
          )
        }
        return null
      })}

      {todayIndex >= 0 && (
        <>
          <div
            className="absolute top-0 bottom-0 bg-rose-50/60"
            style={{ left: todayIndex * dayWidth, width: dayWidth }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-300/50 z-[5]"
            style={{ left: todayIndex * dayWidth + dayWidth / 2 }}
          />
        </>
      )}

      {days.map((day, i) =>
        day.getDay() === 1 ? (
          <div
            key={`msep-${i}`}
            className="absolute top-0 bottom-0 w-px bg-slate-300/40"
            style={{ left: i * dayWidth }}
          />
        ) : null
      )}
    </div>
  )
}

interface TimelineGridProps {
  days: Date[]
  dayWidth: number
  tasks: Task[]
  viewStart: Date
  rowHeights?: Record<string, number>
  onPostpone: (id: string, newEndDate: string, reason?: string) => void
  onUpdateStartDate: (id: string, newStartDate: string) => void
  onContextCapture: (task: Task) => void
  onRequestReschedule: (task: Task, newStart: string, newEnd: string) => void
  onReschedule: (id: string, newStartDate: string, newEndDate: string) => void
  onUpdatePostponement: (taskId: string, postponementId: string, patch: Partial<Postponement>) => void
  onDeletePostponement: (taskId: string, postponementId: string) => void
  onRequestShrink: (task: Task, newEndDate: string) => void
}

const DEFAULT_ROW_HEIGHT = 40

export function TimelineGrid({ days, dayWidth, tasks, viewStart, rowHeights, onPostpone, onUpdateStartDate, onContextCapture, onRequestReschedule, onReschedule, onUpdatePostponement, onDeletePostponement, onRequestShrink }: TimelineGridProps) {
  const totalWidth = days.length * dayWidth

  return (
    <div className="relative z-[1]" style={{ width: totalWidth }}>
      {tasks.map((task, idx) => {
        const height = rowHeights?.[task.id] || DEFAULT_ROW_HEIGHT
        return (
          <div
            key={task.id}
            className={`relative border-b border-slate-200/60 hover:bg-slate-50/60 transition-colors ${idx === 0 ? 'border-t border-t-slate-200/60' : ''}`}
            style={{ height }}
          >
            <TaskBar
              task={task}
              dayWidth={dayWidth}
              viewStart={viewStart}
              onPostpone={onPostpone}
              onUpdateStartDate={onUpdateStartDate}
              onContextCapture={onContextCapture}
              onRequestReschedule={onRequestReschedule}
              onReschedule={onReschedule}
              onUpdatePostponement={onUpdatePostponement}
              onDeletePostponement={onDeletePostponement}
              onRequestShrink={onRequestShrink}
            />
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-48 text-muted-foreground/60 text-sm">
          暂无任务
        </div>
      )}
    </div>
  )
}
